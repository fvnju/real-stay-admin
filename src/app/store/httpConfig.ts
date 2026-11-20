import axios from "axios";

/**
 * All backend calls go through the proxy route of this app
 * (`src/app/api/backend/[...path]/route.ts`). The proxy adds the access
 * token from the httpOnly cookie, so the page never holds a token.
 */
export const AxiosInstance = axios.create({
  baseURL: "/api/backend",
});

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // The proxy answers 401 when the session has ended and it could not
    // refresh it. It has cleared the cookies, so go to the sign-in page.
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);
