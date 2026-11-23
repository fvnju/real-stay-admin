import { describe, expect, it } from "vitest";
import {
  extractBetterAuthToken,
  isAdminBetterAuthUser,
  isAllowedBetterAuthRoute,
  sanitizeBetterAuthBody,
  toSessionUser,
} from "./better-auth-proxy";

describe("isAllowedBetterAuthRoute", () => {
  it("allows expected admin Better Auth routes and methods", () => {
    expect(isAllowedBetterAuthRoute("POST", "sign-in/email")).toBe(true);
    expect(isAllowedBetterAuthRoute("POST", "sign-out")).toBe(true);
    expect(isAllowedBetterAuthRoute("GET", "get-session")).toBe(true);
    expect(isAllowedBetterAuthRoute("POST", "email-otp/request-password-reset")).toBe(true);
    expect(isAllowedBetterAuthRoute("POST", "email-otp/check-verification-otp")).toBe(true);
    expect(isAllowedBetterAuthRoute("POST", "email-otp/reset-password")).toBe(true);
  });

  it("blocks public signup and unexpected methods", () => {
    expect(isAllowedBetterAuthRoute("POST", "sign-up/email")).toBe(false);
    expect(isAllowedBetterAuthRoute("GET", "sign-in/email")).toBe(false);
    expect(isAllowedBetterAuthRoute("POST", "get-session")).toBe(false);
    expect(isAllowedBetterAuthRoute("DELETE", "sign-out")).toBe(false);
  });
});

describe("extractBetterAuthToken", () => {
  it("prefers the set-auth-token response header", () => {
    expect(
      extractBetterAuthToken("hdr-token", { token: "body-token" }),
    ).toBe("hdr-token");
  });

  it("falls back to body.token when the header is missing", () => {
    expect(extractBetterAuthToken(null, { token: "body-token" })).toBe("body-token");
  });

  it("returns null when neither is present", () => {
    expect(extractBetterAuthToken(null, { user: { id: "1" } })).toBeNull();
    expect(extractBetterAuthToken("  ", null)).toBeNull();
  });
});

describe("isAdminBetterAuthUser", () => {
  it("accepts userType admin", () => {
    expect(isAdminBetterAuthUser({ user: { id: "u1", userType: "admin" } })).toBe(true);
    expect(isAdminBetterAuthUser({ user: { id: "u1", user_type: "admin" } })).toBe(true);
  });

  it("rejects guest, host, and missing userType", () => {
    expect(isAdminBetterAuthUser({ user: { id: "u1", userType: "guest" } })).toBe(false);
    expect(isAdminBetterAuthUser({ user: { id: "u1", userType: "host" } })).toBe(false);
    expect(isAdminBetterAuthUser({ user: { id: "u1" } })).toBe(false);
    expect(isAdminBetterAuthUser(null)).toBe(false);
  });
});

describe("toSessionUser", () => {
  it("maps Better Auth user payload to SessionUser", () => {
    expect(
      toSessionUser({
        user: { id: "65f1a2b3c4d5e6f7a8b9c0d1", email: "admin@realstay.ng", userType: "admin" },
      }),
    ).toEqual({
      id: "65f1a2b3c4d5e6f7a8b9c0d1",
      email: "admin@realstay.ng",
      user_type: "admin",
    });
  });

  it("returns null when id or email is missing", () => {
    expect(toSessionUser({ user: { id: "1" } })).toBeNull();
    expect(toSessionUser({ user: { email: "a@b.com" } })).toBeNull();
    expect(toSessionUser(null)).toBeNull();
  });
});

describe("sanitizeBetterAuthBody", () => {
  it("strips top-level token and nested session.token without mutating input", () => {
    const input = {
      token: "secret-top-token",
      user: { id: "u1", email: "admin@realstay.ng", userType: "admin" },
      session: { id: "s1", userId: "u1", token: "secret-session-token" },
    };
    const out = sanitizeBetterAuthBody(input) as Record<string, unknown>;
    expect(out.token).toBeUndefined();
    expect((out.session as Record<string, unknown>).token).toBeUndefined();
    expect((out.session as Record<string, unknown>).id).toBe("s1");
    expect(out.user).toEqual(input.user);
    expect(input.token).toBe("secret-top-token");
    expect(input.session.token).toBe("secret-session-token");
  });

  it("passes primitives and arrays through unchanged", () => {
    expect(sanitizeBetterAuthBody(null)).toBeNull();
    expect(sanitizeBetterAuthBody("ok")).toBe("ok");
  });
});
