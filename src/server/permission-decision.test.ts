import { describe, expect, it } from "vitest";
import { permissionDecision } from "./permission-decision";

const me = (permissions: string[], isSuperAdmin = false) => ({
  role: { id: "r1", name: "Support", slug: "support" },
  permissions,
  isSuperAdmin,
});

describe("permissionDecision", () => {
  it("allows on an old backend without /rbac/me (404)", () => {
    expect(permissionDecision({ status: 404 }, "feature-flags:view")).toBe("allow");
  });

  it("signs out on a 401", () => {
    expect(permissionDecision({ status: 401 }, "feature-flags:view")).toBe("signed-out");
  });

  it("allows a role with the permission", () => {
    expect(
      permissionDecision({ status: 200, data: me(["feature-flags:view"]) }, "feature-flags:view"),
    ).toBe("allow");
  });

  it("allows a super admin", () => {
    expect(permissionDecision({ status: 200, data: me([], true) }, "feature-flags:actions")).toBe(
      "allow",
    );
  });

  it("denies a role without the permission", () => {
    expect(
      permissionDecision({ status: 200, data: me(["feature-flags:view"]) }, "feature-flags:actions"),
    ).toBe("deny");
  });

  it("does not allow when the backend fails (500)", () => {
    expect(permissionDecision({ status: 500 }, "feature-flags:actions")).toBe("unavailable");
  });

  it("does not allow a 200 without a permission list", () => {
    expect(permissionDecision({ status: 200 }, "feature-flags:view")).toBe("unavailable");
  });
});
