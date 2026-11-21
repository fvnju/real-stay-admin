import { describe, expect, it } from "vitest";
import {
  createError,
  flagListQuery,
  isStaleEdit,
  parseFlagForm,
  parseFlagId,
  posthogFlagUrl,
  versionConflict,
  wasConcurrent,
} from "./flag-route-rules";

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
  it("adds the offset of a page", () => {
    expect(new URLSearchParams(flagListQuery(null, null, 400)).get("offset")).toBe("400");
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

const validForm = {
  key: "new-thing",
  name: "",
  active: true,
  type: "boolean",
  variants: [],
  payloads: {},
  conditions: [{ conditionId: null, filters: [{ kind: "person", key: "role", operator: "exact", value: "host" }], rollout: 10, variant: null }],
};

describe("parseFlagForm", () => {
  it("accepts a form of the right shape", () => {
    expect(parseFlagForm(validForm)).toEqual(validForm);
  });
  it.each([
    ["no form", null],
    ["a key that is not text", { ...validForm, key: 5 }],
    ["payloads that are missing", { ...validForm, payloads: undefined }],
    ["a payload that is not text", { ...validForm, payloads: { true: { a: 1 } } }],
    ["a type that is not known", { ...validForm, type: "other" }],
    ["a filter value that is not text", { ...validForm, conditions: [{ ...validForm.conditions[0], filters: [{ kind: "person", key: "role", operator: "exact", value: 1 }] }] }],
    ["an unknown operator", { ...validForm, conditions: [{ ...validForm.conditions[0], filters: [{ kind: "person", key: "role", operator: "drop", value: "x" }] }] }],
    ["a rollout that is not a number", { ...validForm, conditions: [{ ...validForm.conditions[0], rollout: "10" }] }],
    ["a variant without a key", { ...validForm, variants: [{ name: "A", rollout: 50 }] }],
  ])("refuses %s", (_name, body) => {
    expect(parseFlagForm(body)).toBeNull();
  });
});

describe("createError", () => {
  it("does not call a conflict of a new flag a change since it was opened", () => {
    expect(createError({ status: 409, code: "FLAG_CHANGED", message: "This flag changed since you opened it." })).toEqual({
      status: 409,
      code: "POSTHOG_ERROR",
      message: "PostHog refused the new flag. Check that the key is not in use, and try again.",
    });
  });
  it("keeps other errors", () => {
    const error = { status: 400, code: "BAD_REQUEST" as const, message: "Key already exists" };
    expect(createError(error)).toBe(error);
  });
});

describe("wasConcurrent", () => {
  it("is false when the save is the only change", () => {
    expect(wasConcurrent(3, 4)).toBe(false);
  });
  it("is false when PostHog does not count versions", () => {
    expect(wasConcurrent(3, 3)).toBe(false);
    expect(wasConcurrent(undefined, undefined)).toBe(false);
  });
  it("is true when another change came between the check and the save", () => {
    expect(wasConcurrent(3, 5)).toBe(true);
  });
});

describe("posthogFlagUrl", () => {
  it("builds the page of a flag in PostHog", () => {
    expect(posthogFlagUrl("https://eu.posthog.com/", "339639", 370262)).toBe(
      "https://eu.posthog.com/project/339639/feature-flags/370262",
    );
  });
});
