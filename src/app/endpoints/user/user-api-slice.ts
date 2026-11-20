import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { UserResponse, UsersResponse } from "./user-types";

export const userApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getUser: builder.query<ApiResponse<UserResponse>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/users/${path?.id}`,
          method: "GET",
        };
      },
    }),
    getUsers: builder.query<ApiResponse<UsersResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/users`,
          method: "GET",
          params,
        };
      },
    }),
    getAdmins: builder.query<ApiResponse<UsersResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/users/admins`,
          method: "GET",
          params,
        };
      },
    }),
    manageUsers: builder.mutation<ApiResponse<UsersResponse>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/users/${path?.id}/${path?.action}`,
          method: "PATCH",
        };
      },
    }),
  }),
});
