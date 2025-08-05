import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BASE_URL, ENVIRONMENT } from "@/utils/configs/constant";
import { AuthResponse } from "@/utils/endpoints/auth/auth-types";
import { safeReturn } from "@/utils/errorHandler";
import { loginSchema } from "@/utils/schema/auth";
import { AuthApiError } from "../types";

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

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
    return NextResponse.json({ error: "Login was not successful" });
  }

  cookieStore.set("access_token", authData.data.access_token, {
    httpOnly: true,
    secure: ENVIRONMENT === "production",
    sameSite: "lax",
    maxAge: 1 * 60 * 60,
    path: "/",
  });
  cookieStore.set("user", JSON.stringify(authData.data.user), {
    httpOnly: false,
    secure: ENVIRONMENT === "production",
    sameSite: "lax",
    maxAge: 1 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({ error: null });
}
