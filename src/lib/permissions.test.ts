import { describe, expect, it } from "vitest";
import { PERMISSIONS_CONFIG } from "@/app/configs/rbac.perms";
import {
  PAGE_PERMISSIONS,
  canGrant,
  newRolePermissions,
  missingPermissionOf,
  pagePermissionOf,
  permissionStateOf,
  withImpliedView,
  type MyPermissions,
} from "./permissions";

const me = (permissions: string[], isSuperAdmin = false): MyPermissions => ({
  role: { id: "r1", name: "Support", slug: "support" },
  permissions,
  isSuperAdmin,
});

describe("PERMISSIONS_CONFIG", () => {
  it.each(["reports", "verifications", "roles"])("has the three levels of %s", (area) => {
    for (const level of ["view", "details", "actions"]) {
      expect(PERMISSIONS_CONFIG).toContain(`${area}:${level}`);
    }
  });
});

describe("canGrant", () => {
  it("lets an admin give a subset of their permissions", () => {
    expect(canGrant(me(["users:view", "users:actions"]), ["users:view"])).toBe(true);
  });
  it("refuses a role above the admin", () => {
    expect(canGrant(me(["users:view"]), ["users:view", "roles:actions"])).toBe(false);
  });
  it("lets a super admin give anything", () => {
    expect(canGrant(me([], true), [...PERMISSIONS_CONFIG])).toBe(true);
  });
});

describe("withImpliedView", () => {
  it("adds view when details or actions is checked", () => {
    expect(withImpliedView([], "users:actions", true).sort()).toEqual(["users:actions", "users:view"]);
    expect(withImpliedView(["users:view"], "users:details", true).sort()).toEqual(["users:details", "users:view"]);
  });
  it("removes details and actions when view is unchecked", () => {
    expect(withImpliedView(["users:view", "users:details", "users:actions", "roles:view"], "users:view", false)).toEqual([
      "roles:view",
    ]);
  });
  it("removes only the one permission otherwise", () => {
    expect(withImpliedView(["users:view", "users:actions"], "users:actions", false)).toEqual(["users:view"]);
  });
});

describe("permissionStateOf", () => {
  it("allows a page without a permission", () => {
    expect(permissionStateOf({ isLoading: true }, null)).toBe("allowed");
  });
  it("is loading while the query loads", () => {
    expect(permissionStateOf({ isLoading: true }, "users:view")).toBe("loading");
  });
  it("allows everything on an old backend (404, or 400 from GET /rbac/:id)", () => {
    expect(permissionStateOf({ isLoading: false, error: { status: 404 } }, "users:view")).toBe("allowed");
    expect(permissionStateOf({ isLoading: false, error: { status: 400 } }, "users:view")).toBe("allowed");
  });
  it("does not block on a failed request without data (502, network error): the backend still checks", () => {
    expect(permissionStateOf({ isLoading: false, error: { status: 502 } }, "users:view")).toBe("allowed");
    expect(permissionStateOf({ isLoading: false, error: { data: {} } }, "users:view")).toBe("allowed");
  });
  it("keeps the last answer when a reload fails", () => {
    const q = { isLoading: false, error: { status: 502 }, data: me(["users:view"]) };
    expect(permissionStateOf(q, "users:view")).toBe("allowed");
    expect(permissionStateOf(q, "users:actions")).toBe("denied");
  });
  it("allows a super admin", () => {
    expect(permissionStateOf({ isLoading: false, data: me([], true) }, "roles:actions")).toBe("allowed");
  });
  it("reads the list", () => {
    const q = { isLoading: false, data: me(["users:view"]) };
    expect(permissionStateOf(q, "users:view")).toBe("allowed");
    expect(permissionStateOf(q, "users:actions")).toBe("denied");
  });
});

describe("missingPermissionOf", () => {
  it("reads the old shape", () => {
    const err = { status: 403, data: { data: { message: "x", code: "MISSING_PERMISSION", permission: "users:view" }, success: false } };
    expect(missingPermissionOf(err)).toBe("users:view");
  });
  it("reads the v1 shape", () => {
    const err = { status: 403, data: { error: "x", code: "MISSING_PERMISSION", permission: "reports:view" } };
    expect(missingPermissionOf(err)).toBe("reports:view");
  });
  it("is null for another 403 and for a 500", () => {
    expect(missingPermissionOf({ status: 403, data: { code: "ABOVE_OWN_ROLE" } })).toBeNull();
    expect(missingPermissionOf({ status: 500, data: {} })).toBeNull();
    expect(missingPermissionOf(undefined)).toBeNull();
  });
});

describe("PAGE_PERMISSIONS", () => {
  it("gives each page of the spec its permission", () => {
    expect(pagePermissionOf("/users")).toEqual({ permission: "users:view", name: "Users" });
    expect(pagePermissionOf("/users/abc")).toEqual({ permission: "users:details", name: "User" });
    expect(pagePermissionOf("/reports/123").permission).toBe("reports:details");
    expect(pagePermissionOf("/admin-management/roles/new").permission).toBe("roles:view");
    expect(pagePermissionOf("/profile").permission).toBeNull();
    expect(pagePermissionOf("/notifications").permission).toBeNull();
  });
  it("names only known permissions", () => {
    for (const p of Object.values(PAGE_PERMISSIONS)) {
      if (p.permission) expect(PERMISSIONS_CONFIG).toContain(p.permission);
    }
  });
});

describe("newRolePermissions", () => {
  it("starts a new role with My profile", () => {
    expect(newRolePermissions()).toEqual(["profile:view", "profile:details", "profile:actions"]);
  });

  it("keeps the asked permissions and adds My profile once", () => {
    expect(newRolePermissions(["users:view", "profile:view"])).toEqual([
      "users:view",
      "profile:view",
      "profile:details",
      "profile:actions",
    ]);
  });
});
