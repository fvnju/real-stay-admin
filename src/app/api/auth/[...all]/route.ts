import { NextRequest, NextResponse } from "next/server";

import {
  extractBetterAuthToken,
  isAdminBetterAuthUser,
  isAllowedBetterAuthRoute,
  sanitizeBetterAuthBody,
  toSessionUser,
} from "@/server/better-auth-proxy";
import {
  BA_SESSION_COOKIE,
  clearSession,
  writeBetterAuthSession,
} from "@/server/session";
import { BASE_URL } from "@/utils/configs/constant";

/**
 * Same-origin proxy to the backend's Better Auth endpoints (`/api/auth/*`).
 *
 * Keeps session tokens strictly in first-party httpOnly cookies on the panel's
 * origin (`ba_session_token`) so XSS cannot read tokens and cross-site cookie
 * restrictions between Vercel and Heroku never block staff sign-in.
 */
export const dynamic = "force-dynamic";

async function revokeUpstreamSession(token: string, origin: string) {
  await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Origin: origin,
    },
    body: "{}",
    cache: "no-store",
  }).catch(() => undefined);
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> },
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { code: "BAD_ORIGIN", message: "Bad origin" },
        { status: 403 },
      );
    }
  }

  const segments = (await params).all;
  const path = segments.map(encodeURIComponent).join("/");
  if (!isAllowedBetterAuthRoute(request.method, path)) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Auth endpoint not available" },
      { status: 404 },
    );
  }

  const baToken = request.cookies.get(BA_SESSION_COOKIE)?.value;

  if (path === "get-session" && !baToken) {
    return NextResponse.json(null, { status: 200 });
  }

  const origin = request.headers.get("origin") || request.nextUrl.origin;

  if (path === "sign-out") {
    if (baToken) {
      await revokeUpstreamSession(baToken, origin);
    }
    const response = NextResponse.json({ success: true }, { status: 200 });
    clearSession(response.cookies);
    return response;
  }

  const target = `${BASE_URL}/api/auth/${path}${request.nextUrl.search}`;
  const headers = new Headers();
  // Node/Undici fetch on Vercel adds `Sec-Fetch-Mode: cors` on outbound
  // requests, which triggers Better Auth's CSRF origin check. Forward the
  // verified panel origin so Better Auth validates it against `trustedOrigins`.
  headers.set("origin", origin);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);
  if (baToken) headers.set("authorization", `Bearer ${baToken}`);

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message: "Could not reach the server. Check your connection.",
      },
      { status: 502 },
    );
  }

  const json = await upstream.json().catch(() => null);

  if (path === "sign-in/email" && upstream.ok) {
    const token = extractBetterAuthToken(
      upstream.headers.get("set-auth-token"),
      json,
    );
    const sessionUser = toSessionUser(json);

    // The panel is for RealStay staff only. If a non-admin signs in, revoke
    // the just-created Better Auth session immediately and refuse access.
    if (!isAdminBetterAuthUser(json)) {
      if (token) await revokeUpstreamSession(token, origin);
      return NextResponse.json(
        {
          code: "NOT_ADMIN",
          message: "This account is not a RealStay admin account.",
        },
        { status: 403 },
      );
    }

    if (!token || !sessionUser) {
      return NextResponse.json(
        { code: "INVALID_SESSION", message: "Could not establish session." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(sanitizeBetterAuthBody(json), {
      status: upstream.status,
    });
    writeBetterAuthSession(response.cookies, token, sessionUser);
    return response;
  }

  const response = NextResponse.json(sanitizeBetterAuthBody(json), {
    status: upstream.status,
  });

  if (path === "get-session" && (upstream.status === 401 || json === null)) {
    clearSession(response.cookies);
  }

  return response;
}

export { handle as GET, handle as POST };
