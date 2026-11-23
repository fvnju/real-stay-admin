import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

/**
 * Better Auth client for the admin panel.
 *
 * All calls go to this Next.js app's same-origin proxy at `/api/auth/*`
 * (`src/app/api/auth/[...all]/route.ts`), which forwards to the backend's
 * `/api/auth/*` endpoints and stores the session token exclusively in
 * httpOnly cookies on the panel's origin (no tokens in `localStorage` or JS).
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        firstName: { type: "string", required: false },
        lastName: { type: "string", required: false },
        phoneNumber: { type: "string", required: false },
        gender: { type: "string", required: false },
        userType: { type: "string", required: false },
        status: { type: "string", required: false },
        roleId: { type: "string", required: false },
        hasCompletedKyc: { type: "boolean", required: false },
        isPasswordSet: { type: "boolean", required: false },
      },
    }),
  ],
});

/** Extracts a user-facing error message from a Better Auth client error. */
export function authErrorMessage(
  error: { message?: string | null; statusText?: string | null } | null | undefined,
  fallback: string,
): string {
  const msg = error?.message?.trim();
  if (msg) return msg;
  const statusText = error?.statusText?.trim();
  if (statusText) return statusText;
  return fallback;
}
