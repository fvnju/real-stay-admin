import { describe, expect, it } from "vitest";
import {
  TEST_USER_PROPERTY,
  isMarkedPerson,
  isUserId,
  markEvent,
  markedListQuery,
  testAccountOf,
} from "./test-accounts";

describe("isUserId", () => {
  it("accepts a backend user ID", () => {
    expect(isUserId("689ba8f3bbac0ea07a38d698")).toBe(true);
  });
  it.each(["", "abc", "689ba8f3bbac0ea07a38d69", "689ba8f3bbac0ea07a38d698x", "../persons"])("refuses %p", (id) => {
    expect(isUserId(id)).toBe(false);
  });
});

describe("markEvent", () => {
  it("sets the mark on the person of the user", () => {
    expect(markEvent("token", "689ba8f3bbac0ea07a38d698", true)).toEqual({
      api_key: "token",
      event: "$set",
      distinct_id: "689ba8f3bbac0ea07a38d698",
      properties: { $set: { [TEST_USER_PROPERTY]: true } },
    });
  });
  it("sets false to count the user again", () => {
    expect(markEvent("token", "689ba8f3bbac0ea07a38d698", false).properties.$set[TEST_USER_PROPERTY]).toBe(false);
  });
  it("uses the property of the Internal / Test users cohort", () => {
    expect(TEST_USER_PROPERTY).toBe("$internal_or_test_user");
  });
});

describe("isMarkedPerson", () => {
  it.each([
    [{ properties: { $internal_or_test_user: true } }, true],
    [{ properties: { $internal_or_test_user: "true" } }, true],
    [{ properties: { $internal_or_test_user: false } }, false],
    [{ properties: {} }, false],
    [undefined, false],
  ])("reads %j as %s", (person, marked) => {
    expect(isMarkedPerson(person)).toBe(marked);
  });
});

describe("markedListQuery", () => {
  it("asks for the persons with the mark", () => {
    const q = new URLSearchParams(markedListQuery());
    expect(JSON.parse(q.get("properties") ?? "[]")).toEqual([
      { key: "$internal_or_test_user", value: ["true"], operator: "exact", type: "person" },
    ]);
    expect(q.get("limit")).toBe("100");
  });
});

describe("testAccountOf", () => {
  it("reads the user ID, the email and the name of a person", () => {
    expect(
      testAccountOf({
        distinct_ids: ["01a1-anon", "689ba8f3bbac0ea07a38d698"],
        properties: { email: "ada@example.com", name: "Ada Obi" },
      }),
    ).toEqual({ userId: "689ba8f3bbac0ea07a38d698", email: "ada@example.com", name: "Ada Obi" });
  });
  it("gives null values when the person is not a signed-in user", () => {
    expect(testAccountOf({ distinct_ids: ["01a1-anon"], properties: {} })).toEqual({
      userId: null,
      email: null,
      name: null,
    });
  });
});
