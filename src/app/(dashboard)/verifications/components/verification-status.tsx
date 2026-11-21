"use client";

import { Chip } from "@heroui/react";
import { statusColor } from "@/components/admin";
import { verificationStatusLabel } from "@/lib/verification-rules";

/** The status of a verification request, with the words of staff. */
export function VerificationStatusChip({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted">–</span>;
  return (
    <Chip size="sm" variant="soft" color={statusColor(status)}>
      {verificationStatusLabel(status)}
    </Chip>
  );
}

/** "Ada Obi", or "Unknown host" for a deleted account. */
export function hostName(h?: { firstName: string; lastName: string } | null) {
  return [h?.firstName, h?.lastName].filter(Boolean).join(" ") || "Unknown host";
}

/** The title of the listing, with "(deleted)" for a deleted one. */
export function listingTitle(l?: { title: string; deleted: boolean } | null) {
  const title = l?.title || "A listing";
  return l?.deleted ? `${title} (deleted)` : title;
}
