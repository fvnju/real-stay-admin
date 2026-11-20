"use client";

import { Card, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import dayjs from "dayjs";
import { useState } from "react";
import { NAIRA_FORMAT, PageHeader, SegmentTabs, StatCards, toAmount } from "@/components/admin";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { getStatsArray } from "@/app/utils/chart-helper";
import StatsLineChart from "./components/Chart";

const PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
];

const THIS_YEAR = dayjs().year();
const YEARS = Array.from({ length: 5 }, (_, i) => String(THIS_YEAR - i));

/** The API takes "YYYY/MM/DD"; a date input gives "YYYY-MM-DD". */
const toApiDate = (v: string) => (v ? v.replaceAll("-", "/") : undefined);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { data: analytics, isFetching } = analyticApi.useAnalyticsQuery({});
  const users = analytics?.data?.userStats;
  const listings = analytics?.data?.listingStats;

  const { data: bookingAnalytics, isFetching: isFetchingBookings } =
    analyticApi.useBookingsAnalyticsQuery({});
  const bookings = bookingAnalytics?.data?.booking_stats;

  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [startDate, setStartDate] = useState(dayjs().subtract(1, "month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [year, setYear] = useState(String(THIS_YEAR));

  const { data: daily, isFetching: isFetchingDaily } = analyticApi.useDailyListingStatsQuery(
    { params: { start_date: toApiDate(startDate), end_date: toApiDate(endDate) } },
    { skip: period !== "daily" },
  );
  const { data: monthly, isFetching: isFetchingMonthly } = analyticApi.useMonthlyListingStatsQuery(
    { params: { year: Number(year) } },
    { skip: period !== "monthly" },
  );

  const series =
    period === "daily"
      ? daily ? getStatsArray(daily, "daily") : []
      : monthly ? getStatsArray(monthly, "monthly") : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="RealStay at a glance." />

      <Section title="Users">
        <StatCards
          isLoading={isFetching}
          items={[
            { label: "Total users", value: users?.total_users, icon: "people" },
            { label: "Active", value: users?.active_users, icon: "checkmark-circle-outline" },
            { label: "Inactive", value: users?.inactive_users, icon: "close-circle" },
          ]}
        />
      </Section>

      <Section title="Listings">
        <StatCards
          isLoading={isFetching}
          items={[
            { label: "Total listings", value: listings?.total_listings, icon: "home" },
            { label: "Active", value: listings?.active_listings, icon: "checkmark-circle-outline" },
            { label: "Inactive", value: listings?.inactive_listings, icon: "close-circle" },
          ]}
        />
      </Section>

      <Section title="Bookings">
        <StatCards
          isLoading={isFetchingBookings}
          items={[
            { label: "Bookings", value: bookings?.total_booking_count ?? 0, icon: "calendar" },
            { label: "Gross booking value", value: toAmount(bookings?.total_gtv), format: NAIRA_FORMAT, icon: "cash-in-outline" },
            { label: "RealStay margin", value: toAmount(bookings?.total_margin), format: NAIRA_FORMAT, icon: "trending-up-outline" },
          ]}
        />
      </Section>

      <Card className="gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">New listings</h2>
            <p className="text-sm text-muted">
              {period === "daily" ? "Per day in the dates you choose." : `Per month in ${year}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentTabs
              label="Period"
              segments={PERIODS}
              value={period}
              onChange={(v) => setPeriod(v === "monthly" ? "monthly" : "daily")}
            />
            {period === "daily" ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <TextField type="date" value={startDate} onChange={setStartDate} className="w-40">
                  <Label className="sr-only">From</Label>
                  <Input aria-label="From" max={endDate} className="h-9 text-sm" />
                </TextField>
                <span>to</span>
                <TextField type="date" value={endDate} onChange={setEndDate} className="w-40">
                  <Label className="sr-only">To</Label>
                  <Input aria-label="To" min={startDate} className="h-9 text-sm" />
                </TextField>
              </div>
            ) : (
              <Select
                aria-label="Year"
                className="w-28"
                selectedKey={year}
                onSelectionChange={(key) => key && setYear(String(key))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {YEARS.map((y) => (
                      <ListBox.Item key={y} id={y} textValue={y}>
                        {y}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
          </div>
        </div>
        <StatsLineChart
          label="New listings"
          data={series}
          loading={period === "daily" ? isFetchingDaily : isFetchingMonthly}
        />
      </Card>
    </div>
  );
}
