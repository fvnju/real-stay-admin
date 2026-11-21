import { describe, expect, it } from "vitest";
import { flagListQuery, isStaleEdit, parseFlagId, versionConflict } from "./flag-route-rules";

describe("parseFlagId", () => {
  it("reads a flag id", () => {
    expect(parseFlagId("370262")).toBe(370262);
  });
  it.each(["0", "-1", "abc", "1.5", "", "12abc"])("refuses %p", (raw) => {
    expect(parseFlagId(raw)).toBeNull();
  });
});

describe("flagListQuery", () => {
  it("keeps the search and the state", () => {
    const q = new URLSearchParams(flagListQuery("hotel", "true"));
    expect(q.get("search")).toBe("hotel");
    expect(q.get("active")).toBe("true");
  });
  it("drops a state that is not true or false", () => {
    expect(new URLSearchParams(flagListQuery(null, "STALE")).has("active")).toBe(false);
  });
  it("cuts the search to 100 characters", () => {
    expect(new URLSearchParams(flagListQuery("x".repeat(300), null)).get("search")).toHaveLength(100);
  });
});

describe("versionConflict", () => {
  it("is true for FLAG_CHANGED only", () => {
    expect(versionConflict({ status: 409, code: "FLAG_CHANGED", message: "" })).toBe(true);
    expect(versionConflict({ status: 404, code: "NOT_FOUND", message: "" })).toBe(false);
  });
});

describe("isStaleEdit", () => {
  const current = { updated_at: "2026-11-21T10:00:00.000Z", version: 3 };
  it("is false when the admin saw the current flag", () => {
    expect(isStaleEdit({ updatedAt: "2026-11-21T10:00:00.000Z", version: 3 }, current)).toBe(false);
  });
  it("is true when the flag changed after the admin opened it", () => {
    expect(isStaleEdit({ updatedAt: "2026-11-21T09:00:00.000Z", version: 3 }, current)).toBe(true);
    expect(isStaleEdit({ updatedAt: "2026-11-21T10:00:00.000Z", version: 2 }, current)).toBe(true);
  });
  it("is true when the client sends no updatedAt", () => {
    expect(isStaleEdit({}, current)).toBe(true);
  });
});
