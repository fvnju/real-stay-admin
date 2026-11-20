import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest } from "../api";
import { InviteAdminUserPayload } from "./auth-types";

// The login and the accept of an invite go to the routes of this app
// (`/api/auth/login`, `/api/auth/accept-invite`), which keep the tokens in
// httpOnly cookies. Do not call `/auth/login` from the page.
export const authApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    inviteAdmin: builder.mutation<any, ApiRequest<InviteAdminUserPayload>>({
      query: ({ data }) => {
        return {
          url: "/auth/admin-invite",
          method: "POST",
          data: data,
        };
      },
    }),
  }),
});
