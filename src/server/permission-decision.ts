import type { MyPermissions, Permission } from "@/lib/permissions";

export type PermissionDecision = "allow" | "deny" | "signed-out" | "unavailable";

/**
 * The decision of a PostHog route from the answer of backend `GET /rbac/me`.
 * Only a real answer allows. A 404 does not allow (unlike the pages): the
 * backend answers 404 for an unknown route before it checks the sign-in,
 * so a request with no session would pass. These routes change flags for
 * all users.
 */
export function permissionDecision(
  me: { status: number; data?: MyPermissions },
  permission: Permission,
): PermissionDecision {
  if (me.status === 401) return "signed-out";
  if (me.status !== 200 || !Array.isArray(me.data?.permissions)) return "unavailable";
  if (me.data.isSuperAdmin) return "allow";
  return me.data.permissions.includes(permission) ? "allow" : "deny";
}
