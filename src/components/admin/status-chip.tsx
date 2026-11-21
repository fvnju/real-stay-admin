"use client";

import { Chip } from "@heroui/react";

type ChipColor = "success" | "warning" | "danger" | "accent" | "default";

/** The color of each status that the backend sends (case does not matter). */
const STATUS_COLORS: Record<string, ChipColor> = {
  active: "success",
  approved: "success",
  success: "success",
  successful: "success",
  booked: "success",
  paid: "success",
  completed: "success",
  confirmed: "success",
  payment: "success",
  wallet_inflow: "success",
  pending: "warning",
  open: "warning",
  processing: "warning",
  awaiting_payment: "warning",
  reserved: "accent",
  actioned: "accent",
  credit: "accent",
  inactive: "danger",
  failed: "danger",
  declined: "danger",
  rejected: "danger",
  cancelled: "danger",
  canceled: "danger",
  expired: "danger",
  removed: "danger",
  debit: "danger",
  refund: "danger",
  wallet_outflow: "danger",
};

/** The color of a status, "default" when the status is not known. */
export function statusColor(status: string): ChipColor {
  return STATUS_COLORS[status.toLowerCase()] ?? "default";
}

/** "WALLET_INFLOW" -> "Wallet inflow". */
export function statusLabel(status: string) {
  const text = status.replace(/[_-]+/g, " ").toLowerCase().trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A status as a small colored pill. */
export function StatusChip({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted">–</span>;
  const color = STATUS_COLORS[status.toLowerCase()] ?? "default";
  return (
    <Chip size="sm" variant="soft" color={color}>
      {statusLabel(status)}
    </Chip>
  );
}
