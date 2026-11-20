"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  TablePagination,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { SegmentedControl } from "@/components/segmented-control";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { listingsApi } from "@/app/endpoints/properties/properties-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import PropertiesGrid from "./components/PropertiesGrid";
import { PropertiesTable } from "./components/PropertiesTable";
import type { ManageListing } from "./components/listing-actions";
import { LISTINGS_PAGE_SIZE, listingsArgs, waitsForData } from "@/lib/page-queries";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LISTINGS_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const analyticsQuery = analyticApi.useAnalyticsQuery({});
  const { data: analytics } = analyticsQuery;
  const isFetchingStats = waitsForData(analyticsQuery);
  const stats = analytics?.data?.listingStats;

  const listQuery = listingsApi.useGetListingsQuery(
    listingsArgs({ page, pageSize, search, status }),
  );
  const { data, refetch } = listQuery;
  const isFetching = waitsForData(listQuery);

  const [manageListing, { isLoading }] = listingsApi.useManageListingMutation();
  const manage: ManageListing = async ({ action, id }) => {
    await manageListing({ path: { id, action } })
      .unwrap()
      .then(() => {
        toast.success(action === "activate" ? "Listing activated." : "Listing deactivated.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const listings = data?.data?.listings || [];
  const loading = isFetching || isLoading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Properties" description="Places that hosts list on RealStay." />

      <StatCards
        isLoading={isFetchingStats}
        items={[
          { label: "Listings", value: stats?.total_listings, icon: "home" },
          { label: "Active", value: stats?.active_listings, icon: "checkmark-circle-outline" },
          { label: "Inactive", value: stats?.inactive_listings, icon: "close-circle" },
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
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchInput
              placeholder="Search title, area, host"
              className="w-full sm:w-72"
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
            <SegmentedControl
              label="View"
              value={view}
              onChange={(next) => {
                if (next === "grid" || next === "list") setView(next);
              }}
              options={[
                { value: "grid", label: "Grid", content: <Icon name="grid" size={16} /> },
                { value: "list", label: "List", content: <Icon name="options-outline" size={16} /> },
              ]}
            />
          </div>
        </div>

        {view === "grid" ? (
          <PropertiesGrid listings={listings} isFetching={loading} manage={manage} />
        ) : (
          <PropertiesTable listings={listings} isFetching={loading} manage={manage} />
        )}

        <TablePagination
          total={data?.data?.pagination?.total_items || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizes={[12, 24, 48, 96]}
        />
      </Card>
    </div>
  );
}
