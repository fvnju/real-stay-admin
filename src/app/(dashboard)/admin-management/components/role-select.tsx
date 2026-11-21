"use client";

import { FieldError, Label, ListBox, Select } from "@heroui/react";
import type { Role } from "@/app/endpoints/rbac/rbac-types";
import { canGrant, type MyPermissions } from "@/lib/permissions";

/**
 * A select of the roles. A role that the signed-in admin cannot give
 * (it has a permission that they do not have) shows "Above your role" and
 * cannot be picked. `limit={false}` lists every role (an access request).
 */
export function RoleSelect({
  roles,
  value,
  onChange,
  me,
  limit = true,
  label = "Role",
  isLoading = false,
  error,
  onBlur,
  className,
}: {
  roles: Role[];
  value: string;
  onChange: (roleId: string) => void;
  me?: MyPermissions;
  limit?: boolean;
  label?: string;
  isLoading?: boolean;
  error?: string;
  onBlur?: () => void;
  className?: string;
}) {
  // The Super Admin role has every permission, whatever its stored list says.
  const above = (role: Role) =>
    limit &&
    !!me &&
    (role.slug === "superadmin" ? !me.isSuperAdmin : !canGrant(me, role.permissions ?? []));
  const disabledKeys = roles.filter(above).map((r) => r._id);

  return (
    <Select
      className={className}
      placeholder={isLoading ? "Loading roles" : "Choose a role"}
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(key ? String(key) : "")}
      onBlur={onBlur}
      isInvalid={!!error}
      isDisabled={isLoading}
      disabledKeys={disabledKeys}
      fullWidth
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <FieldError>{error}</FieldError>
      <Select.Popover>
        <ListBox>
          {roles.map((role) => (
            <ListBox.Item key={role._id} id={role._id} textValue={role.name}>
              <div className="flex flex-col">
                <span>
                  {role.name}
                  {above(role) ? <span className="ml-2 text-xs text-muted">Above your role</span> : null}
                </span>
                {role.description ? <span className="text-xs text-muted">{role.description}</span> : null}
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
