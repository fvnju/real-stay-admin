"use client";

import { Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import { AdminTable, formatDateTime, fullName, statusLabel, type Column } from "@/components/admin";
import type { AuditLog } from "@/app/endpoints/auditlogs/audit-logs-types";

const COLUMNS: Column[] = [
  { key: "time", label: "Time" },
  { key: "action", label: "Action", isRowHeader: true },
  { key: "description", label: "Description" },
  { key: "by", label: "Done by" },
];

export const AuditLogTable: FC<{ logs: AuditLog[]; isFetching: boolean }> = ({
  logs,
  isFetching,
}) => {
  const router = useRouter();
  return (
    <AdminTable
      label="Audit logs"
      columns={COLUMNS}
      items={logs}
      getKey={(log) => log._id}
      isLoading={isFetching}
      emptyText="No audit logs match."
      onRowAction={(log) => log.user_id && router.push(`/admin-management/${log.user_id}`)}
      renderCell={(log, key) => {
        switch (key) {
          case "time":
            return <span className="whitespace-nowrap tabular-nums">{formatDateTime(log.createdAt)}</span>;
          case "action":
            return (
              <Chip size="sm" variant="soft">
                {statusLabel(log.action ?? "")}
              </Chip>
            );
          case "description":
            return <span className="line-clamp-2 max-w-md">{log.description || "–"}</span>;
          case "by":
            return fullName(log);
        }
      }}
    />
  );
};
