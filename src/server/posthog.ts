import "server-only";

import { NOT_CONFIGURED, UNAVAILABLE, posthogResultOf, type PosthogResult } from "./posthog-errors";

export type { PosthogResult };

/**
 * Calls the PostHog API of the project with the personal API key. Only the
 * server has the key (`POSTHOG_PERSONAL_API_KEY`, no `NEXT_PUBLIC_`). A
 * result or an error from here never has the key in it.
 */
const TIMEOUT_MS = 10_000;

function config() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://eu.posthog.com";
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!key || !projectId) return null;
  return { key, host: host.replace(/\/$/, ""), projectId };
}

/**
 * `path` is relative to `/api/projects/<project id>` (or
 * `/api/environments/<project id>` with `api: "environments"`), for example
 * `/feature_flags/`. `revalidate` keeps a GET result in the Next.js cache.
 */
export async function posthogFetch<T>(
  path: string,
  init: RequestInit & { revalidate?: number; api?: "projects" | "environments" } = {}
): Promise<PosthogResult<T>> {
  const c = config();
  if (!c) return { ok: false, error: NOT_CONFIGURED };

  const { revalidate, headers, api = "projects", ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${c.host}/api/${api}/${c.projectId}${path}`, {
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
  return posthogResultOf<T>(res.status, body);
}
