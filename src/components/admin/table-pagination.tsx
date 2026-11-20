"use client";

import { ListBox, Pagination, Select } from "@heroui/react";

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

/** Page numbers to show: the first, the last, and the pages near `page`. */
function pagesToShow(page: number, pages: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) out.push(p);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}

/** The total, the rows per page, and the page buttons under a table. */
export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = DEFAULT_PAGE_SIZES,
}: {
  total: number;
  /** 1-based. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** The choices of "Rows per page". */
  pageSizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted tabular-nums">
        {total.toLocaleString()} {total === 1 ? "result" : "results"}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-muted">
          <span id="rows-per-page">Rows per page</span>
          <Select
            aria-labelledby="rows-per-page"
            className="w-20"
            selectedKey={String(pageSize)}
            onSelectionChange={(key) => {
              onPageSizeChange(Number(key));
              onPageChange(1);
            }}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {pageSizes.map((size) => (
                  <ListBox.Item key={size} id={String(size)} textValue={String(size)}>
                    {size}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
        <Pagination size="sm" className="w-auto">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page <= 1}
                onPress={() => onPageChange(page - 1)}
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {pagesToShow(page, pages).map((p, i) =>
              p === "gap" ? (
                <Pagination.Item key={`gap-${i}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={p}>
                  <Pagination.Link
                    isActive={p === page}
                    aria-label={`Page ${p}`}
                    onPress={() => onPageChange(p)}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page >= pages}
                onPress={() => onPageChange(page + 1)}
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </div>
    </div>
  );
}
