import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "@/utils/configs/constant";
import { safeReturn } from "@/utils/errorHandler";

/**
 * The three steps of a password reset (backend `src/features/auth`):
 * - `request`: `POST /auth/forgot-password` emails a 5-digit code.
 * - `verify`: `POST /auth/forgot-password/verify` checks the code and gives
 *   a reset token.
 * - `change`: `PATCH /auth/change-password` sets the password with the token.
 * The admin has no session here, so this route sends no cookies.
 */
const STEPS = {
  request: { method: "POST", path: "/auth/forgot-password", fields: ["email"] },
  verify: {
    method: "POST",
    path: "/auth/forgot-password/verify",
    fields: ["email", "otp"],
  },
  change: {
    method: "PATCH",
    path: "/auth/change-password",
    fields: ["email", "password", "reset_token"],
  },
} as const;

type Step = keyof typeof STEPS;

export async function POST(request: NextRequest) {
  // Only the pages of the panel may use this route.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const { data: body, error } = await safeReturn(request.json());
  if (error !== null || typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const step = STEPS[input.step as Step];
  if (!step) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  // The backend refuses unknown fields, so send only the fields of the step.
  const payload: Record<string, unknown> = {};
  for (const field of step.fields) payload[field] = input[field];

  const { data: resp, error: respError } = await safeReturn(
    fetch(`${BASE_URL}${step.path}`, {
      method: step.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    }),
  );
  if (respError !== null) {
    return NextResponse.json(
      { error: "Could not reach the server. Try again." },
      { status: 502 },
    );
  }

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    const message = json?.data?.message ?? json?.message;
    return NextResponse.json(
      {
        error:
          (Array.isArray(message) ? message[0] : message) ||
          "Something went wrong. Try again.",
      },
      { status: resp.status },
    );
  }

  // The reset token is the only data that the page needs.
  const data = json?.data ?? json;
  return NextResponse.json({
    reset_token: typeof data?.reset_token === "string" ? data.reset_token : undefined,
  });
}
