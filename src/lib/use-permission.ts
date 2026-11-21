"use client";

import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { permissionStateOf, type Permission, type PermissionState } from "./permissions";

/** The role and the permissions of the signed-in admin (`GET /rbac/me`). */
export function useMyPermissions() {
  return rbacApi.useGetMyPermissionsQuery();
}

/** Can the signed-in admin use what needs `permission`? */
export function usePermission(permission: Permission | null): PermissionState {
  return permissionStateOf(useMyPermissions(), permission);
}

/** A check for buttons: true when the admin has the permission (also while it loads). */
export function useCan(): (permission: Permission) => boolean {
  const query = useMyPermissions();
  return (permission) => permissionStateOf(query, permission) !== "denied";
}
