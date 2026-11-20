import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { Booking, BookingsResponse } from "./bookings-types";

export const bookingsApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBookingById: builder.query<ApiResponse<Booking>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/bookings/${path?.id}`,
          method: "GET",
        };
      },
    }),
    getBookings: builder.query<ApiResponse<BookingsResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/bookings`,
          method: "GET",
          params,
        };
      },
    }),
  }),
});
