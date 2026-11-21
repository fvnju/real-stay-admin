import { describe, expect, it } from "vitest";
import { TEST_ACCOUNTS_PLACEHOLDER, applyTestAccounts, testAccountSql } from "./test-account-sql.mjs";

describe("testAccountSql", () => {
  it("leaves out the users of a cohort", () => {
    expect(testAccountSql([{ key: "id", type: "cohort", value: 316404, operator: "not_in" }])).toBe(
      "(person_id NOT IN COHORT 316404)",
    );
  });
  it("keeps only the users of a cohort", () => {
    expect(testAccountSql([{ key: "id", type: "cohort", value: 7, operator: "in" }])).toBe("(person_id IN COHORT 7)");
  });
  it("joins many filters with AND", () => {
    expect(
      testAccountSql([
        { type: "cohort", value: 1, operator: "not_in" },
        { type: "cohort", value: 2, operator: "not_in" },
      ]),
    ).toBe("(person_id NOT IN COHORT 1 AND person_id NOT IN COHORT 2)");
  });
  it("is always true without filters", () => {
    expect(testAccountSql([])).toBe("(1 = 1)");
    expect(testAccountSql(null)).toBe("(1 = 1)");
  });
  it.each([
    [{ key: "email", type: "person", value: "@realstay.ng", operator: "not_icontains" }],
    [{ type: "cohort", value: "316404; DROP", operator: "not_in" }],
    [{ type: "cohort", value: 0, operator: "not_in" }],
    [{ type: "cohort", value: 5, operator: "exact" }],
  ])("refuses a filter that it cannot write: %j", (filter) => {
    expect(() => testAccountSql([filter])).toThrow(/test account filter/);
  });
});

describe("applyTestAccounts", () => {
  it("puts the filter in each scan", () => {
    const sql = `SELECT 1 FROM events WHERE a AND ${TEST_ACCOUNTS_PLACEHOLDER} UNION ALL SELECT 2 FROM events WHERE b AND ${TEST_ACCOUNTS_PLACEHOLDER}`;
    expect(applyTestAccounts(sql, "(x)")).toBe("SELECT 1 FROM events WHERE a AND (x) UNION ALL SELECT 2 FROM events WHERE b AND (x)");
  });
  it("refuses a query with a scan of events without the filter", () => {
    expect(() => applyTestAccounts(`SELECT 1 FROM events WHERE a AND ${TEST_ACCOUNTS_PLACEHOLDER} UNION ALL SELECT 2 FROM events WHERE b`, "(x)")).toThrow(
      /2 scans of events but 1/,
    );
  });
});
