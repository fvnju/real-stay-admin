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
};

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
                      <Table.Cell key={column.key}>
                        <Skeleton className="h-4 w-full max-w-40 rounded-md" />
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
