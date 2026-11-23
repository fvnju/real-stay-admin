import { describe, expect, it } from "vitest";
import {
  effectiveUserStatus,
  isDeletedUser,
  isFlaggedUser,
  kycImageSrc,
  noteKindLabel,
  requiredTextError,
} from "./user-management";

describe("user-management helpers", () => {
  it("detects soft-deleted and flagged users", () => {
    expect(isDeletedUser({ deleted_at: "2026-11-23T10:00:00Z" })).toBe(true);
    expect(isDeletedUser({ deleted_at: null })).toBe(false);
    expect(isFlaggedUser({ flagged_at: "2026-11-23T10:00:00Z" })).toBe(true);
    expect(isFlaggedUser({ flagged_at: null })).toBe(false);
  });

  it("prefers deleted over inactive in effectiveUserStatus", () => {
    expect(effectiveUserStatus({ status: "inactive", deleted_at: "2026-11-23T10:00:00Z" })).toBe("deleted");
    expect(effectiveUserStatus({ status: "active", deleted_at: null })).toBe("active");
    expect(effectiveUserStatus(null)).toBeUndefined();
  });

  it("normalizes Dojah KYC images safely", () => {
    expect(kycImageSrc("")).toBeNull();
    expect(kycImageSrc("https://cdn.example.com/id.jpg")).toBe("https://cdn.example.com/id.jpg");
    expect(kycImageSrc("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    const rawBase64 = "A".repeat(48);
    expect(kycImageSrc(rawBase64)).toBe(`data:image/jpeg;base64,${rawBase64}`);
    expect(kycImageSrc("javascript:alert(1)")).toBeNull();
  });

  it("formats note kinds and validates required text", () => {
    expect(noteKindLabel("escalate")).toBe("Escalated");
    expect(noteKindLabel("clear_flag")).toBe("Flag cleared");
    expect(requiredTextError("   ", "a reason", 500)).toBe("Enter a reason.");
    expect(requiredTextError("a".repeat(501), "a reason", 500)).toBe("Use 500 characters or less.");
    expect(requiredTextError("Valid reason", "a reason", 500)).toBeNull();
  });
});
