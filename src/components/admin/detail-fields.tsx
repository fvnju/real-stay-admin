"use client";

import { Button, Card, Skeleton, Tooltip } from "@heroui/react";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";

/** A button that copies `text`. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <Tooltip delay={300}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        className="size-7 min-w-7"
        onPress={async () => {
          await navigator.clipboard.writeText(text).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        <Icon name={copied ? "checkmark" : "copy-outline"} size={14} />
      </Button>
      <Tooltip.Content>{copied ? "Copied" : label}</Tooltip.Content>
    </Tooltip>
  );
}

export type Field = {
  label: string;
  value?: ReactNode;
  /** Show a copy button for this text. */
  copy?: string;
  /** Use the whole width of the grid. */
  wide?: boolean;
};

/** A card with a title and label/value pairs in a grid. */
export function DetailSection({
  title,
  fields,
  isLoading = false,
  actions,
  children,
  columns = 3,
}: {
  title: string;
  /** Columns on a wide screen: 2 for a card of half width. */
  columns?: 2 | 3;
  fields?: Field[];
  isLoading?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {actions}
      </div>
      {fields?.length ? (
        <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 smallPhone:grid-cols-2 ${columns === 3 ? "md:grid-cols-3" : ""}`}>
          {fields.map((field) => (
            <div
              key={field.label}
              className={field.wide ? "col-span-full flex flex-col gap-1" : "flex min-w-0 flex-col gap-1"}
            >
              <dt className="text-xs text-muted">{field.label}</dt>
              <dd className="flex min-w-0 items-center gap-1 text-sm break-words">
                {isLoading ? (
                  <Skeleton className="h-4 w-28 rounded-md" />
                ) : (
                  <>
                    <span className="min-w-0">
                      {field.value === undefined || field.value === null || field.value === ""
                        ? "–"
                        : field.value}
                    </span>
                    {field.copy ? <CopyButton text={field.copy} /> : null}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </Card>
  );
}
