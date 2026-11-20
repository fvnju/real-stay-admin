"use client";

import { Card, ToggleButton, ToggleButtonGroup } from "@heroui/react";
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
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { listingsApi } from "@/app/endpoints/properties/properties-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { sanitizeFilterQuery } from "@/app/utils/filter-helpers";
import PropertiesGrid from "./components/PropertiesGrid";
import { PropertiesTable } from "./components/PropertiesTable";
import type { ManageListing } from "./components/listing-actions";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: analytics, isFetching: isFetchingStats } = analyticApi.useAnalyticsQuery({});
  const stats = analytics?.data?.listingStats;

  const { data, isFetching, refetch } = listingsApi.useGetListingsQuery({
    params: {
      status: sanitizeFilterQuery(status),
      search: sanitizeFilterQuery(search),
      page,
      page_size: pageSize,
    },
  });

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
            <ToggleButtonGroup
              aria-label="View"
              selectionMode="single"
              disallowEmptySelection
              size="sm"
              selectedKeys={[view]}
              onSelectionChange={(keys) => {
                const [next] = keys;
                if (next === "grid" || next === "list") setView(next);
              }}
            >
              <ToggleButton id="grid" isIconOnly aria-label="Grid">
                <Icon name="grid" size={16} />
              </ToggleButton>
              <ToggleButton id="list" isIconOnly aria-label="List">
                <Icon name="options-outline" size={16} />
              </ToggleButton>
            </ToggleButtonGroup>
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
