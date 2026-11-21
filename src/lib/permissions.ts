import { PERMISSIONS_CONFIG, type Permission } from "@/app/configs/rbac.perms";

export type { Permission };

/** `GET /rbac/me`: the role and the permissions of the signed-in admin. */
export type MyPermissions = {
  role: { id: string; name: string; slug: string } | null;
  permissions: string[];
  isSuperAdmin: boolean;
};

export type PermissionState = "allowed" | "denied" | "loading";

/**
 * True when the admin can give a role with `rolePermissions`: they have
 * each of them. A Super Admin can give any role. The same rule as the
 * backend (`real-stay-backend/src/features/rbac/permission-rules.ts`).
 */
export function canGrant(me: MyPermissions, rolePermissions: readonly string[]): boolean {
  if (me.isSuperAdmin) return true;
  const mine = new Set(me.permissions);
  return rolePermissions.every((p) => mine.has(p));
}

/**
 * The permissions after one checkbox of the grid changes. Checking
 * `details` or `actions` also checks `view` of the area; unchecking `view`
 * also unchecks `details` and `actions` of the area.
 */
export function withImpliedView(list: string[], changed: string, checked: boolean): string[] {
  const [area, level] = changed.split(":");
  const next = new Set(list);
  if (checked) {
    next.add(changed);
    if (level !== "view") next.add(`${area}:view`);
  } else {
    next.delete(changed);
    if (level === "view") {
      next.delete(`${area}:details`);
      next.delete(`${area}:actions`);
    }
  }
  return list.filter((p) => next.has(p)).concat([...next].filter((p) => !list.includes(p)));
}

type Query = { data?: MyPermissions; error?: unknown; isLoading: boolean };

/**
 * Can the admin use what needs `permission`? Only a real answer of
 * `/rbac/me` can deny. A failed request (an old backend without the route,
 * a 502, a network error) blocks nothing: the backend still checks each
 * request. A failed reload keeps the last answer.
 */
export function permissionStateOf(query: Query, permission: Permission | null): PermissionState {
  if (!permission) return "allowed";
  if (query.data) {
    if (query.data.isSuperAdmin) return "allowed";
    return query.data.permissions.includes(permission) ? "allowed" : "denied";
  }
  if (query.error) return "allowed";
  return "loading";
}

/**
 * The permission that a refused request misses: a 403 with
 * `code: "MISSING_PERMISSION"`. The old routes put it in `data.data`, the
 * v1 routes in `data`.
 */
export function missingPermissionOf(error: unknown): string | null {
  if (statusOf(error) !== 403) return null;
  const data = (error as { data?: Record<string, unknown> }).data;
  const body = (data?.data && typeof data.data === "object" ? data.data : data) as
    | { code?: unknown; permission?: unknown }
    | undefined;
  return body?.code === "MISSING_PERMISSION" && typeof body.permission === "string"
    ? body.permission
    : null;
}

/** The `code` of a refused request (old or v1 shape), for the messages of a form. */
export function errorCodeOf(error: unknown): string | null {
  const data = (error as { data?: Record<string, unknown> } | undefined)?.data;
  const body = (data?.data && typeof data.data === "object" ? data.data : data) as
    | { code?: unknown }
    | undefined;
  return typeof body?.code === "string" ? body.code : null;
}

function statusOf(error: unknown): number | undefined {
  return (error as { status?: number } | undefined)?.status;
}

type PagePermission = { permission: Permission | null; name: string };

/** The permission of each page (route pattern), and its name for the blocked state. */
export const PAGE_PERMISSIONS = {
  "/dashboard": { permission: "dashboard:view", name: "Dashboard" },
  "/analytics": { permission: "product-analytics:view", name: "Analytics" },
  "/users": { permission: "users:view", name: "Users" },
  "/users/[id]": { permission: "users:details", name: "User" },
  "/profile/[id]": { permission: "users:details", name: "User" },
  "/properties": { permission: "properties:view", name: "Properties" },
  "/properties/[id]": { permission: "properties:details", name: "Property" },
  "/bookings": { permission: "bookings:view", name: "Bookings" },
  "/bookings/[id]": { permission: "bookings:details", name: "Booking" },
  "/transactions": { permission: "transactions:view", name: "Transactions" },
  "/transactions/[id]": { permission: "transactions:details", name: "Transaction" },
  "/reports": { permission: "reports:view", name: "Reports" },
  "/reports/[id]": { permission: "reports:details", name: "Report" },
  "/admin-management": { permission: "admin-management:view", name: "Admins" },
  "/admin-management/[id]": { permission: "admin-management:details", name: "Admin" },
  "/admin-management/roles/new": { permission: "roles:view", name: "New role" },
  "/admin-management/roles/[id]": { permission: "roles:view", name: "Role" },
  "/audit-logs": { permission: "audit-logs:view", name: "Audit logs" },
  "/audit-logs/[id]": { permission: "audit-logs:details", name: "Audit log" },
  "/feature-flags": { permission: "feature-flags:view", name: "Feature flags" },
  "/feature-flags/new": { permission: "feature-flags:actions", name: "New flag" },
  "/feature-flags/[id]": { permission: "feature-flags:details", name: "Feature flag" },
  "/notifications": { permission: null, name: "Notifications" },
  "/profile": { permission: null, name: "My profile" },
} as const satisfies Record<string, PagePermission>;

export type PageKey = keyof typeof PAGE_PERMISSIONS;

/** The permission of the page at `pathname`. A path that no pattern matches needs none. */
export function pagePermissionOf(pathname: string): PagePermission {
  const parts = pathname.split("/").filter(Boolean);
  let best: { value: PagePermission; ids: number } | null = null;
  for (const [pattern, value] of Object.entries(PAGE_PERMISSIONS)) {
    const want = pattern.split("/").filter(Boolean);
    if (want.length !== parts.length) continue;
    if (!want.every((w, i) => w === "[id]" || w === parts[i])) continue;
    // A fixed segment ("roles/new") wins over "[id]".
    const ids = want.filter((w) => w === "[id]").length;
    if (!best || ids < best.ids) best = { value, ids };
  }
  return best?.value ?? { permission: null, name: "" };
}

/** Every permission, in the order of the grid. */
export const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS_CONFIG;

/** The permissions that a new role starts with: each admin can open their own profile. */
export const NEW_ROLE_PERMISSIONS: readonly Permission[] = ["profile:view", "profile:details", "profile:actions"];

/** The first permissions of a new role: `asked` and the permissions of `NEW_ROLE_PERMISSIONS`. */
export function newRolePermissions(asked: readonly string[] = []): string[] {
  return [...asked, ...NEW_ROLE_PERMISSIONS.filter((p) => !asked.includes(p))];
}
