import { BASE_URL } from "@/app/configs/constant";
import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { AuthData } from "./auth-types";

export const authApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthData>, ApiRequest>({
      query: ({ data }) => {
        return {
          url: BASE_URL + "/auth/login",
          method: "POST",
          data: data,
        };
      },
    }),
  }),
});
