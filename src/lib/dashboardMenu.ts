export type MenuItem = {
  label: string;
  icon: string;
  path: string;
};

export const menuItems = [
  {
    label: "Dashboard",
    icon: "hugeicons:dashboard-square-01",
    path: "/dashboard",
  },
  {
    label: "Users",
    icon: "hugeicons:user-multiple-02",
    path: "/users",
  },
  {
    label: "Properties",
    icon: "lucide-lab:house-roof",
    path: "/properties",
  },
  {
    label: "Bookings",
    icon: "hugeicons:calendar-03",
    path: "/bookings",
  },
  {
    label: "Notifications and Email",
    icon: "solar:notification-unread-lines-linear",
    path: "/notifications",
  },
  {
    label: "Transaction Monitoring",
    icon: "mage:dashboard-bar-notification",
    path: "/transactions",
  },
] as const satisfies readonly MenuItem[];

export const adminMenuItems = [
  {
    label: "Admin User Mgt.",
    icon: "hugeicons:settings-03",
    path: "/admin-management",
  },
  { label: "Audit logs", icon: "hugeicons:task-01", path: "/audit-logs" },
] as const satisfies readonly MenuItem[];

export const profileMenuItem = {
  label: "My Profile",
  icon: "iconoir:user",
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
