"use client";

import { Card } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  TablePagination,
  totalItems,
  useGuardedAction,
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
import { useScrollRestoration } from "@/lib/scroll-restoration";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

type View = "grid" | "list";

type ListState = {
  page: number;
  pageSize: number;
  status: string;
  search: string;
  view: View;
};

const DEFAULTS: ListState = {
  page: 1,
  pageSize: LISTINGS_PAGE_SIZE,
  status: "",
  search: "",
  view: "grid",
};

const positiveInt = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const readState = (q: URLSearchParams): ListState => ({
  page: positiveInt(q.get("page"), DEFAULTS.page),
  pageSize: positiveInt(q.get("size"), DEFAULTS.pageSize),
  status: q.get("status") ?? DEFAULTS.status,
  search: q.get("q") ?? DEFAULTS.search,
  view: q.get("view") === "list" ? "list" : "grid",
});

/** The query of the list; a default value is not in the URL. */
const toQuery = (s: ListState) => {
  const q = new URLSearchParams();
  if (s.page !== DEFAULTS.page) q.set("page", String(s.page));
  if (s.pageSize !== DEFAULTS.pageSize) q.set("size", String(s.pageSize));
  if (s.status) q.set("status", s.status);
  if (s.search) q.set("q", s.search);
  if (s.view !== DEFAULTS.view) q.set("view", s.view);
  const text = q.toString();
  return text ? `?${text}` : "";
};

export default function PropertiesPage() {
  // The filters, the page and the view are in the URL, so Back from a listing
  // opens the list as the admin left it (useScrollRestoration does the scroll).
  const state = readState(useSearchParams());
  const { page, pageSize, status, search, view } = state;
  const update = (change: Partial<ListState>) => {
    // Read the URL, not `state`: two changes in one event (the pagination sets
    // the size, then the page) must both stay.
    const current = readState(new URLSearchParams(window.location.search));
    // Next.js syncs `useSearchParams` with `replaceState`, without a server request.
    window.history.replaceState(null, "", `${window.location.pathname}${toQuery({ ...current, ...change })}`);
  };
  const setPage = (p: number) => update({ page: p });
  const setPageSize = (size: number) => update({ pageSize: size, page: 1 });

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
  const guard = useGuardedAction();
  const manageUnguarded: ManageListing = async ({ action, id }) => {
    await manageListing({ path: { id, action } })
      .unwrap()
      .then(() => {
        toast.success(action === "activate" ? "Listing activated." : "Listing deactivated.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const manage: ManageListing = async (a) => guard("properties:actions", manageUnguarded)(a);

  const listings = data?.data?.listings || [];
  const loading = isFetching || isLoading;
  useScrollRestoration(!isFetching);

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
            onChange={(v) => update({ status: v, page: 1 })}
          />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <SearchInput
              placeholder="Search title, area, host"
              className="w-full sm:w-72"
              defaultValue={search}
              onSearch={(v) => {
                if (v !== search) update({ search: v, page: 1 });
              }}
            />
            <SegmentedControl
              label="View"
              value={view}
              onChange={(next) => {
                if (next === "grid" || next === "list") update({ view: next });
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
          total={totalItems(data)}
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
