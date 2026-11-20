import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "@/utils/configs/constant";
import { AuthResponse } from "@/app/endpoints/auth/auth-types";
import { safeReturn } from "@/utils/errorHandler";
import { loginSchema } from "@/utils/schema/auth";
import { ADMIN_USER_TYPE, writeSession } from "@/server/session";
import { AuthApiError } from "../types";

export async function POST(request: NextRequest) {
  const { data: body, error } = await safeReturn(request.json());
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data, error: err } = await safeReturn(
    loginSchema.validate(body, { abortEarly: false })
  );
  if (err !== null) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { data: authResp, error: authRespError } = await safeReturn(
    fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    })
  );
  if (authRespError !== null) {
    return NextResponse.json(
      { error: `Server side: ${authRespError.message}` },
      { status: 500 }
    );
  }

  if (!authResp.ok) {
    const errorJSON = (await authResp.json()) as AuthApiError;
    return NextResponse.json(
      { error: errorJSON || "Unknown error" },
      { status: authResp.status }
    );
  }

  const { data: authData, error: authDataError } =
    await safeReturn<AuthResponse>(authResp.json());
  if (authDataError !== null) {
    return NextResponse.json({ error: authDataError.message }, { status: 500 });
  }
  if (!authData.success) {
    return NextResponse.json(
      { error: "Login was not successful" },
      { status: 500 }
    );
  }

  // The panel is for RealStay staff only. The backend refuses the admin
  // routes to other users too, but do not give them a session here.
  if (authData.data.user?.user_type !== ADMIN_USER_TYPE) {
    return NextResponse.json(
      { error: "This account is not a RealStay admin account." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ error: null });
  writeSession(response.cookies, authData.data, authData.data.user);
  return response;
}
