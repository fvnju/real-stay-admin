/** The permissions of a role. A copy of real-stay-backend `src/constants/rbac.perms.ts`: change both together. */
export const PERMISSIONS_CONFIG = [
  "dashboard:view",
  "dashboard:details",
  "dashboard:actions",

  "users:view",
  "users:details",
  "users:actions",

  "properties:view",
  "properties:details",
  "properties:actions",

  "bookings:view",
  "bookings:details",
  "bookings:actions",

  "notifications:view",
  "notifications:details",
  "notifications:actions",

  "transactions:view",
  "transactions:details",
  "transactions:actions",

  "admin-management:view",
  "admin-management:details",
  "admin-management:actions",

  "audit-logs:view",
  "audit-logs:details",
  "audit-logs:actions",

  "reports:view",
  "reports:details",
  "reports:actions",

  "verifications:view",
  "verifications:details",
  "verifications:actions",

  "roles:view",
  "roles:details",
  "roles:actions",

  "feature-flags:view",
  "feature-flags:details",
  "feature-flags:actions",

  "product-analytics:view",
  "product-analytics:details",
  "product-analytics:actions",

  "profile:view",
  "profile:details",
  "profile:actions",
] as const;

export type Permission = (typeof PERMISSIONS_CONFIG)[number];
