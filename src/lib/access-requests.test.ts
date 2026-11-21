import { describe, expect, it } from "vitest";
import { MAX_REASON_LENGTH, accessRequestError, missingFromRole, permissionsForApproval } from "./access-requests";

describe("accessRequestError", () => {
  it("needs permissions or a role", () => {
    expect(accessRequestError({ permissions: [], roleId: "", reason: "x" })).toBe(
      "Ask for at least one permission or a role.",
    );
  });
  it("needs a reason of 500 characters or less", () => {
    expect(accessRequestError({ permissions: ["users:view"], roleId: "", reason: "  " })).toBe("Tell the team why.");
    expect(accessRequestError({ permissions: ["users:view"], roleId: "", reason: "x".repeat(MAX_REASON_LENGTH + 1) })).toBe(
      "Write 500 characters or less.",
    );
  });
  it("passes a full request", () => {
    expect(accessRequestError({ permissions: [], roleId: "r1", reason: "Promotion" })).toBeNull();
  });
});

describe("missingFromRole", () => {
  it("lists the asked permissions that a role does not give", () => {
    expect(missingFromRole(["users:view", "transactions:view"], { slug: "x", permissions: ["users:view"] })).toEqual([
      "transactions:view",
    ]);
  });
  it("is empty for the super admin role", () => {
    expect(missingFromRole(["transactions:view"], { slug: "superadmin", permissions: [] })).toEqual([]);
  });
});

describe("permissionsForApproval", () => {
  it("keeps the current permissions and adds the asked ones", () => {
    expect(permissionsForApproval(["users:view", "bookings:view"], ["reports:actions", "users:view"])).toEqual([
      "users:view",
      "bookings:view",
      "reports:actions",
    ]);
  });
});
