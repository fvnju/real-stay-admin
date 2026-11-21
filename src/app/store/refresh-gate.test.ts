import { describe, expect, it, vi } from "vitest";
import { createRefreshGate, jwtExpiryMs, readExpiryCookie } from "./refresh-gate";

describe("createRefreshGate", () => {
  it("lets requests go at once while the access token is valid", async () => {
    const gate = createRefreshGate(() => 1_000, () => 120_000);
    const a = await gate.enter();
    const b = await gate.enter();
    expect([a.leader, b.leader]).toEqual([false, false]);
  });

  it("sends one request first when the access token may have expired, then the others", async () => {
    let expiry: number | null = null;
    const gate = createRefreshGate(() => 1_000, () => expiry);
    const first = await gate.enter();
    expect(first.leader).toBe(true);

    let secondIn = false;
    const second = gate.enter().then((t) => {
      secondIn = true;
      return t;
    });
    await Promise.resolve();
    expect(secondIn).toBe(false);

    expiry = 900_000; // The answer of the first request wrote new cookies.
    first.done();
    expect((await second).leader).toBe(false);
    expect(secondIn).toBe(true);
  });

  it("treats a token that expires within 10 seconds as expired", async () => {
    const gate = createRefreshGate(() => 1_000, () => 5_000);
    expect((await gate.enter()).leader).toBe(true);
  });

  it("lets the waiting requests go when the first request fails", async () => {
    const gate = createRefreshGate(() => 1_000, () => null);
    const first = await gate.enter();
    const second = gate.enter();
    first.done();
    // Still no expiry: the next request leads again, not a deadlock.
    expect((await second).leader).toBe(true);
  });
});

describe("createRefreshGate time limit", () => {
  it("lets the others go after 15 seconds when the first request never ends", async () => {
    vi.useFakeTimers();
    try {
      let expiry: number | null = null;
      const gate = createRefreshGate(() => 1_000, () => expiry);
      await gate.enter(); // Never calls done().
      const second = gate.enter();
      expiry = 900_000;
      await vi.advanceTimersByTimeAsync(15_000);
      expect((await second).leader).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("readExpiryCookie", () => {
  it("reads the time from the cookies", () => {
    expect(readExpiryCookie("theme=dark; access_expires=1764000000000; x=1")).toBe(1764000000000);
  });
  it.each(["", "theme=dark", "access_expires=abc", "access_expires=-5"])("gives null for %p", (cookie) => {
    expect(readExpiryCookie(cookie)).toBeNull();
  });
});

describe("jwtExpiryMs", () => {
  const jwt = (payload: object) =>
    `x.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
  it("reads exp (seconds) as milliseconds", () => {
    expect(jwtExpiryMs(jwt({ sub: "u1", exp: 1764000000 }))).toBe(1764000000000);
  });
  it.each(["", "abc", "a.b.c", jwt({ sub: "u1" }), jwt({ exp: "soon" })])("gives null for %p", (token) => {
    expect(jwtExpiryMs(token)).toBeNull();
  });
});
