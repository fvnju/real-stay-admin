import { realstayApi } from "@/app/store/storeConfigQuery";
import type { VerificationListArgs } from "@/lib/verification-rules";
import type { AdminQueue, AdminVerification } from "../attention/attention-types";

type One = { data: AdminVerification };

/**
 * `/v1/admin/listing-verifications` (backend `src/features/listing-verification`).
 * A v1 body is `{ data }`. A request that another admin changed first gives
 * `409 INVALID_STATE`; the tag loads it again.
 */
export const verificationsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getVerifications: builder.query<{ data: AdminQueue<AdminVerification> }, VerificationListArgs>({
      query: ({ recheck, ...params }) => ({
        url: "/v1/admin/listing-verifications",
        method: "GET",
        params: recheck ? { ...params, recheck: "true" } : params,
      }),
      providesTags: ["Verification"],
    }),
    getVerification: builder.query<One, string>({
      query: (id) => ({ url: `/v1/admin/listing-verifications/${id}`, method: "GET" }),
      providesTags: ["Verification"],
    }),
    approveDocuments: builder.mutation<One, string>({
      query: (id) => ({ url: `/v1/admin/listing-verifications/${id}/approve-documents`, method: "POST" }),
      invalidatesTags: ["Verification"],
    }),
    verifyListing: builder.mutation<One, { id: string; visitedAt?: string; notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `/v1/admin/listing-verifications/${id}/verify`,
        method: "POST",
        data,
      }),
      invalidatesTags: ["Verification"],
    }),
    rejectVerification: builder.mutation<One, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/v1/admin/listing-verifications/${id}/reject`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: ["Verification"],
    }),
    revokeBadge: builder.mutation<One, { listingId: string; reason: string }>({
      query: ({ listingId, reason }) => ({
        url: `/v1/admin/listing-verifications/listings/${listingId}/revoke`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: ["Verification"],
    }),
    clearRecheck: builder.mutation<{ ok: true }, string>({
      query: (listingId) => ({
        url: `/v1/admin/listing-verifications/listings/${listingId}/clear-recheck`,
        method: "POST",
      }),
      invalidatesTags: ["Verification"],
    }),
  }),
});
