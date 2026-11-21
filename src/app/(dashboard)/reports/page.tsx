"use client";

import { Card } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminTable,
  FilterMenu,
  PageHeader,
  SegmentTabs,
  StatusChip,
  TablePagination,
  formatDate,
  type Column,
} from "@/components/admin";
import type { AdminReport } from "@/app/endpoints/attention/attention-types";
import { reportsApi } from "@/app/endpoints/reports/reports-api-slice";
import { PAGE_SIZE, reportsArgs, waitsForData } from "@/lib/page-queries";
import { reasonLabel } from "@/lib/report-reasons";
import { personName, reportTargetName } from "./components/report-text";

const STATUSES = [
  { label: "Open", value: "open" },
  { label: "Dismissed", value: "dismissed" },
  { label: "Actioned", value: "actioned" },
];

const TARGETS = [
  { label: "All", value: "" },
  { label: "Listings", value: "listing" },
  { label: "Users", value: "user" },
];

const COLUMNS: Column[] = [
  { key: "target", label: "Reported", isRowHeader: true },
  { key: "reason", label: "Reason" },
  { key: "reporter", label: "Reporter" },
  { key: "open", label: "Open reports of it" },
  { key: "status", label: "Status" },
  { key: "date", label: "Sent" },
];

export default function ReportsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState("open");
  const [targetType, setTargetType] = useState("");

  const listQuery = reportsApi.useGetReportsQuery(
    reportsArgs({ page, pageSize, status, targetType }),
  );
  const queue = listQuery.data?.data;
  const isFetching = waitsForData(listQuery);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Users reported these listings, hosts and guests. The oldest come first."
      />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentTabs
            label="Status"
            segments={STATUSES}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <FilterMenu
            label="Reported"
            options={TARGETS}
            value={targetType}
            onChange={(v) => {
              setTargetType(v);
              setPage(1);
            }}
          />
        </div>

        <AdminTable<AdminReport>
          label="Reports"
          columns={COLUMNS}
          items={queue?.data ?? []}
          getKey={(r) => r.id}
          isLoading={isFetching}
          emptyText={status === "open" ? "No open reports." : "No reports."}
          onRowAction={(r) => router.push(`/reports/${r.id}`)}
          renderCell={(r, key) => {
            switch (key) {
              case "target":
                return (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{reportTargetName(r)}</p>
                    <p className="truncate text-xs text-muted">
                      {r.targetType === "listing" ? "Listing" : "User"}
                    </p>
                  </div>
                );
              case "reason":
                return reasonLabel(r.reason);
              case "reporter":
                return <span className="truncate">{personName(r.reporter)}</span>;
              case "open":
                return <span className="tabular-nums">{r.openReportsOfTarget}</span>;
              case "status":
                return <StatusChip status={r.status} />;
              case "date":
                return formatDate(r.createdAt);
              default:
                return null;
            }
          }}
        />
        <TablePagination
          total={queue?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
