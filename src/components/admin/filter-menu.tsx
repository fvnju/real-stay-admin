"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { Icon } from "@/components/icon";

export type FilterOption = { label: string; value: string };

/** A button that opens a list of choices. "" is the value of "All". */
export function FilterMenu({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  const isFiltered = !!value;

  return (
    <Dropdown>
      <Button variant={isFiltered ? "secondary" : "tertiary"} size="sm">
        <Icon name="options-outline" size={16} />
        {isFiltered && current ? `${label}: ${current.label}` : label}
        <Icon name="chevron-down" size={14} className="text-muted" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-44">
        <Dropdown.Menu
          aria-label={label}
          selectionMode="single"
          selectedKeys={new Set([value || "__all"])}
          onAction={(key) => onChange(key === "__all" ? "" : String(key))}
        >
          {options.map((option) => (
            <Dropdown.Item
              key={option.value || "__all"}
              id={option.value || "__all"}
              textValue={option.label}
            >
              <Label>{option.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
