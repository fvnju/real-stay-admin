import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "@/utils/configs/constant";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  clearSession,
  parseSessionUser,
  refreshTokens,
  writeTokens,
  type SessionTokens,
} from "@/server/session";

/**
 * The pages call the backend through this route: `/api/backend/users`
 * goes to `<backend>/users`. The route adds the access token from the
 * httpOnly cookie, so the token never reaches the page scripts. When the
 * backend answers 401, the route refreshes the tokens once and tries again.
 */
export const dynamic = "force-dynamic";

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition"];

async function handle(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // A cross-site page must not be able to change data with the cookies of
  // the admin. SameSite=Lax already blocks most of it; also check Origin.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
  }

  const path = params.path.map(encodeURIComponent).join("/");
  const target = `${BASE_URL}/${path}${request.nextUrl.search}`;

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const send = (accessToken: string | undefined) => {
    const h = new Headers(headers);
    if (accessToken) h.set("authorization", `Bearer ${accessToken}`);
    return fetch(target, {
      method: request.method,
      headers: h,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  };

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const user = parseSessionUser(request.cookies.get(USER_COOKIE)?.value);

  let newTokens: SessionTokens | null = null;
  let refreshFailed = false;

  const refresh = async () => {
    if (!refreshToken || !user) return null;
    newTokens = await refreshTokens(user.id, refreshToken);
    refreshFailed = !newTokens;
    return newTokens;
  };

  let backendResponse: Response;
  try {
    // The access cookie expires with the token (15 minutes). Without it,
    // refresh first, so that the backend does not answer 401 first.
    const firstToken = accessToken ?? (await refresh())?.access_token;
    backendResponse = await send(firstToken);
    if (backendResponse.status === 401 && !newTokens && refreshToken) {
      const tokens = await refresh();
      if (tokens) backendResponse = await send(tokens.access_token);
    }
  } catch {
    return NextResponse.json(
      { data: { message: "Could not reach the RealStay backend" } },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  if (newTokens) {
    writeTokens(response.cookies, newTokens);
  } else if (refreshFailed || (backendResponse.status === 401 && !refreshToken)) {
    // The session has ended. The page sends the admin to the sign-in page.
    clearSession(response.cookies);
  }
  return response;
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
