import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "@/utils/configs/constant";
import { AuthResponse } from "@/app/endpoints/auth/auth-types";
import { safeReturn } from "@/utils/errorHandler";
import { writeSession } from "@/server/session";

/**
 * An invited admin sets a password. The backend logs the new admin in;
 * this route keeps the tokens in httpOnly cookies, like the login.
 */
export async function POST(request: NextRequest) {
  const { data: body, error } = await safeReturn(request.json());
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The backend refuses unknown fields (forbidNonWhitelisted), so do not
  // send `confirm_password` of the form.
  const { email, token, password } = (body ?? {}) as Record<string, unknown>;

  const { data: resp, error: respError } = await safeReturn(
    fetch(`${BASE_URL}/auth/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
      cache: "no-store",
    })
  );
  if (respError !== null) {
    return NextResponse.json(
      { error: `Server side: ${respError.message}` },
      { status: 500 }
    );
  }

  const json = await resp.json().catch(() => null);
  if (!resp.ok) {
    return NextResponse.json(
      { error: json?.data?.message || "Could not accept the invite" },
      { status: resp.status }
    );
  }

  const authData = json as AuthResponse | null;
  if (!authData?.data?.access_token || !authData.data.user) {
    return NextResponse.json(
      { error: "Could not accept the invite" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ error: null });
  writeSession(response.cookies, authData.data, authData.data.user);
  return response;
}
