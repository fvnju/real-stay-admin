"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import {
  NAIRA_FORMAT,
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  statusLabel,
  TablePagination,
  toAmount,
} from "@/components/admin";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { bookingsApi } from "@/app/endpoints/bookings/bookings-api-slice";
import { BookingsTable } from "./components/BookingsTable";
import { BookingStatusEnum } from "./interfaces/bookings.enum";
import { bookingsArgs, PAGE_SIZE, waitsForData } from "@/lib/page-queries";

const STATUSES = [
  { label: "All", value: "" },
  ...Object.values(BookingStatusEnum).map((s) => ({ label: statusLabel(s), value: s })),
];

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const listQuery = bookingsApi.useGetBookingsQuery(
    bookingsArgs({ page, pageSize, search, status }),
  );
  const { data } = listQuery;
  const isFetching = waitsForData(listQuery);

  const analyticsQuery = analyticApi.useBookingsAnalyticsQuery({});
  const { data: analytics } = analyticsQuery;
  const isFetchingAnalytics = waitsForData(analyticsQuery);
  const stats = analytics?.data?.booking_stats;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bookings" description="Every booking request and stay." />

      <StatCards
        isLoading={isFetchingAnalytics}
        items={[
          { label: "Bookings", value: stats?.total_booking_count ?? 0, icon: "calendar" },
          { label: "Gross booking value", value: toAmount(stats?.total_gtv), format: NAIRA_FORMAT, icon: "cash-in-outline" },
          { label: "RealStay margin", value: toAmount(stats?.total_margin), format: NAIRA_FORMAT, icon: "trending-up-outline" },
        ]}
      />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentTabs
            label="Status"
            segments={STATUSES}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <SearchInput
            placeholder="Search guest, host, listing"
            className="w-full sm:w-72"
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
        </div>
        <BookingsTable isFetching={isFetching} bookings={data?.data?.bookings || []} />
        <TablePagination
          total={data?.data?.pagination?.total_items || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
