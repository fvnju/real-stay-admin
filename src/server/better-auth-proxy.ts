import type { SessionUser } from "./session";

export const ALLOWED_BETTER_AUTH_ROUTES: Record<string, ReadonlySet<string>> = {
  "sign-in/email": new Set(["POST"]),
  "sign-out": new Set(["POST"]),
  "get-session": new Set(["GET"]),
  "email-otp/request-password-reset": new Set(["POST"]),
  "email-otp/check-verification-otp": new Set(["POST"]),
  "email-otp/reset-password": new Set(["POST"]),
  "change-password": new Set(["POST"]),
  "revoke-sessions": new Set(["POST"]),
  "revoke-other-sessions": new Set(["POST"]),
};

/** True when `(method, path)` is an allowlisted Better Auth endpoint for the admin panel. */
export function isAllowedBetterAuthRoute(method: string, path: string): boolean {
  const allowed = ALLOWED_BETTER_AUTH_ROUTES[path];
  return Boolean(allowed && allowed.has(method.toUpperCase()));
}

/** Extracts the raw Better Auth session token from response headers or body. */
export function extractBetterAuthToken(
  setAuthTokenHeader: string | null | undefined,
  body: unknown,
): string | null {
  const fromHeader = setAuthTokenHeader?.trim();
  if (fromHeader) return fromHeader;
  if (body && typeof body === "object") {
    const token = (body as { token?: unknown }).token;
    if (typeof token === "string" && token.trim()) return token.trim();
  }
  return null;
}

/** True when the Better Auth user payload belongs to a RealStay admin account. */
export function isAdminBetterAuthUser(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const user = (body as { user?: Record<string, unknown> }).user;
  if (!user || typeof user !== "object") return false;
  return user.userType === "admin" || user.user_type === "admin";
}

/** Maps a Better Auth response body's `user` to the panel's `SessionUser` cookie shape. */
export function toSessionUser(body: unknown): SessionUser | null {
  if (!body || typeof body !== "object") return null;
  const user = (body as { user?: Record<string, unknown> }).user;
  if (!user || typeof user !== "object") return null;
  const id = typeof user.id === "string" ? user.id : "";
  const email = typeof user.email === "string" ? user.email : "";
  if (!id || !email) return null;
  const userType =
    typeof user.userType === "string"
      ? user.userType
      : typeof user.user_type === "string"
        ? user.user_type
        : undefined;
  return { id, email, ...(userType ? { user_type: userType } : {}) };
}

/**
 * Strips raw session tokens from Better Auth JSON responses before forwarding
 * to the browser so page scripts can never read the session token.
 */
export function sanitizeBetterAuthBody(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const record = { ...(body as Record<string, unknown>) };
  if ("token" in record) delete record.token;
  if (
    record.session &&
    typeof record.session === "object" &&
    !Array.isArray(record.session)
  ) {
    const session = { ...(record.session as Record<string, unknown>) };
    if ("token" in session) delete session.token;
    record.session = session;
  }
  return record;
}
