/** The numbers of the Analytics page. Each one is a PostHog endpoint. */
export const ANALYTICS_METRICS = [
  "active-users",
  "signups",
  "booking-funnel",
  "payments",
  "hosts",
  "errors",
] as const;
export type AnalyticsMetric = (typeof ANALYTICS_METRICS)[number];

export const RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof RANGES)[number];
export const DEFAULT_RANGE: AnalyticsRange = 30;

/** The metric and range of a request, or null for any other value. */
export function parseMetricRequest(
  metric: string,
  days: string | null
): { metric: AnalyticsMetric; days: AnalyticsRange } | null {
  if (!(ANALYTICS_METRICS as readonly string[]).includes(metric)) return null;
  if (days === null) return { metric: metric as AnalyticsMetric, days: DEFAULT_RANGE };
  const range = RANGES.find((r) => String(r) === days);
  return range ? { metric: metric as AnalyticsMetric, days: range } : null;
}

/** The name of the PostHog endpoint of a metric. */
export function endpointNameOf(metric: AnalyticsMetric): string {
  return `admin-${metric}`;
}

/**
 * The endpoint of a metric for one range. Each range has its own endpoint,
 * so a query needs no SQL variable and PostHog can keep its result.
 */
export function endpointNameFor(metric: AnalyticsMetric, days: AnalyticsRange): string {
  return `${endpointNameOf(metric)}-${days}`;
}

export type MetricRow = Record<string, unknown>;

/**
 * The rows of an endpoint result. A HogQL endpoint answers `columns` and
 * `results` (arrays); this gives one object per row.
 */
export function rowsOf(body: unknown): MetricRow[] {
  if (!body || typeof body !== "object") return [];
  const { columns, results } = body as { columns?: unknown; results?: unknown };
  if (!Array.isArray(results)) return [];
  return results.flatMap((row): MetricRow[] => {
    if (Array.isArray(row)) {
      if (!Array.isArray(columns)) return [];
      return [Object.fromEntries(columns.map((c, i) => [String(c), row[i]]))];
    }
    return row && typeof row === "object" ? [row as MetricRow] : [];
  });
}
