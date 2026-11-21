import { describe, expect, it } from "vitest";
import { LISTING_REPORT_REASONS, USER_REPORT_REASONS, reasonLabel } from "./report-reasons";

describe("reasonLabel", () => {
  it("has a label for each reason of the backend", () => {
    for (const r of [...LISTING_REPORT_REASONS, ...USER_REPORT_REASONS]) {
      expect(reasonLabel(r)).not.toBe(r);
      expect(reasonLabel(r).length).toBeGreaterThan(2);
    }
  });
  it("gives the raw text of an unknown reason", () => {
    expect(reasonLabel("something_new")).toBe("something_new");
  });
  it("has the reasons of the backend", () => {
    expect(LISTING_REPORT_REASONS).toEqual(["fake_listing", "wrong_information", "scam", "unsafe", "offensive", "other"]);
    expect(USER_REPORT_REASONS).toEqual(["scam", "harassment", "unsafe", "fake_profile", "offensive", "other"]);
  });
});
