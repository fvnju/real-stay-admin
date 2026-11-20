"use client";

import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  formatDate,
  formatNaira,
  formatStayDate,
  nightsBetween,
  StatusChip,
  UserCell,
  type Column,
} from "@/components/admin";
import type { Booking } from "@/app/endpoints/bookings/bookings-types";

const COLUMNS: Column[] = [
  { key: "listing", label: "Listing", isRowHeader: true },
  { key: "stay", label: "Stay" },
  { key: "guest", label: "Guest" },
  { key: "host", label: "Host" },
  { key: "status", label: "Status" },
  { key: "cost", label: "Total", className: "text-right" },
  { key: "margin", label: "Margin", className: "text-right" },
  { key: "requested", label: "Requested" },
];

export const BookingsTable: FC<{ bookings: Booking[]; isFetching: boolean }> = ({
  bookings,
  isFetching,
}) => {
  const router = useRouter();
  return (
    <AdminTable
      label="Bookings"
      columns={COLUMNS}
      items={bookings}
      getKey={(b) => b._id}
      isLoading={isFetching}
      emptyText="No bookings match."
      onRowAction={(b) => router.push(`/bookings/${b._id}`)}
      renderCell={(b, key) => {
        switch (key) {
          case "listing":
            return (
              <div className="min-w-0 max-w-56">
                <p className="truncate text-sm font-medium">{b.listing?.title || "Untitled listing"}</p>
                <p className="truncate text-xs text-muted">
                  {[b.listing?.lga, b.listing?.state].filter(Boolean).join(", ")}
                </p>
              </div>
            );
          case "stay": {
            const nights = nightsBetween(b.start_date, b.end_date);
            return (
              <div className="whitespace-nowrap">
                <p className="text-sm">
                  {formatStayDate(b.start_date)} – {formatStayDate(b.end_date)}
                </p>
                <p className="text-xs text-muted">
                  {nights} {nights === 1 ? "night" : "nights"}
                </p>
              </div>
            );
          }
          case "guest":
            return <UserCell user={b.customer} />;
          case "host":
            return <UserCell user={b.owner} />;
          case "status":
            return <StatusChip status={b.status} />;
          case "cost":
            return <span className="block text-right tabular-nums">{formatNaira(b.booking_cost)}</span>;
          case "margin":
            return <span className="block text-right tabular-nums text-muted">{formatNaira(b.margin)}</span>;
          case "requested":
            return <span className="whitespace-nowrap">{formatDate(b.createdAt)}</span>;
        }
      }}
    />
  );
};
