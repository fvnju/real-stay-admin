import { realstayApi } from "@/app/store/storeConfigQuery";
import type { AdminQueue } from "../attention/attention-types";
import type { AccessRequest } from "./access-requests-types";

const BASE = "/v1/admin/access-requests";

/** Requests of admins for more permissions or a role. A v1 body is `{ data }`. */
export const accessRequestsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createRequest: builder.mutation<
      { data: AccessRequest },
      { permissions: string[]; roleId?: string; reason: string }
    >({
      query: ({ roleId, ...rest }) => ({ url: BASE, method: "POST", data: roleId ? { ...rest, roleId } : rest }),
      invalidatesTags: ["AccessRequest"],
    }),
    getMyRequest: builder.query<{ data: AccessRequest | null }, void>({
      query: () => ({ url: `${BASE}/mine`, method: "GET" }),
      providesTags: ["AccessRequest"],
    }),
    cancelRequest: builder.mutation<{ data: AccessRequest }, string>({
      query: (id) => ({ url: `${BASE}/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["AccessRequest"],
    }),
    getRequests: builder.query<{ data: AdminQueue<AccessRequest> }, { status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: BASE, method: "GET", params }),
      providesTags: ["AccessRequest"],
    }),
    approveRequest: builder.mutation<{ data: AccessRequest }, { id: string; roleId: string }>({
      query: ({ id, roleId }) => ({ url: `${BASE}/${id}/approve`, method: "POST", data: { roleId } }),
      invalidatesTags: ["AccessRequest", "User"],
    }),
    declineRequest: builder.mutation<{ data: AccessRequest }, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `${BASE}/${id}/decline`, method: "POST", data: { note } }),
      invalidatesTags: ["AccessRequest"],
    }),
  }),
});
