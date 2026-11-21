import { realstayApi } from "@/app/store/storeConfigQuery";
import type { AdminQueue, AdminReport } from "../attention/attention-types";

export type ReportOutcome = "dismissed" | "actioned";

export type ReportsArgs = {
  page: number;
  limit: number;
  status?: string;
  targetType?: string;
  targetId?: string;
};

/** `/v1/admin/reports` (backend `src/features/reports`). A v1 body is `{ data }`. */
export const reportsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getReports: builder.query<{ data: AdminQueue<AdminReport> }, ReportsArgs>({
      query: (params) => ({ url: "/v1/admin/reports", method: "GET", params }),
      providesTags: ["Report"],
    }),
    getReport: builder.query<{ data: AdminReport }, string>({
      query: (id) => ({ url: `/v1/admin/reports/${id}`, method: "GET" }),
      providesTags: ["Report"],
    }),
    resolveReport: builder.mutation<
      { data: AdminReport },
      { id: string; outcome: ReportOutcome; note: string }
    >({
      query: ({ id, outcome, note }) => ({
        url: `/v1/admin/reports/${id}/resolve`,
        method: "POST",
        data: { outcome, note },
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});
