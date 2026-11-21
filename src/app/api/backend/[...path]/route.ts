import { NextRequest, NextResponse } from "next/server";

import { BASE_URL } from "@/utils/configs/constant";
import {
  applySession,
  callBackendWithSession,
  type BackendCall,
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
  { params }: { params: Promise<{ path: string[] }> }
) {
  // A cross-site page must not be able to change data with the cookies of
  // the admin. SameSite=Lax already blocks most of it; also check Origin.
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Bad origin" }, { status: 403 });
    }
  }

  const path = (await params).path.map(encodeURIComponent).join("/");
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

  let call: BackendCall;
  try {
    call = await callBackendWithSession(request.cookies, send);
  } catch {
    return NextResponse.json(
      { data: { message: "Could not reach the RealStay backend" } },
      { status: 502 }
    );
  }
  const backendResponse = call.response;

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  // A session that has ended: the page sends the admin to the sign-in page.
  applySession(response.cookies, call);
  return response;
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
