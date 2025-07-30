import { BASE_URL } from "@/app/configs/constant";
import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { UserResponse } from "./user-types";

export const userApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUser: builder.query<ApiResponse<UserResponse>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: BASE_URL + `/users/${path?.id}`,
          method: "GET",
        };
      },
    }),
  }),
});
