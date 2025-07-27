import { BASE_URL } from "@/app/configs/constant";
import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { AuthData } from "./auth-types";

export const authApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    login: builder.query<ApiResponse<AuthData>, ApiRequest>({
      query: ({ params }) => ({
        url: BASE_URL + "/auth/login",
        params: params || {},
        refetchOnFocus: true,
        refetchOnMountOrArgChange: true,
      }),
    }),
  }),
});
