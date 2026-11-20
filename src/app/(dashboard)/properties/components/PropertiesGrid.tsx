"use client";

import { Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatNaira, fullName, RowActions, statusColor, statusLabel } from "@/components/admin";
import { Icon } from "@/components/icon";
import type { Listing } from "@/app/endpoints/properties/properties-types";
import { listingActions, type ManageListing } from "./listing-actions";

const GRID = "grid grid-cols-1 gap-x-6 gap-y-8 smallPhone:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

/** The most dots under a photo. */
const MAX_DOTS = 5;

const DOT_COLORS = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
  default: "bg-muted",
} as const;

/** Listings as photo cards: the photo, then the text under it. */
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
      <div className={GRID}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <Skeleton className="mt-1 h-4 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
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
    <div className={GRID}>
      {listings.map((l) => (
        <ListingCard key={l._id} listing={l} manage={manage} open={open} />
      ))}
    </div>
  );
}

function ListingCard({
  listing: l,
  manage,
  open,
}: {
  listing: Listing;
  manage: ManageListing;
  open: (id: string) => void;
}) {
  const photos = l.photos?.filter(Boolean) ?? [];
  const strip = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const status = l.status || "pending";
  const place = l.neighbourhood || l.lga || l.state;
  const kind = l.hasRooms ? "Hotel" : typeLabel(l.type);

  /** The photo in view follows the scroll position of the strip. */
  const onScroll = () => {
    const el = strip.current;
    if (el && el.clientWidth) setShown(Math.round(el.scrollLeft / el.clientWidth));
  };

  /** Scroll one photo to the left or the right, with the smooth scroll of the browser. */
  const step = (by: number) => {
    const el = strip.current;
    if (!el) return;
    const next = Math.min(Math.max(shown + by, 0), photos.length - 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-default [corner-shape:squircle]">
        {photos.length ? (
          <div
            ref={strip}
            onScroll={onScroll}
            className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                tabIndex={i === 0 ? 0 : -1}
                onClick={() => open(l._id)}
                aria-label={i === 0 ? `Open ${l.title || "listing"}` : undefined}
                aria-hidden={i === 0 ? undefined : true}
                className="size-full shrink-0 snap-center snap-always outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- photos come from many hosts */}
                <img src={src} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => open(l._id)}
            aria-label={`Open ${l.title || "listing"}`}
            className="flex size-full items-center justify-center text-muted outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          >
            <Icon name="image-outline" size={32} />
          </button>
        )}

        <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur">
          <span className={`size-2 rounded-full ${DOT_COLORS[statusColor(status)]}`} />
          {statusLabel(status)}
        </span>

        <div className="absolute right-3 top-3 rounded-full bg-background/90 shadow-sm backdrop-blur">
          <RowActions label={`Actions for ${l.title}`} actions={listingActions(l, manage, open)} />
        </div>

        {photos.length > 1 ? (
          <>
            {shown > 0 ? <PhotoArrow side="left" onPress={() => step(-1)} /> : null}
            {shown < photos.length - 1 ? <PhotoArrow side="right" onPress={() => step(1)} /> : null}
            <PhotoDots count={photos.length} index={shown} />
          </>
        ) : null}
      </div>

      <button
        type="button"
        tabIndex={-1}
        onClick={() => open(l._id)}
        className="mt-3 flex flex-col text-left text-[15px] leading-snug"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="truncate font-medium">{place ? `${kind} in ${place}` : kind}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Icon name="star" size={13} />
            {l.average_rating ? l.average_rating.toFixed(1) : "New"}
          </span>
        </span>
        <span className="flex items-center gap-1 text-muted">
          <span className="truncate">{l.title || "Untitled listing"}</span>
          {l.isVerified ? (
            <Icon name="shield-checkmark" size={14} className="shrink-0 text-accent" label="Verified" />
          ) : null}
        </span>
        <span className="truncate text-muted">{l.hasRooms ? "Room types" : roomsLine(l)}</span>
        <span className="truncate text-muted">Host: {fullName(l.owner)}</span>
        <span className="mt-1.5">
          {l.hasRooms ? (
            <span className="text-muted">Priced by room</span>
          ) : (
            <>
              <span className="font-semibold tabular-nums underline underline-offset-2">
                {formatNaira(l.cost)}
              </span>{" "}
              <span className="text-muted">{cycleLabel(l.cost_cycle)}</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}

function PhotoArrow({ side, onPress }: { side: "left" | "right"; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-focus ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon name={side === "left" ? "chevron-back" : "chevron-forward"} size={16} />
    </button>
  );
}

/** Up to five dots. With more photos, the row of dots moves with the photo. */
function PhotoDots({ count, index }: { count: number; index: number }) {
  const shown = Math.min(count, MAX_DOTS);
  const first = Math.min(Math.max(index - Math.floor(MAX_DOTS / 2), 0), count - shown);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
      {Array.from({ length: shown }, (_, i) => {
        const current = first + i === index;
        const edge =
          count > MAX_DOTS && ((i === 0 && first > 0) || (i === shown - 1 && first + shown < count));
        return (
          <span
            key={i}
            className={`rounded-full bg-white shadow-sm ${
              current ? "h-1.5 w-5" : edge ? "size-1 opacity-60" : "size-1.5 opacity-60"
            }`}
          />
        );
      })}
    </div>
  );
}

/** "apartment" -> "Apartment". */
function typeLabel(type?: string | null) {
  const text = (type || "Place").replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "3 bedrooms · 3 beds · 2 baths", without the counts that are missing. */
function roomsLine(l: Listing) {
  return (
    [
      l.no_of_bedrooms ? plural(l.no_of_bedrooms, "bedroom") : null,
      l.no_of_beds ? plural(l.no_of_beds, "bed") : null,
      l.no_of_bathrooms ? plural(l.no_of_bathrooms, "bath") : null,
    ]
      .filter(Boolean)
      .join(" · ") || "–"
  );
}

/** "daily" -> "per night". */
function cycleLabel(cycle?: string | null) {
  switch ((cycle || "daily").toLowerCase()) {
    case "daily":
    case "night":
    case "nightly":
      return "per night";
    case "weekly":
      return "per week";
    case "monthly":
      return "per month";
    case "yearly":
    case "annually":
      return "per year";
    default:
      return `/ ${cycle}`;
  }
}
