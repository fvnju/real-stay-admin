import { AxiosInstance } from "@/app/store/httpConfig";
import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import {
  CreateHostResponse,
  DeleteUserResponse,
  User,
  UserNote,
  UserNotesResponse,
  UserResponse,
  UsersResponse,
} from "./user-types";

export interface CreateHostInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  gender?: string;
  user_type?: "guest" | "host";
}

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
      providesTags: (_result, _error, { path }) => [{ type: "User", id: path?.id }],
    }),
    /**
     * Sets the profile photo of a user, as the mobile app does: upload the
     * file (`POST /utility/file-upload`, stored on Cloudinary), then
     * `PATCH /users/:id` with its `image_url`. A `null` photo removes it.
     */
    setProfilePhoto: builder.mutation<null, { id: string; photo: Blob | null }>({
      queryFn: async ({ id, photo }) => {
        try {
          let imageUrl: string | null = null;
          if (photo) {
            const form = new FormData();
            form.append("file", photo, `profile_${Date.now()}.jpg`);
            const upload = await AxiosInstance.post("/utility/file-upload", form);
            imageUrl = upload.data?.data?.url ?? upload.data?.url ?? null;
            if (!imageUrl) throw new Error("The upload gave no photo URL.");
          }
          await AxiosInstance.patch(`/users/${id}`, { image_url: imageUrl });
          return { data: null };
        } catch (error) {
          const e = error as {
            message?: string;
            response?: { status?: number; data?: { data?: { message?: string }; message?: string } };
          };
          const message =
            e.response?.data?.data?.message ||
            e.response?.data?.message ||
            e.message ||
            "Could not save the photo.";
          // The shape that GetErrorMessage reads.
          return {
            error: {
              status: e.response?.status ?? 500,
              defaultUserMessage: message,
              data: { data: { message } },
            },
          };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    }),
    getUsers: builder.query<ApiResponse<UsersResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/users`,
          method: "GET",
          params,
        };
      },
      providesTags: ["User"],
    }),
    /** `POST /users`: admin creates a host account (`active`, `is_password_set: false`). */
    createHost: builder.mutation<ApiResponse<CreateHostResponse>, CreateHostInput>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        data,
      }),
      invalidatesTags: ["User"],
    }),
    /** `PATCH /users/:id`: admin edits profile fields of a guest or host. */
    updateUser: builder.mutation<ApiResponse<User>, { id: string; data: UpdateUserInput }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }, "User"],
    }),
    /** `POST /users/:id/delete`: soft-deletes a guest or host account. */
    deleteUser: builder.mutation<ApiResponse<DeleteUserResponse>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/users/${id}/delete`,
        method: "POST",
        data: reason ? { reason } : {},
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }, "User"],
    }),
    /** `POST /users/:id/restore`: restores a soft-deleted guest or host account. */
    restoreUser: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({
        url: `/users/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "User", id }, "User"],
    }),
    /** `POST /users/:id/flag`: flags or escalates a guest/host account. */
    flagUser: builder.mutation<ApiResponse<User>, { id: string; reason: string; escalate?: boolean }>({
      query: ({ id, reason, escalate }) => ({
        url: `/users/${id}/flag`,
        method: "POST",
        data: { reason, escalate: !!escalate },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        "User",
        { type: "UserNotes", id },
      ],
    }),
    /** `POST /users/:id/unflag`: clears a flag/escalation with a closing note. */
    unflagUser: builder.mutation<ApiResponse<User>, { id: string; note: string }>({
      query: ({ id, note }) => ({
        url: `/users/${id}/unflag`,
        method: "POST",
        data: { note },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        "User",
        { type: "UserNotes", id },
      ],
    }),
    /** `GET /users/:id/notes`: internal compliance notes & flag history. */
    getUserNotes: builder.query<ApiResponse<UserNotesResponse>, string>({
      query: (id) => ({
        url: `/users/${id}/notes`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "UserNotes", id }],
    }),
    /** `POST /users/:id/notes`: appends an internal compliance note. */
    addUserNote: builder.mutation<ApiResponse<UserNote>, { id: string; body: string }>({
      query: ({ id, body }) => ({
        url: `/users/${id}/notes`,
        method: "POST",
        data: { body },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "UserNotes", id }],
    }),
    getAdmins: builder.query<ApiResponse<UsersResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/users/admins`,
          method: "GET",
          params,
        };
      },
      providesTags: ["User"],
    }),
    /** `PATCH /users/:id/role`: gives an admin another role. */
    changeAdminRole: builder.mutation<ApiResponse<User>, { id: string; roleId: string }>({
      query: ({ id, roleId }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        data: { role_id: roleId },
      }),
      invalidatesTags: ["User", "MyPermissions"],
    }),
    /** `POST /users/:id/remove-admin`: only a Super Admin; a Super Admin only by the owner. */
    removeAdmin: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({ url: `/users/${id}/remove-admin`, method: "POST" }),
      invalidatesTags: ["User"],
    }),
    /** `POST /users/:id/restore-admin`: the same rules. */
    restoreAdmin: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({ url: `/users/${id}/restore-admin`, method: "POST" }),
      invalidatesTags: ["User"],
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
