import { PERMISSIONS_CONFIG, type Permission } from "@/app/configs/rbac.perms";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { errorCodeOf } from "./permissions";

const AREA_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  properties: "Properties",
  bookings: "Bookings",
  notifications: "Notifications",
  transactions: "Transactions",
  "admin-management": "Admins",
  "audit-logs": "Audit logs",
  profile: "My profile",
  reports: "Reports",
  verifications: "Listing verification",
  roles: "Roles",
  "feature-flags": "Feature flags",
  "product-analytics": "Analytics",
};

export type PermissionArea = {
  area: string;
  label: string;
  view: Permission;
  details: Permission;
  actions: Permission;
};

/** The rows of the permission grid: each area once, in the order of the list. */
export function permissionAreas(): PermissionArea[] {
  const areas = [...new Set(PERMISSIONS_CONFIG.map((p) => p.split(":")[0]))];
  return areas.map((area) => ({
    area,
    label: AREA_LABELS[area] ?? area,
    view: `${area}:view` as Permission,
    details: `${area}:details` as Permission,
    actions: `${area}:actions` as Permission,
  }));
}

/** The text of a refused role, admin or request action. */
export function roleErrorMessage(error: unknown): string {
  switch (errorCodeOf(error)) {
    case "ROLE_IN_USE": {
      const data = (error as { data?: { data?: { count?: number }; count?: number } }).data;
      const count = data?.data?.count ?? data?.count ?? 0;
      return `${count} ${count === 1 ? "admin has" : "admins have"} this role. Give them another role first.`;
    }
    case "ABOVE_OWN_ROLE":
      return "This role has permissions that you do not have.";
    case "LAST_SUPER_ADMIN":
      return "RealStay needs at least one Super Admin.";
    case "OWN_ROLE":
      return "You cannot change your own role.";
    case "REQUEST_OPEN":
      return "You already have an open request.";
    default:
      return GetErrorMessage(error);
  }
}
