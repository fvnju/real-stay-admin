import type { MyPermissions, Permission } from "@/lib/permissions";

export type PermissionDecision = "allow" | "deny" | "signed-out" | "unavailable";

/**
 * The decision of a PostHog route from the answer of backend `GET /rbac/me`.
 * An old backend without the route (404) blocks nothing, as in the pages.
 * Other failures do not allow: these routes change flags for all users.
 */
export function permissionDecision(
  me: { status: number; data?: MyPermissions },
  permission: Permission,
): PermissionDecision {
  if (me.status === 404) return "allow";
  if (me.status === 401) return "signed-out";
  if (me.status !== 200 || !Array.isArray(me.data?.permissions)) return "unavailable";
  if (me.data.isSuperAdmin) return "allow";
  return me.data.permissions.includes(permission) ? "allow" : "deny";
}
