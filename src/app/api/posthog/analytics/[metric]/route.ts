import { NextResponse, type NextRequest } from "next/server";

import { endpointNameFor, parseMetricRequest, rowsOf, type MetricRow } from "@/lib/analytics-metrics";
import { posthogFetch } from "@/server/posthog";
import { posthogErrorResponse, requirePermission, withSession } from "@/server/require-permission";

export const dynamic = "force-dynamic";

/** Results of this server process, kept 5 minutes, so page views do not reach PostHog each time. */
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; rows: MetricRow[] }>();

type Params = { params: Promise<{ metric: string }> };

/** One number set of the Analytics page, from its PostHog endpoint. */
export async function GET(request: NextRequest, { params }: Params) {
  const parsed = parseMetricRequest((await params).metric, request.nextUrl.searchParams.get("days"));
  if (!parsed) {
    return NextResponse.json({ code: "BAD_METRIC", message: "Unknown metric or range." }, { status: 400 });
  }

  const check = await requirePermission(request, "product-analytics:view");
  if (!check.ok) return check.response;

  const name = endpointNameFor(parsed.metric, parsed.days);
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return withSession(NextResponse.json({ data: hit.rows }), check.newTokens);
  }

  const result = await posthogFetch<unknown>(`/endpoints/${name}/run/`, {
    method: "POST",
    body: JSON.stringify({}),
    api: "environments",
  });
  if (!result.ok) return posthogErrorResponse(result.error, check.newTokens);

  const rows = rowsOf(result.data);
  cache.set(name, { at: Date.now(), rows });
  return withSession(NextResponse.json({ data: rows }), check.newTokens);
}
