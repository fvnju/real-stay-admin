import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { IdentityVerificationData } from "./kyc-types";

export const kycApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUserKyc: builder.query<
      ApiResponse<IdentityVerificationData | null>,
      ApiRequest
    >({
      query: ({ path }) => {
        return {
          url: `/kyc/admin/${path?.id}`,
          method: "GET",
        };
      },
      providesTags: (_result, _error, { path }) => [{ type: "Kyc", id: path?.id }],
    }),
    revokeUserKyc: builder.mutation<
      ApiResponse<{ revoked: true; user_id: string }>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/kyc/admin/${id}/revoke`,
        method: "POST",
        data: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Kyc", id },
        { type: "User", id },
        "User",
      ],
    }),
  }),
});
