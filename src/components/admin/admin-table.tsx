"use client";

import { Skeleton, Table } from "@heroui/react";
import type { Key, ReactNode } from "react";
import { Icon } from "@/components/icon";

export type Column = {
  key: string;
  label: string;
  /** The column that names the row, for screen readers. One column. */
  isRowHeader?: boolean;
  /** Hidden label, for a column of buttons. */
  hideLabel?: boolean;
  className?: string;
  /**
   * The shape of the cell while the table loads: "user" (avatar and two
   * lines), "media" (photo and two lines), "lines" (two lines), "chip",
   * "icon", or "text" (one line). A column with a hidden label is "icon".
   */
  skeleton?: SkeletonShape;
};

type SkeletonShape = "user" | "media" | "lines" | "chip" | "icon" | "text";

/** Widths of the lines in the loading rows, so that the rows do not look the same. */
const LINE_WIDTHS = ["w-32", "w-24", "w-40", "w-28", "w-36", "w-20"];
const SUB_WIDTHS = ["w-40", "w-28", "w-32", "w-44", "w-24", "w-36"];

function SkeletonCell({
  shape,
  row,
  alignEnd,
}: {
  shape: SkeletonShape;
  row: number;
  alignEnd: boolean;
}) {
  const line = LINE_WIDTHS[row % LINE_WIDTHS.length];
  const sub = SUB_WIDTHS[row % SUB_WIDTHS.length];
  const lines = (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Skeleton className={`h-3.5 ${line} max-w-full rounded-md`} />
      <Skeleton className={`h-3 ${sub} max-w-full rounded-md`} />
    </div>
  );
  switch (shape) {
    case "user":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          {lines}
        </div>
      );
    case "media":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          {lines}
        </div>
      );
    case "lines":
      return lines;
    case "chip":
      return <Skeleton className="h-6 w-16 rounded-full" />;
    case "icon":
      return <Skeleton className="ml-auto size-6 rounded-full" />;
    case "text":
      return (
        <Skeleton
          className={`h-3.5 ${line} max-w-full rounded-md ${alignEnd ? "ml-auto" : ""}`}
        />
      );
  }
}

/**
 * A list of records in a HeroUI table. A click on a row (or Enter) calls
 * `onRowAction`. Buttons in a cell do not open the row.
 */
export function AdminTable<T>({
  label,
  columns,
  items,
  getKey,
  renderCell,
  isLoading = false,
  loadingRows = 8,
  emptyText = "Nothing to show.",
  onRowAction,
}: {
  /** The name of the table, for screen readers. */
  label: string;
  columns: Column[];
  items: T[];
  getKey: (item: T) => string;
  renderCell: (item: T, columnKey: string) => ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  emptyText?: string;
  onRowAction?: (item: T) => void;
}) {
  const byKey = new Map(items.map((item) => [getKey(item), item]));

  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content
          aria-label={label}
          className="min-w-[720px]"
          onRowAction={
            onRowAction && !isLoading
              ? (key: Key) => {
                  const item = byKey.get(String(key));
                  if (item) onRowAction(item);
                }
              : undefined
          }
        >
          <Table.Header>
            {columns.map((column) => (
              <Table.Column
                key={column.key}
                id={column.key}
                isRowHeader={column.isRowHeader}
                className={column.className}
              >
                {column.hideLabel ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <div className="flex flex-col items-center gap-2 py-16 text-muted">
                <Icon name="file-tray-outline" size={40} />
                <p className="text-sm">{emptyText}</p>
              </div>
            )}
          >
            {isLoading
              ? Array.from({ length: loadingRows }, (_, row) => (
                  <Table.Row key={`loading-${row}`} id={`loading-${row}`}>
                    {columns.map((column) => (
                      <Table.Cell key={column.key} className={column.className}>
                        <SkeletonCell
                          shape={column.skeleton ?? (column.hideLabel ? "icon" : "text")}
                          row={row}
                          alignEnd={column.className?.includes("text-right") ?? false}
                        />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : items.map((item) => {
                  const key = getKey(item);
                  return (
                    <Table.Row
                      key={key}
                      id={key}
                      className={onRowAction ? "cursor-pointer" : undefined}
                    >
                      {columns.map((column) => (
                        <Table.Cell key={column.key} className={column.className}>
                          {renderCell(item, column.key)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  );
                })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
