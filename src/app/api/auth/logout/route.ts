import { NextRequest, NextResponse } from "next/server";

import { BA_SESSION_COOKIE, clearSession } from "@/server/session";
import { BASE_URL } from "@/utils/configs/constant";

export async function POST(request: NextRequest) {
  const baToken = request.cookies.get(BA_SESSION_COOKIE)?.value;
  if (baToken) {
    await fetch(`${BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${baToken}`,
      },
      body: "{}",
      cache: "no-store",
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ message: "Logged out" });
  clearSession(response.cookies);
  return response;
}
