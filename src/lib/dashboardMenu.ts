import type { IconName } from "@/components/icon";

export type MenuItem = {
  label: string;
  /** An icon of the mobile app (`src/components/icon`). */
  icon: IconName;
  path: string;
};

export const menuItems = [
  { label: "Dashboard", icon: "grid", path: "/dashboard" },
  { label: "Users", icon: "people", path: "/users" },
  { label: "Properties", icon: "home", path: "/properties" },
  { label: "Bookings", icon: "calendar", path: "/bookings" },
  {
    label: "Notifications",
    icon: "notifications-outline",
    path: "/notifications",
  },
  { label: "Transactions", icon: "receipt", path: "/transactions" },
] as const satisfies readonly MenuItem[];

export const adminMenuItems = [
  { label: "Admins", icon: "shield-checkmark", path: "/admin-management" },
  { label: "Audit logs", icon: "document-text", path: "/audit-logs" },
] as const satisfies readonly MenuItem[];

export const profileMenuItem = {
  label: "My profile",
  icon: "person-outline",
  path: "/profile",
} as const satisfies MenuItem;

/** True when `pathname` is the page of `itemPath` or one of its sub-pages. */
export function isMenuPathActive(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * Ends the session. The server route clears the httpOnly cookies; the
 * page has no token of its own to remove.
 */
export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/sign-in";
  }
}
