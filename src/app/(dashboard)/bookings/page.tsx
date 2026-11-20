"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import {
  formatNaira,
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  statusLabel,
  TablePagination,
} from "@/components/admin";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { bookingsApi } from "@/app/endpoints/bookings/bookings-api-slice";
import { sanitizeFilterQuery } from "@/app/utils/filter-helpers";
import { BookingsTable } from "./components/BookingsTable";
import { BookingStatusEnum } from "./interfaces/bookings.enum";

const STATUSES = [
  { label: "All", value: "" },
  ...Object.values(BookingStatusEnum).map((s) => ({ label: statusLabel(s), value: s })),
];

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isFetching } = bookingsApi.useGetBookingsQuery({
    params: {
      status: sanitizeFilterQuery(status),
      search: sanitizeFilterQuery(search),
      page,
      page_size: pageSize,
    },
  });

  const { data: analytics, isFetching: isFetchingAnalytics } =
    analyticApi.useBookingsAnalyticsQuery({});
  const stats = analytics?.data?.booking_stats;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bookings" description="Every booking request and stay." />

      <StatCards
        isLoading={isFetchingAnalytics}
        items={[
          { label: "Bookings", value: stats?.total_booking_count ?? 0, icon: "calendar" },
          { label: "Gross booking value", value: formatNaira(stats?.total_gtv), icon: "cash-in-outline" },
          { label: "RealStay margin", value: formatNaira(stats?.total_margin), icon: "trending-up-outline" },
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
