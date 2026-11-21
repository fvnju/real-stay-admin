import { realstayApi } from "@/app/store/storeConfigQuery";
import type { MyPermissions } from "@/lib/permissions";
import { ApiRequest, ApiResponse } from "../api";
import { Role, RolesResponse } from "./rbac-types";

export type RoleInput = { name: string; description?: string; permissions: string[] };

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
    getRole: builder.query<ApiResponse<Role | null>, string>({
      query: (id) => ({ url: `/rbac/${id}`, method: "GET" }),
      providesTags: ["Role"],
    }),
    createRole: builder.mutation<ApiResponse<Role>, RoleInput>({
      query: (data) => ({ url: "/rbac", method: "POST", data }),
      invalidatesTags: ["Role"],
    }),
    /** A change of a role can change the permissions of the signed-in admin too. */
    updateRole: builder.mutation<ApiResponse<Role>, { id: string } & Partial<RoleInput>>({
      query: ({ id, ...data }) => ({ url: `/rbac/${id}`, method: "PATCH", data }),
      invalidatesTags: ["Role", "MyPermissions"],
    }),
    deleteRole: builder.mutation<ApiResponse<{ id: string; deleted: boolean }>, string>({
      query: (id) => ({ url: `/rbac/${id}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),
    /** `GET /rbac/me`: the role and the permissions of the signed-in admin. */
    getMyPermissions: builder.query<MyPermissions, void>({
      query: () => ({ url: "/rbac/me", method: "GET" }),
      transformResponse: (res: ApiResponse<MyPermissions>) => res.data as MyPermissions,
      providesTags: ["MyPermissions"],
    }),
  }),
});
