"use client";

import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  formatDate,
  formatNaira,
  RowActions,
  StatusChip,
  UserCell,
  type Column,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import type { Listing } from "@/app/endpoints/properties/properties-types";
import { listingActions, type ManageListing } from "./listing-actions";

const COLUMNS: Column[] = [
  { key: "listing", label: "Listing", isRowHeader: true },
  { key: "host", label: "Host" },
  { key: "price", label: "Price", className: "text-right" },
  { key: "status", label: "Status" },
  { key: "created", label: "Listed" },
  { key: "actions", label: "Actions", hideLabel: true, className: "w-12" },
];

export const PropertiesTable: FC<{
  listings: Listing[];
  isFetching: boolean;
  manage: ManageListing;
}> = ({ listings, isFetching, manage }) => {
  const router = useRouter();
  const open = (id: string) => router.push(`/properties/${id}`);

  return (
    <AdminTable
      label="Listings"
      columns={COLUMNS}
      items={listings}
      getKey={(l) => l._id}
      isLoading={isFetching}
      emptyText="No listings match."
      onRowAction={(l) => open(l._id)}
      renderCell={(l, key) => {
        switch (key) {
          case "listing":
            return (
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-default">
                  {l.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- photos come from many hosts
                    <img src={l.photos[0]} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 max-w-64">
                  <p className="flex items-center gap-1 truncate text-sm font-medium">
                    <span className="truncate">{l.title || "Untitled listing"}</span>
                    {l.isVerified ? (
                      <Icon name="shield-checkmark" size={14} className="shrink-0 text-accent" label="Verified" />
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {[l.neighbourhood, l.lga, l.state].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            );
          case "host":
            return <UserCell user={l.owner} secondary={l.owner?.email} />;
          case "price":
            return (
              <span className="block whitespace-nowrap text-right tabular-nums">
                {l.hasRooms ? "Rooms" : `${formatNaira(l.cost)} / ${l.cost_cycle ?? "night"}`}
              </span>
            );
          case "status":
            return <StatusChip status={l.status || "pending"} />;
          case "created":
            return formatDate(l.createdAt);
          case "actions":
            return (
              <RowActions label={`Actions for ${l.title}`} actions={listingActions(l, manage, open)} />
            );
        }
      }}
    />
  );
};
