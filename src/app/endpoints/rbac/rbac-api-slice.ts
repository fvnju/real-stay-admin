import { realstayApi } from "@/app/store/storeConfigQuery";
import type { MyPermissions } from "@/lib/permissions";
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
      providesTags: ["Role"],
    }),
    /** `GET /rbac/me`: the role and the permissions of the signed-in admin. */
    getMyPermissions: builder.query<MyPermissions, void>({
      query: () => ({ url: "/rbac/me", method: "GET" }),
      transformResponse: (res: ApiResponse<MyPermissions>) => res.data as MyPermissions,
      providesTags: ["MyPermissions"],
    }),
  }),
});
