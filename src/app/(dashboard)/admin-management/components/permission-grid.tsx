"use client";

import { Checkbox, Tooltip } from "@heroui/react";
import type { ReactNode } from "react";
import { canGrant, withImpliedView, type MyPermissions } from "@/lib/permissions";
import { permissionAreas } from "@/lib/role-text";

const LEVELS = [
  { key: "view", label: "View" },
  { key: "details", label: "Details" },
  { key: "actions", label: "Actions" },
] as const;

const AREAS = permissionAreas();

function Box({
  label,
  isSelected,
  isIndeterminate = false,
  isDisabled,
  onChange,
  tooltip,
}: {
  label: string;
  isSelected: boolean;
  isIndeterminate?: boolean;
  isDisabled: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}) {
  const box: ReactNode = (
    <Checkbox
      aria-label={label}
      isSelected={isSelected}
      isIndeterminate={isIndeterminate}
      isDisabled={isDisabled}
      onChange={onChange}
    >
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox>
  );
  if (!tooltip) return box;
  return (
    <Tooltip delay={200}>
      <Tooltip.Trigger aria-label={tooltip}>{box}</Tooltip.Trigger>
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip>
  );
}

/**
 * Rows are the areas, columns are View / Details / Actions. Checking
 * Details or Actions also checks View. A permission that the signed-in
 * admin does not have cannot be checked (except by a Super Admin).
 */
export function PermissionGrid({
  value,
  onChange,
  me,
  readOnly = false,
}: {
  value: string[];
  onChange?: (next: string[]) => void;
  me?: MyPermissions;
  readOnly?: boolean;
}) {
  const selected = new Set(value);
  const canGive = (p: string) => !me || canGrant(me, [p]);
  const change = (p: string, checked: boolean) => onChange?.(withImpliedView(value, p, checked));
  const changeMany = (perms: string[], checked: boolean) => {
    let next = value;
    for (const p of perms.filter(canGive)) next = withImpliedView(next, p, checked);
    onChange?.(next);
  };

  const column = (level: (typeof LEVELS)[number]["key"]) => AREAS.map((a) => a[level]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-separator">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-separator bg-default text-left">
            <th className="px-3 py-2 font-medium">Area</th>
            {LEVELS.map((l) => {
              const perms = column(l.key);
              const all = perms.every((p) => selected.has(p));
              const some = perms.some((p) => selected.has(p));
              return (
                <th key={l.key} className="px-3 py-2 font-medium">
                  <span className="flex items-center gap-2">
                    {readOnly ? null : (
                      <Box
                        label={`All ${l.label}`}
                        isSelected={all}
                        isIndeterminate={some && !all}
                        isDisabled={readOnly}
                        onChange={(c) => changeMany(perms, c)}
                      />
                    )}
                    {l.label}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {AREAS.map((a) => {
            const perms = [a.view, a.details, a.actions];
            const all = perms.every((p) => selected.has(p));
            const some = perms.some((p) => selected.has(p));
            return (
              <tr key={a.area} className="border-b border-separator last:border-b-0">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <span className="flex items-center gap-2">
                    {readOnly ? null : (
                      <Box
                        label={`All of ${a.label}`}
                        isSelected={all}
                        isIndeterminate={some && !all}
                        isDisabled={readOnly}
                        onChange={(c) => changeMany(perms, c)}
                      />
                    )}
                    {a.label}
                  </span>
                </th>
                {LEVELS.map((l) => {
                  const p = a[l.key];
                  const allowed = canGive(p);
                  return (
                    <td key={l.key} className="px-3 py-2">
                      <Box
                        label={`${a.label}: ${l.label}`}
                        isSelected={selected.has(p)}
                        isDisabled={readOnly || !allowed}
                        onChange={(c) => change(p, c)}
                        tooltip={!readOnly && !allowed ? "You do not have this permission" : undefined}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
