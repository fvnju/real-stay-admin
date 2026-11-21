import type { MetricRow } from "./analytics-metrics";

/** The numbers of the Analytics page, from the endpoint rows. */

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

/** The time zone of the day buckets. The queries use the same zone. */
export const ANALYTICS_TIME_ZONE = "Africa/Lagos";

const lagosDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Lagos dates (`YYYY-MM-DD`) of the last `days` days, today last. */
export function lastDays(days: number, now: Date = new Date()): string[] {
  const [y, m, d] = lagosDate.format(now).split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  return Array.from({ length: days }, (_, i) =>
    new Date(today - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}

/** One value per day for each role, with 0 for a day without data. */
export function dailySeriesOf(
  rows: MetricRow[],
  days: number,
  valueKey: string,
  now: Date = new Date(),
): { days: string[]; series: Record<string, number[]> } {
  const dayList = lastDays(days, now);
  const index = new Map(dayList.map((d, i) => [d, i]));
  const series: Record<string, number[]> = {};
  for (const row of rows) {
    if (row.kind !== undefined && row.kind !== "daily") continue;
    const i = index.get(String(row.day));
    if (i === undefined) continue;
    const role = String(row.role || "unknown");
    series[role] ??= dayList.map(() => 0);
    series[role][i] += num(row[valueKey]);
  }
  return { days: dayList, series };
}

export function activeTotalsOf(rows: MetricRow[]): { dau: number; wau: number; mau: number } {
  const total = (name: string) => num(rows.find((r) => r.kind === "total" && r.day === name)?.users);
  return { dau: total("dau"), wau: total("wau"), mau: total("mau") };
}

export const FUNNEL_STEPS = ["Searched", "Viewed a listing", "Started a booking", "Sent a booking", "Paid"] as const;

export type FunnelStep = {
  label: (typeof FUNNEL_STEPS)[number];
  users: number;
  /** The percent of the users of the step before that did not reach this step. */
  dropFromPrevious: number | null;
};

/** The users of each step: the users whose last step is this step or a later one. */
export function funnelOf(rows: MetricRow[]): FunnelStep[] {
  const atLevel = new Map<number, number>();
  for (const r of rows) atLevel.set(num(r.step), (atLevel.get(num(r.step)) ?? 0) + num(r.users));
  const reached = FUNNEL_STEPS.map((_, i) =>
    [...atLevel.entries()].filter(([level]) => level >= i + 1).reduce((sum, [, users]) => sum + users, 0),
  );
  return FUNNEL_STEPS.map((label, i) => ({
    label,
    users: reached[i],
    dropFromPrevious:
      i === 0 || reached[i - 1] === 0 ? null : Math.round(((reached[i - 1] - reached[i]) / reached[i - 1]) * 100),
  }));
}

export function paymentsOf(rows: MetricRow[]) {
  const count = (event: string) => num(rows.find((r) => r.event === event)?.events);
  return {
    started: count("payment_started"),
    succeeded: count("payment_succeeded"),
    failed: count("payment_failed"),
    cancelled: count("payment_cancelled"),
    revenue: num(rows.find((r) => r.event === "payment_succeeded")?.amount),
  };
}

export function hostsOf(rows: MetricRow[]) {
  const sum = (match: (r: MetricRow) => boolean) => rows.filter(match).reduce((s, r) => s + num(r.events), 0);
  return {
    published: sum((r) => r.event === "listing_published"),
    confirmed: sum((r) => r.event === "host_booking_decided" && r.decision === "confirm"),
    declined: sum((r) => r.event === "host_booking_decided" && r.decision === "decline"),
  };
}

export type ErrorIssue = { issue: string; name: string; occurrences: number; isNew: boolean };

/**
 * The errors of the range: all occurrences, the issues, the issues first
 * seen in the range, and the top issues.
 */
export function errorsOf(rows: MetricRow[]): { occurrences: number; issues: number; newIssues: number; top: ErrorIssue[] } {
  const total = rows.find((r) => r.kind === "total");
  return {
    occurrences: num(total?.occurrences),
    issues: num(total?.issues),
    newIssues: num(total?.is_new),
    top: rows
      .filter((r) => r.kind === "issue")
      .map((r) => ({
        issue: String(r.issue),
        name: String(r.name || "Error"),
        occurrences: num(r.occurrences),
        isNew: num(r.is_new) > 0,
      })),
  };
}
