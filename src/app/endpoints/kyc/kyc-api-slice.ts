import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { IdentityVerificationData, IdentityVerificationResponse } from "./kyc-types";

export const kycApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUserKyc: builder.query<
      ApiResponse<IdentityVerificationData>,
      ApiRequest
    >({
      query: ({ path }) => {
        return {
          url: `/kyc/admin/${path?.id}`,
          method: "GET",
        };
      },
    }),
  }),
});
