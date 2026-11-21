import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import type { MyPermissions, Permission } from "@/lib/permissions";
import { BASE_URL } from "@/utils/configs/constant";
import { permissionDecision } from "./permission-decision";
import type { PosthogError } from "./posthog-errors";
import {
  applySession,
  callBackendWithSession,
  currentAccessToken,
  type SessionTokens,
} from "./session";

export type PermissionCheck =
  | { ok: true; accessToken: string | undefined; newTokens: SessionTokens | null }
  | { ok: false; response: NextResponse };

function refuse(status: number, body: object, call?: Parameters<typeof applySession>[1]) {
  const response = NextResponse.json(body, { status });
  if (call) applySession(response.cookies, call);
  return { ok: false as const, response };
}

/**
 * Checks that the signed-in admin has `permission`, with backend
 * `GET /rbac/me`. A request that is not GET must come from a page of the
 * panel (Origin), as in the backend proxy.
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<PermissionCheck> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return refuse(403, { code: "BAD_ORIGIN", message: "Bad origin" });
    }
  }

  let call;
  try {
    call = await callBackendWithSession(request.cookies, (token) =>
      fetch(`${BASE_URL}/rbac/me`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      })
    );
  } catch {
    return refuse(502, { code: "BACKEND_UNAVAILABLE", message: "Could not reach the RealStay backend" });
  }

  const body = (await call.response.json().catch(() => null)) as { data?: MyPermissions } | null;
  const decision = permissionDecision({ status: call.response.status, data: body?.data }, permission);
  switch (decision) {
    case "allow":
      return { ok: true, accessToken: currentAccessToken(request.cookies, call), newTokens: call.newTokens };
    case "deny":
      // The same body as a backend refusal, so the page loads /rbac/me again.
      return refuse(
        403,
        { code: "MISSING_PERMISSION", permission, message: "You do not have permission" },
        call
      );
    case "signed-out":
      return refuse(401, { code: "SIGNED_OUT", message: "Sign in again" }, { newTokens: null, ended: true });
    default:
      return refuse(502, { code: "BACKEND_UNAVAILABLE", message: "Could not check your permissions" }, call);
  }
}

/** Writes refreshed tokens on the response of a route that passed the check. */
export function withSession(response: NextResponse, newTokens: SessionTokens | null): NextResponse {
  applySession(response.cookies, { newTokens, ended: false });
  return response;
}

/** The response of a PostHog error. */
export function posthogErrorResponse(error: PosthogError, newTokens: SessionTokens | null) {
  return withSession(
    NextResponse.json({ code: error.code, message: error.message }, { status: error.status }),
    newTokens
  );
}
