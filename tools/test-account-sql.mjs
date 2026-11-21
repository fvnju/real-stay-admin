/**
 * The test-account filters of the PostHog project (Settings > Filter out
 * internal and test users), as HogQL. Saved endpoints do not take the
 * `{filters}` placeholder, so tools/posthog-endpoints.mjs writes the filters
 * into each query. Only cohort filters are written; any other filter stops
 * the script, so a filter is never left out without notice.
 */
export const TEST_ACCOUNTS_PLACEHOLDER = "{{test_accounts}}";

/** @param {Array<{ type?: string, value?: unknown, operator?: string }> | null | undefined} filters */
export function testAccountSql(filters) {
  const parts = (filters ?? []).map((f) => {
    const id = f.value;
    if (f.type === "cohort" && Number.isSafeInteger(id) && id > 0) {
      if (f.operator === "not_in") return `person_id NOT IN COHORT ${id}`;
      if (f.operator === "in") return `person_id IN COHORT ${id}`;
    }
    throw new Error(
      `Unsupported test account filter: ${JSON.stringify(f)}. Add it to tools/test-account-sql.mjs.`
    );
  });
  return `(${parts.length ? parts.join(" AND ") : "1 = 1"})`;
}

/** Puts the filter SQL in each scan of `events`, and checks that each scan has one. */
export function applyTestAccounts(template, sql) {
  const scans = (template.match(/FROM events\b/g) ?? []).length;
  const marks = template.split(TEST_ACCOUNTS_PLACEHOLDER).length - 1;
  if (scans !== marks) {
    throw new Error(`${scans} scans of events but ${marks} ${TEST_ACCOUNTS_PLACEHOLDER}. Add it to each scan.`);
  }
  return template.replaceAll(TEST_ACCOUNTS_PLACEHOLDER, sql);
}
