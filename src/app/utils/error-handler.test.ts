import { describe, expect, it, vi } from "vitest";
import { GetErrorMessage } from "./error-handler";

describe("GetErrorMessage", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  it("reads the old shape", () => {
    expect(GetErrorMessage({ data: { data: { message: "user not found" } } })).toBe("user not found");
  });
  it("reads the v1 shape", () => {
    expect(GetErrorMessage({ data: { error: "This report is already closed", code: "INVALID_STATE" } })).toBe(
      "This report is already closed",
    );
  });
  it("gives a general text otherwise", () => {
    expect(GetErrorMessage({})).toBe("An unexpected error occurred");
  });
});
