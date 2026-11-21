import { describe, expect, it } from "vitest";
import { isRemovedAdmin, removalRefusalOf } from "./admin-removal";

const owner = { id: "o", email: "info@edgetechino.com", isSuperAdmin: true };
const otherSuper = { id: "s", email: "ops@edgetechino.com", isSuperAdmin: true };
const staff = { id: "t", email: "staff@edgetechino.com", isSuperAdmin: false };

describe("removalRefusalOf (same cases as the backend rules)", () => {
  it("refuses an admin who is not a Super Admin", () => {
    expect(removalRefusalOf(staff, { id: "x", isSuperAdmin: false })?.code).toBe("SUPER_ADMIN_ONLY");
  });
  it("lets a Super Admin remove an admin who is not a Super Admin", () => {
    expect(removalRefusalOf(otherSuper, { id: "x", isSuperAdmin: false })).toBeNull();
  });
  it("lets only the owner remove a Super Admin, without case", () => {
    expect(removalRefusalOf(otherSuper, { id: "o2", isSuperAdmin: true })).toEqual({
      code: "OWNER_ONLY",
      message: "Only info@edgetechino.com can remove or restore a Super Admin",
    });
    expect(removalRefusalOf(owner, { id: "s", isSuperAdmin: true })).toBeNull();
    expect(removalRefusalOf({ ...owner, email: "Info@EdgeTechIno.COM" }, { id: "s", isSuperAdmin: true })).toBeNull();
  });
  it("refuses the own account", () => {
    expect(removalRefusalOf(owner, { id: "o", isSuperAdmin: true })?.code).toBe("OWN_ACCOUNT");
  });
  it("leaves the decision to the backend while the facts load", () => {
    expect(removalRefusalOf(null, { id: "x", isSuperAdmin: false })).toBeNull();
    expect(removalRefusalOf(otherSuper, { id: "x", isSuperAdmin: null })).toBeNull();
  });
});

describe("isRemovedAdmin", () => {
  it.each([
    [{ user_type: "admin", admin_removed_at: "2026-11-21T10:00:00Z" }, true],
    [{ user_type: "admin", admin_removed_at: null }, false],
    [{ user_type: "admin" }, false],
    [{ user_type: "guest", admin_removed_at: "2026-11-21T10:00:00Z" }, false],
    [undefined, false],
  ])("%j → %s", (user, removed) => {
    expect(isRemovedAdmin(user)).toBe(removed);
  });
});
