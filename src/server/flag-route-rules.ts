import { FLAG_OPERATORS, type FlagForm } from "@/lib/feature-flag-rules";
import type { PosthogError } from "./posthog-errors";

/** A flag id from a route segment, or null when it is not a positive integer. */
export function parseFlagId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** The PostHog query of the flag list from the query of the page. */
export const FLAG_PAGE_SIZE = 200;

export function flagListQuery(search: string | null, active: string | null, offset = 0): string {
  const q = new URLSearchParams({ limit: String(FLAG_PAGE_SIZE) });
  if (offset > 0) q.set("offset", String(offset));
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

const isText = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number";
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function isFilter(f: unknown): boolean {
  if (!isObj(f)) return false;
  if (f.kind === "cohort") return isNum(f.cohortId);
  return (
    f.kind === "person" &&
    isText(f.key) &&
    isText(f.value) &&
    (FLAG_OPERATORS as readonly string[]).includes(f.operator as string)
  );
}

function isCondition(c: unknown): boolean {
  return (
    isObj(c) &&
    (c.conditionId === null || isText(c.conditionId)) &&
    (c.variant === null || isText(c.variant)) &&
    isNum(c.rollout) &&
    Array.isArray(c.filters) &&
    c.filters.every(isFilter)
  );
}

/**
 * The flag form of a request body, or null when a field has the wrong type.
 * The rules of the values (`validateFlagForm`) run after it.
 */
export function parseFlagForm(body: unknown): FlagForm | null {
  if (!isObj(body)) return null;
  const { key, name, active, type, variants, payloads, conditions, earlyExit } = body;
  if (!isText(key) || !isText(name) || typeof active !== "boolean") return null;
  if (type !== "boolean" && type !== "multivariate") return null;
  if (earlyExit !== undefined && typeof earlyExit !== "boolean") return null;
  if (!Array.isArray(variants) || !variants.every((v) => isObj(v) && isText(v.key) && isText(v.name) && isNum(v.rollout))) {
    return null;
  }
  if (!isObj(payloads) || !Object.values(payloads).every(isText)) return null;
  if (!Array.isArray(conditions) || !conditions.every(isCondition)) return null;
  return body as unknown as FlagForm;
}

/**
 * A 409 on a new flag is not "changed since you opened it": the admin did
 * not open a flag.
 */
export function createError(error: PosthogError): PosthogError {
  if (error.code !== "FLAG_CHANGED") return error;
  return {
    status: 409,
    code: "POSTHOG_ERROR",
    message: "PostHog refused the new flag. Check that the key is not in use, and try again.",
  };
}

/**
 * True when the version after a save is more than one above the version
 * that the route checked: another change came between the check and the
 * save. PostHog may not count versions; then nothing is reported.
 */
export function wasConcurrent(checked: number | undefined, saved: number | undefined): boolean {
  return isNum(checked) && isNum(saved) && saved > checked + 1;
}

/** The page of a flag in PostHog. */
export function posthogFlagUrl(host: string, projectId: string, flagId: number): string {
  return `${host.replace(/\/$/, "")}/project/${projectId}/feature-flags/${flagId}`;
}
