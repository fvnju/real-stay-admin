import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { AuditLogsData } from "./audit-logs-types";

export const auditLogApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAuditlogs: builder.query<ApiResponse<AuditLogsData>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/audit-logs`,
          method: "GET",
          params,
        };
      },
    }),
  }),
});
