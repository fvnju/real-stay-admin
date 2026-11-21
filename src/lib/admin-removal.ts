/**
 * Who may remove or restore an admin. A copy of the backend rules
 * (real-stay-backend `src/features/users/admin-removal-rules.ts`); change
 * both together. The backend checks again; the panel shows the reason first.
 */
export const OWNER_SUPER_ADMIN_EMAIL = "info@edgetechino.com";

export type RemovalMe = { id: string; email: string; isSuperAdmin: boolean };
/** `isSuperAdmin: null` while the roles load. */
export type RemovalTarget = { id: string; isSuperAdmin: boolean | null };
export type RemovalRefusal = { code: "SUPER_ADMIN_ONLY" | "OWNER_ONLY" | "OWN_ACCOUNT"; message: string };

export function removalRefusalOf(me: RemovalMe | null, target: RemovalTarget): RemovalRefusal | null {
  if (!me) return null;
  if (me.id === target.id) return { code: "OWN_ACCOUNT", message: "You cannot remove or restore your own account" };
  if (!me.isSuperAdmin) {
    return { code: "SUPER_ADMIN_ONLY", message: "Only a Super Admin can remove or restore an admin" };
  }
  if (target.isSuperAdmin === true && me.email.trim().toLowerCase() !== OWNER_SUPER_ADMIN_EMAIL) {
    return { code: "OWNER_ONLY", message: `Only ${OWNER_SUPER_ADMIN_EMAIL} can remove or restore a Super Admin` };
  }
  return null;
}

export function isRemovedAdmin(user?: { user_type?: string; admin_removed_at?: string | null } | null): boolean {
  return user?.user_type === "admin" && user.admin_removed_at != null;
}
