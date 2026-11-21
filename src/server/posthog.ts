import "server-only";

import { NOT_CONFIGURED, UNAVAILABLE, toPosthogError, type PosthogError } from "./posthog-errors";

/**
 * Calls the PostHog API of the project with the personal API key. Only the
 * server has the key (`POSTHOG_PERSONAL_API_KEY`, no `NEXT_PUBLIC_`). A
 * result or an error from here never has the key in it.
 */
export type PosthogResult<T> = { ok: true; data: T } | { ok: false; error: PosthogError };

const TIMEOUT_MS = 10_000;

function config() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://eu.posthog.com";
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!key || !projectId) return null;
  return { key, host: host.replace(/\/$/, ""), projectId };
}

/** The PostHog project page of a path, for "Edit in PostHog" links. */
export function posthogAppUrl(path: string): string {
  const c = config();
  const host = c?.host ?? "https://eu.posthog.com";
  return `${host}/project/${c?.projectId ?? process.env.POSTHOG_PROJECT_ID ?? ""}${path}`;
}

/**
 * `path` is relative to `/api/projects/<project id>`, for example
 * `/feature_flags/`. `revalidate` keeps a GET result in the Next.js cache.
 */
export async function posthogFetch<T>(
  path: string,
  init: RequestInit & { revalidate?: number } = {}
): Promise<PosthogResult<T>> {
  const c = config();
  if (!c) return { ok: false, error: NOT_CONFIGURED };

  const { revalidate, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${c.host}/api/projects/${c.projectId}${path}`, {
      ...rest,
      headers: {
        ...headers,
        authorization: `Bearer ${c.key}`,
        "content-type": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
  } catch {
    return { ok: false, error: UNAVAILABLE };
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: toPosthogError(res.status, body) };
  return { ok: true, data: body as T };
}
