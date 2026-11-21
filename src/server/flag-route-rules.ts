import type { PosthogError } from "./posthog-errors";

/** A flag id from a route segment, or null when it is not a positive integer. */
export function parseFlagId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** The PostHog query of the flag list from the query of the page. */
export function flagListQuery(search: string | null, active: string | null): string {
  const q = new URLSearchParams({ limit: "200" });
  const s = search?.trim().slice(0, 100);
  if (s) q.set("search", s);
  if (active === "true" || active === "false") q.set("active", active);
  return q.toString();
}

export function versionConflict(error: PosthogError): boolean {
  return error.code === "FLAG_CHANGED";
}

/**
 * True when the flag changed after the admin opened it. PostHog checks
 * `version` only for flags with rules version 2, so the route checks the
 * other flags itself, with the `updated_at` and `version` that the page read.
 */
export function isStaleEdit(
  seen: { updatedAt?: string; version?: number },
  current: { updated_at: string; version?: number }
): boolean {
  if (!seen.updatedAt) return true;
  if (Date.parse(seen.updatedAt) !== Date.parse(current.updated_at)) return true;
  return seen.version !== undefined && current.version !== undefined && seen.version !== current.version;
}
