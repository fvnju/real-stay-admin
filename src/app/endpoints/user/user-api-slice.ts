import { AxiosInstance } from "@/app/store/httpConfig";
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
