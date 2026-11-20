"use client";

import { Card, Skeleton } from "@heroui/react";
import NumberFlow, { type Format } from "@number-flow/react";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

export type Stat = {
  label: string;
  /** A number animates with NumberFlow. Other values show as they are. */
  value: ReactNode;
  /** The format of a number value, for example `NAIRA_FORMAT`. */
  format?: Format;
  icon: IconName;
};

/** A row of numbers, for example the user counts. */
export function StatCards({
  items,
  isLoading = false,
}: {
  items: Stat[];
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 smallPhone:grid-cols-2 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="gap-3 p-4">
          <div className="flex items-center justify-between gap-2 text-sm text-muted">
            <span>{item.label}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-default text-foreground">
              <Icon name={item.icon} size={16} />
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {typeof item.value === "number" ? (
                <StatNumber value={item.value} format={item.format} />
              ) : (
                (item.value ?? "–")
              )}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

/**
 * NumberFlow does not animate its first value, so the number starts at 0 and
 * rolls to the value after the card shows. A later change rolls from the old value.
 */
function StatNumber({ value, format }: { value: number; format?: Format }) {
  const [shown, setShown] = useState(0);
  useEffect(() => setShown(value), [value]);
  return <NumberFlow value={shown} format={format} locales="en-NG" />;
}
