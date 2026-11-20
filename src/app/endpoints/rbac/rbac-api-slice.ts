import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { RolesResponse } from "./rbac-types";

export const rbacApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getRoles: builder.query<ApiResponse<RolesResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: "/rbac",
          method: "GET",
          params,
        };
      },
    }),
  }),
});
