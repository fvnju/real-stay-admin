import type { AdminReport, PersonSummary } from "@/app/endpoints/attention/attention-types";

/** "Ada Obi", or "Unknown user" for a deleted account. */
export function personName(p?: Pick<PersonSummary, "firstName" | "lastName"> | null) {
  return [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Unknown user";
}

/** The listing title or the name of the reported user. */
export function reportTargetName(r: AdminReport) {
  if (r.targetType === "listing") {
    const title = r.listing?.title || "A listing";
    return r.listing?.deleted ? `${title} (deleted)` : title;
  }
  return personName(r.targetUser);
}

/** The page of the reported listing or user, or null for a deleted listing. */
export function reportTargetHref(r: AdminReport) {
  if (r.targetType === "listing") {
    return r.listing && !r.listing.deleted ? `/properties/${r.listing.id}` : null;
  }
  return `/users/${r.targetId}`;
}
