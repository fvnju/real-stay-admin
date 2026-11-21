import axios, { type InternalAxiosRequestConfig } from "axios";
import { createRefreshGate, readExpiryCookie, type GateTicket } from "./refresh-gate";

/**
 * All backend calls go through the proxy route of this app
 * (`src/app/api/backend/[...path]/route.ts`). The proxy adds the access
 * token from the httpOnly cookie, so the page never holds a token.
 */
export const AxiosInstance = axios.create({
  baseURL: "/api/backend",
});

/**
 * When the access token may have expired, one request goes first and the
 * others wait for its answer, so that only one server refreshes the tokens.
 */
const gate = createRefreshGate(
  () => Date.now(),
  () => (typeof document === "undefined" ? null : readExpiryCookie(document.cookie)),
);
const tickets = new WeakMap<InternalAxiosRequestConfig, GateTicket>();
const leave = (config?: InternalAxiosRequestConfig) => {
  if (!config) return;
  tickets.get(config)?.done();
  tickets.delete(config);
};

AxiosInstance.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;
  const ticket = await gate.enter();
  if (ticket.leader) tickets.set(config, ticket);
  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => {
    leave(response.config);
    return response;
  },
  (error) => {
    leave(error?.config);
    // The proxy answers 401 when the session has ended and it could not
    // refresh it. It has cleared the cookies, so go to the sign-in page.
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);
