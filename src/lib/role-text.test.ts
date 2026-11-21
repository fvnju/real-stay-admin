import { describe, expect, it, vi } from "vitest";
import { PERMISSIONS_CONFIG } from "@/app/configs/rbac.perms";
import { permissionAreas, roleErrorMessage } from "./role-text";

describe("permissionAreas", () => {
  it("lists each area once, in the order of the list, with its three permissions", () => {
    const areas = permissionAreas();
    expect(areas.map((a) => a.area)).toEqual([...new Set(PERMISSIONS_CONFIG.map((p) => p.split(":")[0]))]);
    expect(areas.find((a) => a.area === "reports")).toEqual({
      area: "reports",
      label: "Reports",
      view: "reports:view",
      details: "reports:details",
      actions: "reports:actions",
    });
    for (const a of areas) expect(a.label).not.toBe(a.area);
  });
});

describe("roleErrorMessage", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const old = (code: string, extra: Record<string, unknown> = {}) => ({
    status: 403,
    data: { data: { message: "backend text", code, ...extra }, success: false },
  });

  it.each([
    [old("ROLE_IN_USE", { count: 3 }), "3 admins have this role. Give them another role first."],
    [old("ROLE_IN_USE", { count: 1 }), "1 admin has this role. Give them another role first."],
    [old("ABOVE_OWN_ROLE"), "This role has permissions that you do not have."],
    [old("LAST_SUPER_ADMIN"), "RealStay needs at least one Super Admin."],
    [old("OWN_ROLE"), "You cannot change your own role."],
    [{ status: 409, data: { error: "x", code: "REQUEST_OPEN" } }, "You already have an open request."],
  ])("maps %#", (err, text) => {
    expect(roleErrorMessage(err)).toBe(text);
  });

  it("falls back to the backend message", () => {
    expect(roleErrorMessage(old("SOMETHING"))).toBe("backend text");
  });
});
