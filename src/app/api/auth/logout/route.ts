import { NextResponse } from "next/server";

import { clearSession } from "@/server/session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  clearSession(response.cookies);
  return response;
}
