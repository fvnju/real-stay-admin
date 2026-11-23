import dayjs from "dayjs";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { reportsApi } from "@/app/endpoints/reports/reports-api-slice";
import { verificationsApi } from "@/app/endpoints/verifications/verifications-api-slice";
import { verificationQueueArgs } from "@/lib/verification-rules";
import { auditLogApi } from "@/app/endpoints/auditlogs/audit-logs-api-slice";
import { bookingsApi } from "@/app/endpoints/bookings/bookings-api-slice";
import { listingsApi } from "@/app/endpoints/properties/properties-api-slice";
import { transactionApi } from "@/app/endpoints/transactions/transactions-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import store from "@/app/store/store";
import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import { ANALYTICS_METRICS, DEFAULT_RANGE } from "@/lib/analytics-metrics";
import { pagePermissionOf, permissionStateOf } from "@/lib/permissions";
import { sanitizeFilterQuery } from "@/app/utils/filter-helpers";

/**
 * The first queries of each page of the menu. The pages and `prefetchPage`
 * build their query arguments with the same functions, so a prefetch fills
 * the same RTK Query cache entry that the page reads: the page opens with
 * its data.
 */

export const PAGE_SIZE = 10;
export const LISTINGS_PAGE_SIZE = 12;

type ListFilters = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
};

const listParams = ({ page, pageSize, search = "", status = "" }: ListFilters) => ({
  search: sanitizeFilterQuery(search),
  status: sanitizeFilterQuery(status),
  page,
  page_size: pageSize,
});

export const usersArgs = (
  f: ListFilters & { userType?: string; kyc?: string; flagged?: string },
) => {
  const isDeleted = f.status === "deleted";
  return {
    params: {
      ...listParams({ ...f, status: isDeleted ? "" : f.status }),
      ...(isDeleted ? { deleted: "true" } : {}),
      user_type: sanitizeFilterQuery(f.userType ?? ""),
      kyc: sanitizeFilterQuery(f.kyc ?? ""),
      flagged: sanitizeFilterQuery(f.flagged ?? ""),
    },
  };
};

export const listingsArgs = (f: ListFilters) => ({ params: listParams(f) });

export const bookingsArgs = (f: ListFilters) => ({ params: listParams(f) });

/**
 * The Admins list. The filter "removed" is not a status: it sends
 * `removed=true` (the backend list of removed admins).
 */
export const adminsArgs = (f: ListFilters) =>
  f.status === "removed"
    ? { params: { ...listParams({ ...f, status: "" }), removed: "true" } }
    : { params: listParams(f) };

export const adminsAnalyticsArgs = { params: {} };

export const transactionsArgs = (
  f: ListFilters & { type?: string; startDate?: string; endDate?: string },
) => ({
  params: {
    ...listParams(f),
    type: sanitizeFilterQuery(f.type ?? ""),
    start_date: sanitizeFilterQuery(f.startDate ?? ""),
    end_date: sanitizeFilterQuery(f.endDate ?? ""),
  },
});

export const auditLogsArgs = ({ page, pageSize, search = "" }: ListFilters) => ({
  params: { search: sanitizeFilterQuery(search), page, page_size: pageSize },
});

/** The list of the Reports page. The backend sends the oldest first. */
export const reportsArgs = ({
  page,
  pageSize,
  status = "open",
  targetType = "",
}: { page: number; pageSize: number; status?: string; targetType?: string }) => ({
  page,
  limit: pageSize,
  status,
  ...(targetType ? { targetType } : {}),
});

/** The API takes "YYYY/MM/DD"; a date input gives "YYYY-MM-DD". */
const toApiDate = (v: string) => (v ? v.replaceAll("-", "/") : undefined);

/** The first view of the Feature flags page: all flags, no search. */
export const flagsArgs = (f: { search?: string; active?: "true" | "false" } = {}) => f;

/** The first range of the daily chart of the dashboard: the last month. */
export const defaultDailyRange = () => ({
  startDate: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  endDate: dayjs().format("YYYY-MM-DD"),
});

export const dailyStatsArgs = (startDate: string, endDate: string) => ({
  params: { start_date: toApiDate(startDate), end_date: toApiDate(endDate) },
});

