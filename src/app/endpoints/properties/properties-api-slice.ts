import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { Listing, ListingResponse, ListingsResponse } from "./properties-types";

export const listingsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getListing: builder.query<ApiResponse<Listing>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/listing/${path?.id}`,
          method: "GET",
        };
      },
    }),
    manageListing: builder.mutation<ApiResponse<ListingsResponse>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/listing/review/${path?.id}/${path?.action}`,
          method: "PATCH",
        };
      },
    }),
    getListings: builder.query<ApiResponse<ListingsResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/listing`,
          method: "GET",
          params,
        };
      },
    }),
  }),
});
