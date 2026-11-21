/**
 * The errors of the PostHog routes, as the pages get them. A PostHog
 * response body never goes to the page as it is: it can name the key or
 * other internal details.
 */
export type PosthogErrorCode =
  | "POSTHOG_NOT_CONFIGURED"
  | "POSTHOG_UNAVAILABLE"
  | "FLAG_CHANGED"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "POSTHOG_ERROR";

export type PosthogError = { status: number; code: PosthogErrorCode; message: string };

const GENERIC_BAD_REQUEST = "PostHog refused the request.";

export const NOT_CONFIGURED: PosthogError = {
  status: 503,
  code: "POSTHOG_NOT_CONFIGURED",
  message: "PostHog is not set up.",
};

export const UNAVAILABLE: PosthogError = {
  status: 502,
  code: "POSTHOG_UNAVAILABLE",
  message: "PostHog did not answer. Try again.",
};

/** The `detail` of a PostHog error body, when it is safe to show. */
function safeDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail !== "string" || !detail.trim()) return null;
  if (/phx_|phc_|<[a-z]/i.test(detail)) return null;
  return detail.trim().slice(0, 300);
}

/** Maps a PostHog error response to the error that the page gets. */
export function toPosthogError(status: number, body: unknown): PosthogError {
  if (status === 409) {
    return { status: 409, code: "FLAG_CHANGED", message: "This flag changed since you opened it." };
  }
  if (status === 404) return { status: 404, code: "NOT_FOUND", message: "PostHog has no such item." };
  if (status === 400) {
    return { status: 400, code: "BAD_REQUEST", message: safeDetail(body) ?? GENERIC_BAD_REQUEST };
  }
  if (status >= 500) return UNAVAILABLE;
  return { status: 502, code: "POSTHOG_ERROR", message: "The PostHog request failed." };
}
