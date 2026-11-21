"use client";

import { Card, Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { NAIRA_FORMAT, StatCards, toAmount } from "@/components/admin";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import type { AnalyticsMetric, AnalyticsRange, MetricRow } from "@/lib/analytics-metrics";
import { activeTotalsOf, dailySeriesOf, funnelOf, hostsOf, paymentsOf } from "@/lib/analytics-views";
import { waitsForData } from "@/lib/page-queries";
import { PosthogErrorState } from "../../feature-flags/components/posthog-error-state";
import { AnalyticsLineChart } from "./analytics-line-chart";

/** A section of the page: its title, and its data or its error state. */
function MetricSection({
  title,
  description,
  metric,
  days,
  children,
}: {
  title: string;
  description: string;
  metric: AnalyticsMetric;
  days: AnalyticsRange;
  children: (rows: MetricRow[], loading: boolean) => ReactNode;
}) {
  const query = posthogApi.useGetMetricQuery({ metric, days });
  const loading = waitsForData(query);
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {query.error && !query.data ? (
        <PosthogErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        children(query.data ?? [], loading)
      )}
    </section>
  );
}

export function ActiveUsersSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection
      title="Active users"
      description="Users that opened the app. DAU, WAU and MAU are the last 1, 7 and 30 days."
      metric="active-users"
      days={days}
    >
      {(rows, loading) => {
        const totals = activeTotalsOf(rows);
        const daily = dailySeriesOf(rows, days, "users");
        return (
          <>
            <StatCards
              isLoading={loading}
              items={[
                { label: "Daily active", value: totals.dau, icon: "person-outline" },
                { label: "Weekly active", value: totals.wau, icon: "people" },
                { label: "Monthly active", value: totals.mau, icon: "trending-up-outline" },
              ]}
            />
            <Card className="p-4">
              <AnalyticsLineChart label="Active users per day" {...daily} loading={loading} emptyText="No active users in this period." />
            </Card>
          </>
        );
      }}
    </MetricSection>
  );
}

export function SignupsSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection title="Sign-ups" description="New accounts per day, by the role that the user picked." metric="signups" days={days}>
      {(rows, loading) => {
        const daily = dailySeriesOf(rows, days, "signups");
        const total = Object.values(daily.series).flat().reduce((s, n) => s + n, 0);
        return (
          <Card className="gap-3 p-4">
            {loading ? <Skeleton className="h-6 w-32 rounded-md" /> : <p className="text-sm text-muted">{total} in this period</p>}
            <AnalyticsLineChart label="Sign-ups per day" {...daily} loading={loading} emptyText="No sign-ups in this period." />
          </Card>
        );
      }}
    </MetricSection>
  );
}

export function FunnelSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection
      title="Booking funnel"
      description="Users that did each step in this order, within 7 days of their search."
      metric="booking-funnel"
      days={days}
    >
      {(rows, loading) => {
        const steps = funnelOf(rows);
        const first = steps[0].users;
        return (
          <Card className="gap-3 p-4">
            {steps.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{s.label}</span>
                  {loading ? (
                    <Skeleton className="h-4 w-16 rounded-md" />
                  ) : (
                    <span className="tabular-nums">
                      {s.users}
                      {s.dropFromPrevious !== null ? <span className="ml-2 text-muted">−{s.dropFromPrevious}%</span> : null}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-default">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${first ? (s.users / first) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </Card>
        );
      }}
    </MetricSection>
  );
}

export function PaymentsSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection title="Payments" description="Paystack payments that guests started in the app." metric="payments" days={days}>
      {(rows, loading) => {
        const p = paymentsOf(rows);
        return (
          <StatCards
            isLoading={loading}
            items={[
              { label: "Paid", value: p.succeeded, icon: "checkmark-circle-outline" },
              { label: "Revenue", value: toAmount(p.revenue), format: NAIRA_FORMAT, icon: "wallet-outline" },
              { label: "Started", value: p.started, icon: "card-outline" },
              { label: "Failed", value: p.failed, icon: "close-circle-outline" },
              { label: "Cancelled", value: p.cancelled, icon: "close" },
            ]}
          />
        );
      }}
    </MetricSection>
  );
}

export function HostsSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection title="Hosts" description="Listings that hosts published, and their answers to booking requests." metric="hosts" days={days}>
      {(rows, loading) => {
        const h = hostsOf(rows);
        return (
          <StatCards
            isLoading={loading}
            items={[
              { label: "Listings published", value: h.published, icon: "home" },
              { label: "Bookings confirmed", value: h.confirmed, icon: "checkmark-circle-outline" },
              { label: "Bookings declined", value: h.declined, icon: "close-circle-outline" },
            ]}
          />
        );
      }}
    </MetricSection>
  );
}

export function ErrorsSection({ days }: { days: AnalyticsRange }) {
  return (
    <MetricSection title="Errors" description="The app errors with the most occurrences (PostHog error tracking)." metric="errors" days={days}>
      {(rows, loading) => {
        const total = rows.reduce((s, r) => s + (Number(r.occurrences) || 0), 0);
        return (
          <Card className="gap-3 p-4">
            {loading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : rows.length ? (
              <>
                <p className="text-sm text-muted">
                  {total} errors in {rows.length} issues
                </p>
                <ul className="flex flex-col divide-y divide-separator">
                  {rows.slice(0, 5).map((r) => (
                    <li key={String(r.issue)} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="truncate">{String(r.name || "Error")}</span>
                      <span className="shrink-0 tabular-nums text-muted">{String(r.occurrences)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">No errors in this period.</p>
            )}
          </Card>
        );
      }}
    </MetricSection>
  );
}
