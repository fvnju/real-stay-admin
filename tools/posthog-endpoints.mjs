#!/usr/bin/env node
/**
 * Makes or updates the PostHog endpoints of the Analytics page: one for
 * each query file in tools/posthog-endpoints/ and each range (7, 30, 90
 * days), named admin-<metric>-<days>. Run it after a change of a query.
 *
 *   POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=339639 node tools/posthog-endpoints.mjs
 *
 * The key needs the scope endpoint:write. The script prints names only.
 *
 * Each scan of `events` must have `{{test_accounts}}`. The script reads the
 * test-account filters of the project (Settings > Filter out internal and
 * test users) and writes them there (tools/test-account-sql.mjs). Run it
 * again after a change of those settings.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyTestAccounts, testAccountSql } from "./test-account-sql.mjs";

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

const project = await call("GET", `${host}/api/projects/${projectId}/`);
if (project.status !== 200) {
  console.error(`Could not read the project settings (${project.status}). The key needs project:read. ${reasonOf(project.text)}`);
  process.exit(1);
}
const testAccounts = testAccountSql(JSON.parse(project.text).test_account_filters);
console.log(`Test accounts: ${testAccounts}`);

/** The `detail` of a PostHog error, without anything that looks like a key. */
function reasonOf(text) {
  let detail = text;
  try {
    detail = JSON.parse(text).detail ?? text;
  } catch {}
  return String(detail).replace(/ph[a-z]_[A-Za-z0-9]+/g, "[key]").slice(0, 200);
}

let failed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const metric = file.replace(/\.sql$/, "");
  const template = readFileSync(join(dir, file), "utf8");
  let filtered;
  try {
    filtered = applyTestAccounts(template, testAccounts);
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    failed += 1;
    continue;
  }
  for (const days of RANGES) {
    const name = `admin-${metric}-${days}`;
    const endpoint = {
      name,
      description: `Admin panel, Analytics page: ${metric}, last ${days} days. Made by tools/posthog-endpoints.mjs.`,
      query: { kind: "HogQLQuery", query: filtered.replaceAll("{{days}}", String(days)) },
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
      console.error(`${name}: failed (${result.status}) ${reasonOf(result.text)}`);
    } else {
      console.log(`${name}: ${existing.status === 200 ? "updated" : "created"}${endpoint.is_materialized ? "" : " (not materialized)"}`);
    }
  }
}
process.exit(failed ? 1 : 0);
