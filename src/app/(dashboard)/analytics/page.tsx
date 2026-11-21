"use client";

import { useState } from "react";
import { PageHeader, SegmentTabs } from "@/components/admin";
import { DEFAULT_RANGE, RANGES, type AnalyticsRange } from "@/lib/analytics-metrics";
import {
  ActiveUsersSection,
  ErrorsSection,
  FunnelSection,
  HostsSection,
  PaymentsSection,
  SignupsSection,
} from "./components/sections";

export default function AnalyticsPage() {
  const [days, setDays] = useState<AnalyticsRange>(DEFAULT_RANGE);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analytics"
        description="Numbers come from preview and production builds of the app. Development builds send nothing."
        actions={
          <SegmentTabs
            label="Range"
            segments={RANGES.map((r) => ({ label: `${r} days`, value: String(r) }))}
            value={String(days)}
            onChange={(v) => setDays(Number(v) as AnalyticsRange)}
          />
        }
      />
      <ActiveUsersSection days={days} />
      <SignupsSection days={days} />
      <FunnelSection days={days} />
      <PaymentsSection days={days} />
      <HostsSection days={days} />
      <ErrorsSection days={days} />
    </div>
  );
}
