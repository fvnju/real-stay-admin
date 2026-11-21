/**
 * The backend rotates the refresh token, and keeps only the newest one. When
 * the access token has expired, two requests at the same time can reach two
 * server instances, which both refresh with the same token: one of them
 * fails and signs the admin out. So when the token may have expired, the
 * page sends one request first, and the others after its answer (which
 * writes the new cookies).
 *
 * `readExpiry` reads the `access_expires` cookie (not httpOnly: it holds
 * only the time). The token itself stays in an httpOnly cookie.
 */
const MARGIN_MS = 10_000;
/** The longest time the other requests wait for the first one. */
const MAX_HOLD_MS = 15_000;

/** The cookie with the time (ms) when the access token expires. Not a secret. */
export const ACCESS_EXPIRES_COOKIE = "access_expires";

/** Reads `access_expires` from `document.cookie`, or null. */
export function readExpiryCookie(cookie: string): number | null {
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${ACCESS_EXPIRES_COOKIE}=`));
  const value = Number(match?.slice(ACCESS_EXPIRES_COOKIE.length + 1));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export type GateTicket = { leader: boolean; done: () => void };

export function createRefreshGate(now: () => number, readExpiry: () => number | null) {
  let pending: Promise<void> | null = null;

  const mayHaveExpired = () => {
    const expiry = readExpiry();
    return expiry === null || expiry - MARGIN_MS <= now();
  };

  async function enter(): Promise<GateTicket> {
    while (pending) await pending;
    if (!mayHaveExpired()) return { leader: false, done: () => {} };
    let release!: () => void;
    pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const mine = pending;
    const done = () => {
      clearTimeout(timer);
      if (pending === mine) pending = null;
      release();
    };
    // A request that never ends (for example a cancel without an answer)
    // must not hold the others for ever.
    const timer = setTimeout(done, MAX_HOLD_MS);
    return { leader: true, done };
  }

  return { enter };
}

/** The `exp` of a JWT, in milliseconds, or null. Reads only; checks nothing. */
export function jwtExpiryMs(token: string): number | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" && Number.isFinite(exp) && exp > 0 ? exp * 1000 : null;
  } catch {
    return null;
  }
}
