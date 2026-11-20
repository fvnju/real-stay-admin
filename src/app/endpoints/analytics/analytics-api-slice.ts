import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import {
  Analytics,
  BookingStatsData,
  StatsResponse
} from "./analytics-types";

export const analyticApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    analytics: builder.query<ApiResponse<Analytics>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: "/analytics",
          method: "GET",
          params,
        };
      },
    }),
    adminsAnalytics: builder.query<ApiResponse<Analytics>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: "/analytics/admins",
          method: "GET",
          params,
        };
      },
    }),
    bookingsAnalytics: builder.query<ApiResponse<BookingStatsData>, ApiRequest>(
      {
        query: ({}) => {
          return {
            url: "/analytics/bookings",
            method: "GET",
          };
        },
      }
    ),
    dailyListingStats: builder.query<ApiResponse<StatsResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: "/analytics/listing-analytics/daily",
          method: "GET",
          params,
        };
      },
    }),
    monthlyListingStats: builder.query<ApiResponse<StatsResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: "/analytics/listing-analytics/monthly",
          method: "GET",
          params,
        };
      },
    }),
  }),
});
