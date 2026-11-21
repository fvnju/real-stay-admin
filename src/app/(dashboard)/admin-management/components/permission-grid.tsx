"use client";

import { Button, Checkbox, Label, Tooltip } from "@heroui/react";
import { Icon } from "@/components/icon";
import { canGrant, withImpliedView, type MyPermissions } from "@/lib/permissions";
import { permissionAreas } from "@/lib/role-text";

const LEVELS = [
  { key: "view", label: "View", hint: "Opens the list" },
  { key: "details", label: "Details", hint: "Opens a detail page" },
  { key: "actions", label: "Actions", hint: "Changes things" },
] as const;

type Level = (typeof LEVELS)[number]["key"];

const AREAS = permissionAreas();
const TOTAL = AREAS.length * LEVELS.length;

/**
 * One checkbox. In HeroUI v3 the clickable part is `Checkbox.Content` (the
 * label with the hidden input); a `Checkbox.Control` without it does not
 * take clicks.
 */
function Box({
  label,
  showLabel = false,
  isSelected,
  isIndeterminate = false,
  isDisabled = false,
  onChange,
  className,
}: {
  label: string;
  showLabel?: boolean;
  isSelected: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <Checkbox
      aria-label={showLabel ? undefined : label}
      isSelected={isSelected}
      isIndeterminate={isIndeterminate}
      isDisabled={isDisabled}
      onChange={onChange}
      className={className}
    >
      <Checkbox.Content className="flex w-full items-center gap-2.5">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {showLabel ? <Label className="text-sm">{label}</Label> : null}
      </Checkbox.Content>
    </Checkbox>
  );
}

/** A permission that the admin cannot give: a disabled box with the reason. */
function LockedBox({ label, isSelected }: { label: string; isSelected: boolean }) {
  return (
    <Tooltip delay={200}>
      <Tooltip.Trigger aria-label={`${label}: you do not have this permission`}>
        <span className="flex items-center gap-1.5 py-2 text-muted">
          <Box label={label} isSelected={isSelected} isDisabled onChange={() => {}} />
          <Icon name="lock-closed-outline" size={12} />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>You do not have this permission</Tooltip.Content>
    </Tooltip>
  );
}

/** Read-only cell: a check for a given permission, a dash for the others. */
function Mark({ label, isSelected }: { label: string; isSelected: boolean }) {
  return isSelected ? (
    <span
      role="img"
      aria-label={`${label}: yes`}
      className="inline-flex size-6 items-center justify-center rounded-full bg-accent-soft text-accent"
    >
      <Icon name="checkmark" size={14} />
    </span>
  ) : (
    <span role="img" aria-label={`${label}: no`} className="inline-flex size-6 items-center justify-center text-muted/60">
      <Icon name="remove" size={14} />
    </span>
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

  const column = (level: Level) => AREAS.map((a) => a[level]);
  const everything = AREAS.flatMap((a) => [a.view, a.details, a.actions]);
  const count = everything.filter((p) => selected.has(p)).length;
  const givable = everything.filter(canGive);
  const allGiven = givable.every((p) => selected.has(p));
  const noneGiven = !givable.some((p) => selected.has(p));

  return (
    <div className="flex flex-col gap-3">
      {readOnly ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-medium tabular-nums text-foreground">{count}</span> of {TOTAL} permissions
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" isDisabled={allGiven} onPress={() => changeMany(givable, true)}>
              Select all
            </Button>
            <Button size="sm" variant="ghost" isDisabled={noneGiven} onPress={() => changeMany(givable, false)}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-[20px] border border-separator">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-separator bg-surface-secondary">
              <th scope="col" className="px-4 py-2.5 text-left font-medium">
                Area
              </th>
              {LEVELS.map((l) => {
                const perms = column(l.key);
                const all = perms.every((p) => selected.has(p));
                const some = perms.some((p) => selected.has(p));
                return (
                  <th key={l.key} scope="col" className="w-[22%] px-4 py-2.5 text-left font-medium">
                    <div className="flex items-center gap-2.5">
                      {readOnly ? null : (
                        <Box
                          label={`All ${l.label}`}
                          isSelected={all}
                          isIndeterminate={some && !all}
                          onChange={(c) => changeMany(perms, c)}
                        />
                      )}
                      <div className="flex flex-col leading-tight">
                        <span>{l.label}</span>
                        <span className="text-xs font-normal text-muted">{l.hint}</span>
                      </div>
                    </div>
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
                <tr
                  key={a.area}
                  className={`border-b border-separator last:border-b-0 ${readOnly ? "" : "hover:bg-default/60"}`}
                >
                  <th scope="row" className="px-4 py-1 text-left font-normal">
                    {readOnly ? (
                      <span className={`block py-2 ${some ? "" : "text-muted"}`}>{a.label}</span>
                    ) : (
                      <Box
                        label={a.label}
                        showLabel
                        isSelected={all}
                        isIndeterminate={some && !all}
                        onChange={(c) => changeMany(perms, c)}
                        className="w-full py-2"
                      />
                    )}
                  </th>
                  {LEVELS.map((l) => {
                    const p = a[l.key];
                    const label = `${a.label}: ${l.label}`;
                    return (
                      <td key={l.key} className="px-4 py-1">
                        {readOnly ? (
                          <Mark label={label} isSelected={selected.has(p)} />
                        ) : canGive(p) ? (
                          <Box
                            label={label}
                            isSelected={selected.has(p)}
                            onChange={(c) => change(p, c)}
                            className="w-full py-2"
                          />
                        ) : (
                          <LockedBox label={label} isSelected={selected.has(p)} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
