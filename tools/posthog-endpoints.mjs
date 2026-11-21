#!/usr/bin/env node
/**
 * Makes or updates the PostHog endpoints of the Analytics page: one for
 * each query file in tools/posthog-endpoints/ and each range (7, 30, 90
 * days), named admin-<metric>-<days>. Run it after a change of a query.
 *
 *   POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=339639 node tools/posthog-endpoints.mjs
 *
 * The key needs the scope endpoint:write. The script prints names only.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RANGES = [7, 30, 90];
const key = process.env.POSTHOG_PERSONAL_API_KEY;
const host = (process.env.POSTHOG_HOST || "https://eu.posthog.com").replace(/\/$/, "");
const projectId = process.env.POSTHOG_PROJECT_ID;
if (!key || !projectId) {
  console.error("Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.");
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "posthog-endpoints");
const base = `${host}/api/environments/${projectId}/endpoints`;
const headers = { authorization: `Bearer ${key}`, "content-type": "application/json" };

async function call(method, url, body) {
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, text };
}

let failed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const metric = file.replace(/\.sql$/, "");
  const template = readFileSync(join(dir, file), "utf8");
  for (const days of RANGES) {
    const name = `admin-${metric}-${days}`;
    const endpoint = {
      name,
      description: `Admin panel, Analytics page: ${metric}, last ${days} days. Made by tools/posthog-endpoints.mjs.`,
      query: { kind: "HogQLQuery", query: template.replaceAll("{{days}}", String(days)) },
      data_freshness_seconds: 900,
      is_materialized: true,
      tags: ["admin-panel"],
    };
    const existing = await call("GET", `${base}/${name}/`);
    let result =
      existing.status === 200
        ? await call("PATCH", `${base}/${name}/`, endpoint)
        : await call("POST", `${base}/`, endpoint);
    if (result.status >= 400 && /materiali/i.test(result.text)) {
      // A query that PostHog cannot materialize still works as a live endpoint.
      endpoint.is_materialized = false;
      result =
        existing.status === 200
          ? await call("PATCH", `${base}/${name}/`, endpoint)
          : await call("POST", `${base}/`, endpoint);
    }
    if (result.status >= 400) {
      failed += 1;
      console.error(`${name}: failed (${result.status})`);
    } else {
      console.log(`${name}: ${existing.status === 200 ? "updated" : "created"}${endpoint.is_materialized ? "" : " (not materialized)"}`);
    }
  }
}
process.exit(failed ? 1 : 0);
