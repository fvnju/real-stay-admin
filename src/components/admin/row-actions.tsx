"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { Icon, type IconName } from "@/components/icon";

export type RowAction = {
  id: string;
  label: string;
  icon?: IconName;
  danger?: boolean;
  onAction: () => void;
};

/** The "..." button of a table row, with a menu of actions. */
export function RowActions({
  label,
  actions,
}: {
  /** For screen readers, for example "Actions for Ada Obi". */
  label: string;
  actions: RowAction[];
}) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={label}>
        <Icon name="ellipsis-horizontal" size={18} />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-44">
        <Dropdown.Menu
          aria-label={label}
          onAction={(key) => actions.find((a) => a.id === key)?.onAction()}
        >
          {actions.map((action) => (
            <Dropdown.Item
              key={action.id}
              id={action.id}
              textValue={action.label}
              variant={action.danger ? "danger" : undefined}
            >
              {action.icon ? <Icon name={action.icon} size={16} /> : null}
              <Label>{action.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