/** Data that is younger than this (seconds) is not loaded again by a prefetch. */
const FRESH_SECONDS = 30;

const first = { page: 1, pageSize: PAGE_SIZE };

const PREFETCH: Record<string, () => unknown[]> = {
  "/reports": () => [
    reportsApi.util.prefetch("getReports", reportsArgs(first), { ifOlderThan: FRESH_SECONDS }),
  ],
  "/verifications": () => [
    verificationsApi.util.prefetch(
      "getVerifications",
      verificationQueueArgs({ queue: "submitted", ...first }),
      { ifOlderThan: FRESH_SECONDS },
    ),
  ],
  "/dashboard": () => {
    const { startDate, endDate } = defaultDailyRange();
    return [
      analyticApi.util.prefetch("analytics", {}, { ifOlderThan: FRESH_SECONDS }),
      analyticApi.util.prefetch("bookingsAnalytics", {}, { ifOlderThan: FRESH_SECONDS }),
      analyticApi.util.prefetch("dailyListingStats", dailyStatsArgs(startDate, endDate), {
        ifOlderThan: FRESH_SECONDS,
      }),
    ];
  },
  "/users": () => [
    userApi.util.prefetch("getUsers", usersArgs(first), {
      ifOlderThan: FRESH_SECONDS,
    }),
    analyticApi.util.prefetch("analytics", {}, { ifOlderThan: FRESH_SECONDS }),
  ],
  "/properties": () => [
    listingsApi.util.prefetch(
      "getListings",
      listingsArgs({ page: 1, pageSize: LISTINGS_PAGE_SIZE }),
      { ifOlderThan: FRESH_SECONDS },
    ),
    analyticApi.util.prefetch("analytics", {}, { ifOlderThan: FRESH_SECONDS }),
  ],
  "/bookings": () => [
    bookingsApi.util.prefetch("getBookings", bookingsArgs(first), {
      ifOlderThan: FRESH_SECONDS,
    }),
    analyticApi.util.prefetch("bookingsAnalytics", {}, { ifOlderThan: FRESH_SECONDS }),
  ],
  "/transactions": () => [
    transactionApi.util.prefetch("getTransactions", transactionsArgs(first), {
      ifOlderThan: FRESH_SECONDS,
    }),
  ],
  "/admin-management": () => [
    userApi.util.prefetch("getAdmins", adminsArgs(first), {
      ifOlderThan: FRESH_SECONDS,
    }),
    analyticApi.util.prefetch("adminsAnalytics", adminsAnalyticsArgs, {
      ifOlderThan: FRESH_SECONDS,
    }),
  ],
  "/analytics": () =>
    ANALYTICS_METRICS.map((metric) =>
      posthogApi.util.prefetch("getMetric", { metric, days: DEFAULT_RANGE }, { ifOlderThan: FRESH_SECONDS }),
    ),
  "/feature-flags": () => [
    posthogApi.util.prefetch("getFlags", flagsArgs(), { ifOlderThan: FRESH_SECONDS }),
  ],
  "/audit-logs": () => [
    auditLogApi.util.prefetch("getAuditlogs", auditLogsArgs(first), {
      ifOlderThan: FRESH_SECONDS,
    }),
  ],
};

/**
 * Starts to load the data of a page of the menu, for example when the
 * pointer goes over its link. Does nothing for other paths.
 */
export function prefetchPage(path: string) {
  // No prefetch of a page that the role cannot open: the backend refuses it.
  const mine = rbacApi.endpoints.getMyPermissions.select()(store.getState());
  const { permission } = pagePermissionOf(path);
  if (permissionStateOf({ ...mine, isLoading: mine.isLoading ?? false }, permission) === "denied") return;
  const thunks = PREFETCH[path]?.();
  if (!thunks) return;
  for (const thunk of thunks) {
    store.dispatch(thunk as Parameters<typeof store.dispatch>[0]);
  }
}

/**
 * True while a query loads and the cache has no data for its arguments. A page
 * shows skeletons only then: data from the cache (for example from a prefetch)
 * shows at once, and a reload in the background does not hide it.
 */
export const waitsForData = (query: { isFetching: boolean; currentData?: unknown }) =>
  query.isFetching && query.currentData === undefined;
