import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { ReviewsResponse } from "./reviews-types";

export const reviewsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getReview: builder.query<ApiResponse<ReviewsResponse>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/reviews/${path?.id}`,
          method: "GET",
        };
      },
    }),
    getReviews: builder.query<ApiResponse<ReviewsResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/reviews`,
          method: "GET",
          params,
        };
      },
    }),
  }),
});
