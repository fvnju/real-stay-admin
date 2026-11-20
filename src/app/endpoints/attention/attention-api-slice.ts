import { realstayApi } from "@/app/store/storeConfigQuery";
import type { ApiResponse } from "../api";
import type { AdminQueue, AdminReport, AdminVerification } from "./attention-types";

/** The admin queues that need staff action: open reports and listing verifications. */
export const attentionApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAdminReports: builder.query<
      ApiResponse<AdminQueue<AdminReport>>,
      { status?: string; limit?: number }
    >({
      query: (params) => ({ url: "/v1/admin/reports", method: "GET", params }),
    }),
    getAdminVerifications: builder.query<
      ApiResponse<AdminQueue<AdminVerification>>,
      { status?: string; recheck?: boolean; limit?: number }
    >({
      query: ({ recheck, ...params }) => ({
        url: "/v1/admin/listing-verifications",
        method: "GET",
        params: recheck ? { ...params, recheck: "true" } : params,
      }),
    }),
  }),
});
