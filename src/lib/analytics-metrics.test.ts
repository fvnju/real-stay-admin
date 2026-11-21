import { describe, expect, it } from "vitest";
import { DEFAULT_RANGE, endpointNameFor, rowsOf, endpointNameOf, parseMetricRequest } from "./analytics-metrics";

describe("parseMetricRequest", () => {
  it("reads a metric and a range", () => {
    expect(parseMetricRequest("signups", "7")).toEqual({ metric: "signups", days: 7 });
  });
  it("uses the default range when none is given", () => {
    expect(parseMetricRequest("signups", null)).toEqual({ metric: "signups", days: DEFAULT_RANGE });
    expect(DEFAULT_RANGE).toBe(30);
  });
  it.each([
    ["signups", "14"],
    ["signups", "7; drop"],
    ["signups", "07"],
    ["users", "7"],
    ["../flags", "7"],
    ["constructor", "7"],
  ])("refuses %p with %p", (metric, days) => {
    expect(parseMetricRequest(metric, days)).toBeNull();
  });
});

describe("endpointNameOf", () => {
  it("gives the PostHog endpoint name", () => {
    expect(endpointNameOf("booking-funnel")).toBe("admin-booking-funnel");
  });
});

describe("endpointNameFor", () => {
  it("adds the range, one endpoint per metric and range", () => {
    expect(endpointNameFor("signups", 90)).toBe("admin-signups-90");
  });
});

describe("rowsOf", () => {
  it("turns columns and result arrays into objects", () => {
    expect(rowsOf({ columns: ["day", "signups"], results: [["2026-11-12", 1]] })).toEqual([
      { day: "2026-11-12", signups: 1 },
    ]);
  });
  it("keeps results that are objects already", () => {
    expect(rowsOf({ results: [{ day: "2026-11-12" }] })).toEqual([{ day: "2026-11-12" }]);
  });
  it.each([null, "x", {}, { results: "x" }])("gives no rows for %p", (body) => {
    expect(rowsOf(body)).toEqual([]);
  });
});
