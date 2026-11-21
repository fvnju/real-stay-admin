import "server-only";

import type { NextResponse } from "next/server";

import { ACCESS_EXPIRES_COOKIE, jwtExpiryMs } from "@/app/store/refresh-gate";
import { BASE_URL, ENVIRONMENT } from "@/utils/configs/constant";

/**
 * The session of the admin panel lives in httpOnly cookies, so page
 * scripts (and an XSS attack) cannot read the tokens. Only the server
 * routes of this app read them: `/api/auth/*` and `/api/backend/*`.
 */
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const USER_COOKIE = "user";

/** The backend access token is valid for 15 minutes. */
const ACCESS_MAX_AGE = 15 * 60;
/** The backend refresh token is valid for 7 days. */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export const ADMIN_USER_TYPE = "admin";

/** The `user` of a backend login: `{ id, email, user_type }`. */
export type SessionUser = {
  id: string;
  email: string;
  user_type?: string;
};

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

type CookieWriter = Pick<NextResponse["cookies"], "set">;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: ENVIRONMENT === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function writeTokens(cookies: CookieWriter, tokens: SessionTokens) {
  cookies.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(ACCESS_MAX_AGE));
  // Only the time, so the page can send one request first when the token
  // has expired (`src/app/store/refresh-gate.ts`). Not httpOnly.
  const expiry = jwtExpiryMs(tokens.access_token) ?? Date.now() + ACCESS_MAX_AGE * 1000;
  cookies.set(ACCESS_EXPIRES_COOKIE, String(expiry), {
    ...cookieOptions(ACCESS_MAX_AGE),
    httpOnly: false,
  });
  cookies.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(REFRESH_MAX_AGE)
  );
}

export function writeSession(
  cookies: CookieWriter,
  tokens: SessionTokens,
  user: SessionUser
) {
  writeTokens(cookies, tokens);
  cookies.set(
    USER_COOKIE,
    JSON.stringify({ id: user.id, email: user.email, user_type: user.user_type }),
    cookieOptions(REFRESH_MAX_AGE)
  );
}

export function clearSession(cookies: CookieWriter) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE, ACCESS_EXPIRES_COOKIE]) {
    cookies.set(name, "", { ...cookieOptions(0), expires: new Date(0) });
  }
}

export function parseSessionUser(value: string | undefined): SessionUser | null {
  if (!value) return null;
  try {
    const user = JSON.parse(value) as SessionUser;
    return typeof user?.id === "string" && user.id ? user : null;
  } catch {
    return null;
  }
}

/**
 * The backend rotates the refresh token at each refresh, and keeps only
 * the newest one. Two requests that refresh with the same token at the
 * same time would log the admin out. So all requests of this server
 * process share one refresh for each refresh token, and requests that
 * come a little later with the old token get the same new tokens.
 */
const REUSE_MS = 60 * 1000;
const refreshes = new Map<string, Promise<SessionTokens | null>>();

export function refreshTokens(
  userId: string,
  refreshToken: string
): Promise<SessionTokens | null> {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;

  const pending = fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, refresh_token: refreshToken }),
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const body = await res.json();
      const tokens = (body?.data ?? body) as Partial<SessionTokens>;
      if (!tokens?.access_token || !tokens?.refresh_token) return null;
      return tokens as SessionTokens;
    })
    .catch(() => null);

  refreshes.set(refreshToken, pending);
  pending.then((tokens) => {
    // Forget a failed refresh at once, so that the next try can work.
    const keepFor = tokens ? REUSE_MS : 0;
    setTimeout(() => refreshes.delete(refreshToken), keepFor);
  });
  return pending;
}

type CookieReader = { get(name: string): { value: string } | undefined };

export type BackendCall = {
  response: Response;
  /** New tokens after a refresh, to write on the response. */
  newTokens: SessionTokens | null;
  /** The session has ended: clear the cookies. */
  ended: boolean;
};

/**
 * Sends a backend request with the access token of the cookies. Without an
 * access cookie it refreshes first; after a 401 it refreshes once and sends
 * again. The proxy route and the PostHog routes use it.
 */
export async function callBackendWithSession(
  cookies: CookieReader,
  send: (accessToken: string | undefined) => Promise<Response>
): Promise<BackendCall> {
  const accessToken = cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;
  const user = parseSessionUser(cookies.get(USER_COOKIE)?.value);

  let newTokens: SessionTokens | null = null;
  let refreshFailed = false;
  const refresh = async () => {
    if (!refreshToken || !user) return null;
    newTokens = await refreshTokens(user.id, refreshToken);
    refreshFailed = !newTokens;
    return newTokens;
  };

  // The access cookie expires with the token (15 minutes). Without it,
  // refresh first, so that the backend does not answer 401 first.
  const firstToken = accessToken ?? (await refresh())?.access_token;
  let response = await send(firstToken);
  if (response.status === 401 && !newTokens && refreshToken) {
    const tokens = await refresh();
    if (tokens) response = await send(tokens.access_token);
  }
  const ended = !newTokens && (refreshFailed || (response.status === 401 && !refreshToken));
  return { response, newTokens, ended };
}

/** The access token that a later backend request of the same route uses. */
export function currentAccessToken(cookies: CookieReader, call: BackendCall): string | undefined {
  return call.newTokens?.access_token ?? cookies.get(ACCESS_COOKIE)?.value;
}

/** Writes refreshed tokens, or clears an ended session, on a route response. */
export function applySession(cookies: CookieWriter, call: Pick<BackendCall, "newTokens" | "ended">) {
  if (call.newTokens) writeTokens(cookies, call.newTokens);
  else if (call.ended) clearSession(cookies);
}
