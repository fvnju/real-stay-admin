"use client";

import { Tabs } from "@heroui/react";

export type Segment = { label: string; value: string };

/**
 * A tab bar that filters a list. The selected value must be one of the
 * segments; "" is a valid value (for example "All").
 */
export function SegmentTabs({
  label,
  segments,
  value,
  onChange,
  className,
}: {
  label: string;
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  // react-aria needs a non-empty key.
  const keyOf = (v: string) => v || "__all";
  const selected = segments.some((s) => s.value === value)
    ? keyOf(value)
    : keyOf(segments[0]?.value ?? "");

  return (
    <Tabs
      className={`max-w-full ${className ?? ""}`}
      selectedKey={selected}
      onSelectionChange={(key) =>
        onChange(key === "__all" ? "" : String(key))
      }
    >
      <Tabs.ListContainer className="max-w-full overflow-x-auto">
        <Tabs.List aria-label={label} className="w-fit">
          {segments.map((segment) => (
            <Tabs.Tab key={keyOf(segment.value)} id={keyOf(segment.value)} className="whitespace-nowrap">
              {segment.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
