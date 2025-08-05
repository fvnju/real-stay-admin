import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // console.log(path);
  if (path === "/logout") {
    const resp = NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    resp.cookies.delete("access_token");
    return resp;
  }

  const isPublicPath =
    path === "/sign-in" || path === "/forgot-password" || path === "/";

  const token = request.cookies.get("access_token")?.value || "";

  if (!isPublicPath && !token) {
    // console.log(token);
    return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
  }

  if (isPublicPath && token && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|splash.svg|Pic.JPG|edge-tech-logo.svg|blue-logo.svg).*)",
  ],
};
