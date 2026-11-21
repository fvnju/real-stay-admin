import { describe, expect, it } from "vitest";
import { activeTotalsOf, dailySeriesOf, funnelOf, hostsOf, lastDays, paymentsOf } from "./analytics-views";

describe("lastDays", () => {
  it("lists the UTC dates of the range, the oldest first, today last", () => {
    expect(lastDays(3, new Date("2026-11-21T10:00:00Z"))).toEqual(["2026-11-19", "2026-11-20", "2026-11-21"]);
  });
});

describe("dailySeriesOf", () => {
  const now = new Date("2026-11-21T10:00:00Z");
  it("gives one value per day and role, with 0 for a missing day", () => {
    const rows = [
      { kind: "daily", day: "2026-11-19", role: "guest", users: 2 },
      { kind: "daily", day: "2026-11-21", role: "host", users: 1 },
      { kind: "total", day: "mau", role: "", users: 19 },
    ];
    expect(dailySeriesOf(rows, 3, "users", now)).toEqual({
      days: ["2026-11-19", "2026-11-20", "2026-11-21"],
      series: { guest: [2, 0, 0], host: [0, 0, 1] },
    });
  });
});

describe("activeTotalsOf", () => {
  it("reads DAU, WAU and MAU", () => {
    const rows = [
      { kind: "total", day: "dau", role: "", users: 1 },
      { kind: "total", day: "wau", role: "", users: 13 },
      { kind: "total", day: "mau", role: "", users: 19 },
    ];
    expect(activeTotalsOf(rows)).toEqual({ dau: 1, wau: 13, mau: 19 });
  });
  it("gives 0 for a missing total", () => {
    expect(activeTotalsOf([])).toEqual({ dau: 0, wau: 0, mau: 0 });
  });
});

describe("funnelOf", () => {
  it("counts each step as the users that reached it or a later step", () => {
    const steps = funnelOf([
      { step: 0, users: 6 },
      { step: 2, users: 3 },
      { step: 5, users: 1 },
    ]);
    expect(steps.map((s) => s.users)).toEqual([4, 4, 1, 1, 1]);
    expect(steps[0].label).toBe("Searched");
    expect(steps[1].dropFromPrevious).toBe(0);
    expect(steps[2].dropFromPrevious).toBe(75);
  });
  it("gives zero steps without data", () => {
    expect(funnelOf([]).map((s) => s.users)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("paymentsOf", () => {
  it("reads the counts and the naira total of succeeded payments", () => {
    expect(
      paymentsOf([
        { event: "payment_succeeded", events: 3, amount: 150000 },
        { event: "payment_failed", events: 1, amount: null },
      ]),
    ).toEqual({ started: 0, succeeded: 3, failed: 1, cancelled: 0, revenue: 150000 });
  });
});

describe("hostsOf", () => {
  it("reads published listings and decisions", () => {
    expect(
      hostsOf([
        { event: "listing_published", decision: "", events: 2 },
        { event: "host_booking_decided", decision: "confirm", events: 5 },
        { event: "host_booking_decided", decision: "decline", events: 1 },
      ]),
    ).toEqual({ published: 2, confirmed: 5, declined: 1 });
  });
});
