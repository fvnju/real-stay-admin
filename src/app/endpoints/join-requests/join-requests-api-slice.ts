import { realstayApi } from "@/app/store/storeConfigQuery";
import type { AdminQueue } from "../attention/attention-types";
import type { JoinRequest, JoinRequestSettings } from "./join-requests-types";

const BASE = "/v1/admin/join-requests";

/**
 * Requests of people without an admin account to join the panel. The public
 * form does not use this slice: it calls the backend from the browser
 * (`/request-access`). A v1 body is `{ data }`.
 */
export const joinRequestsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getJoinRequests: builder.query<{ data: AdminQueue<JoinRequest> }, { status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: BASE, method: "GET", params }),
      providesTags: ["JoinRequest"],
    }),
    getJoinRequestSettings: builder.query<{ data: JoinRequestSettings }, void>({
      query: () => ({ url: `${BASE}/settings`, method: "GET" }),
      providesTags: [{ type: "JoinRequest", id: "SETTINGS" }],
    }),
    updateJoinRequestSettings: builder.mutation<{ data: JoinRequestSettings }, JoinRequestSettings>({
      query: (data) => ({ url: `${BASE}/settings`, method: "PATCH", data }),
      invalidatesTags: [{ type: "JoinRequest", id: "SETTINGS" }],
    }),
    approveJoinRequest: builder.mutation<{ data: JoinRequest }, { id: string; roleId: string }>({
      query: ({ id, roleId }) => ({ url: `${BASE}/${id}/approve`, method: "POST", data: { roleId } }),
      // The invite makes a pending admin (or promotes an existing account to admin).
      invalidatesTags: ["JoinRequest", "User"],
    }),
    declineJoinRequest: builder.mutation<{ data: JoinRequest }, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `${BASE}/${id}/decline`, method: "POST", data: { note } }),
      invalidatesTags: ["JoinRequest"],
    }),
  }),
});
