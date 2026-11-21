import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_EXPIRES_COOKIE, jwtExpiryMs } from "@/app/store/refresh-gate";
import { ENVIRONMENT } from "@/utils/configs/constant";

// The same names as in `src/server/session.ts`.
const SESSION_COOKIES = ["access_token", "refresh_token", "user", ACCESS_EXPIRES_COOKIE];

const PUBLIC_PATHS = ["/", "/sign-in", "/forgot-password", "/accept-invite"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/logout") {
    const resp = NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    for (const name of SESSION_COOKIES) resp.cookies.delete(name);
    return resp;
  }

  const isPublicPath = PUBLIC_PATHS.includes(path);

  // The access token lives 15 minutes, the refresh token 7 days. The
  // session exists while the refresh token exists: `/api/backend` gets a
  // new access token when it needs one.
  const hasSession = !!request.cookies.get("refresh_token")?.value;

  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
  }

  if (isPublicPath && hasSession && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  const response = NextResponse.next();
  // A session from before `access_expires` existed: write it from the token,
  // so that the requests of the page do not wait one by one.
  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken && !request.cookies.get(ACCESS_EXPIRES_COOKIE)?.value) {
    const expiry = jwtExpiryMs(accessToken);
    const maxAge = expiry ? Math.floor((expiry - Date.now()) / 1000) : 0;
    if (expiry && maxAge > 0) {
      response.cookies.set(ACCESS_EXPIRES_COOKIE, String(expiry), {
        httpOnly: false,
        secure: ENVIRONMENT === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    }
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - the public images
     */
    "/((?!api|_next/static|_next/image|favicon.ico|splash.svg|Pic.JPG|edge-tech-logo.svg|blue-logo.svg|Real%20Stay.png|fonts/).*)",
  ],
};
