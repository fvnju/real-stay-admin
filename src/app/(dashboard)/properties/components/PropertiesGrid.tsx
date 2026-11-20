"use client";

import { Card, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatNaira, fullName, RowActions, StatusChip } from "@/components/admin";
import { Icon } from "@/components/icon";
import type { Listing } from "@/app/endpoints/properties/properties-types";
import { listingActions, type ManageListing } from "./listing-actions";

/** Listings as photo cards. */
export default function PropertiesGrid({
  listings,
  isFetching,
  manage,
}: {
  listings: Listing[];
  isFetching: boolean;
  manage: ManageListing;
}) {
  const router = useRouter();
  const open = (id: string) => router.push(`/properties/${id}`);

  if (isFetching) {
    return (
      <div className="grid grid-cols-1 gap-4 smallPhone:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted">
        <Icon name="file-tray-outline" size={40} />
        <p className="text-sm">No listings match.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 smallPhone:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <Card key={l._id} className="relative gap-0 overflow-hidden p-0">
          <button
            type="button"
            onClick={() => open(l._id)}
            className="flex flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={`Open ${l.title || "listing"}`}
          >
            <div className="aspect-[4/3] w-full bg-default">
              {l.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos come from many hosts
                <img src={l.photos[0]} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  <Icon name="image-outline" size={32} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 p-4">
              <div className="flex items-center justify-between gap-2">
                <StatusChip status={l.status || "pending"} />
                <span className="text-sm font-medium tabular-nums">
                  {l.hasRooms ? "Rooms" : formatNaira(l.cost)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                <span className="truncate">{l.title || "Untitled listing"}</span>
                {l.isVerified ? (
                  <Icon name="shield-checkmark" size={14} className="shrink-0 text-accent" label="Verified" />
                ) : null}
              </p>
              <p className="truncate text-xs text-muted">
                {[l.neighbourhood, l.lga, l.state].filter(Boolean).join(", ")}
              </p>
              <p className="truncate text-xs text-muted">Host: {fullName(l.owner)}</p>
            </div>
          </button>
          <div className="absolute right-2 top-2 rounded-full bg-overlay/90">
            <RowActions label={`Actions for ${l.title}`} actions={listingActions(l, manage, open)} />
          </div>
        </Card>
      ))}
    </div>
  );
}
