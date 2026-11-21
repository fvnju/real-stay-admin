"use client";

import { Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  CopyButton,
  formatDateTime,
  formatNaira,
  StatusChip,
  statusLabel,
  type Column,
} from "@/components/admin";
import type { Transaction } from "@/app/endpoints/transactions/transactions-types";

const COLUMNS: Column[] = [
  { key: "time", label: "Time" },
  { key: "description", label: "Description", isRowHeader: true },
  { key: "amount", label: "Amount", className: "text-right" },
  { key: "type", label: "Type", skeleton: "chip" },
  { key: "status", label: "Status", skeleton: "chip" },
  { key: "reference", label: "Reference" },
  { key: "provider", label: "Provider" },
];

/** Money in is green, money out is red. */
const TYPE_COLORS: Record<string, "success" | "danger" | "accent" | "default"> = {
  PAYMENT: "success",
  WALLET_INFLOW: "success",
  CREDIT: "accent",
  DEBIT: "danger",
  REFUND: "danger",
  WALLET_OUTFLOW: "danger",
};

export const TransactionTable: FC<{ transactions: Transaction[]; isFetching: boolean }> = ({
  transactions,
  isFetching,
}) => {
  const router = useRouter();
  return (
    <AdminTable
      label="Transactions"
      columns={COLUMNS}
      items={transactions}
      getKey={(t) => t._id}
      isLoading={isFetching}
      emptyText="No transactions match."
      onRowAction={(t) => router.push(`/transactions/${t._id}`)}
      renderCell={(t, key) => {
        switch (key) {
          case "time":
            return <span className="whitespace-nowrap tabular-nums">{formatDateTime(t.createdAt)}</span>;
          case "description":
            return <span className="line-clamp-2 max-w-64">{t.description || "–"}</span>;
          case "amount":
            return <span className="block text-right font-medium tabular-nums">{formatNaira(t.amount)}</span>;
          case "type":
            return t.type ? (
              <Chip size="sm" variant="soft" color={TYPE_COLORS[t.type] ?? "default"}>
                {statusLabel(t.type)}
              </Chip>
            ) : (
              "–"
            );
          case "status":
            return <StatusChip status={t.status} />;
          case "reference":
            return t.reference ? (
              <span className="flex items-center gap-1 font-mono text-xs">
                <span className="max-w-32 truncate">{t.reference}</span>
                <CopyButton text={t.reference} label="Copy reference" />
              </span>
            ) : (
              "–"
            );
          case "provider":
            return <span className="capitalize">{t.provider ?? "–"}</span>;
        }
      }}
    />
  );
};
