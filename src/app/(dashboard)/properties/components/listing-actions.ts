import type { Listing } from "@/app/endpoints/properties/properties-types";
import type { RowAction } from "@/components/admin";

export type ManageListing = (args: { action: "activate" | "deactivate"; id: string }) => Promise<void>;

/** "View details" and "Activate" or "Deactivate" for one listing. */
export function listingActions(
  listing: Listing,
  manage: ManageListing,
  open: (id: string) => void,
): RowAction[] {
  const active = listing.status === "active";
  return [
    { id: "view", label: "View details", icon: "home-outline", onAction: () => open(listing._id) },
    {
      id: "status",
      label: active ? "Deactivate" : "Activate",
      icon: active ? "close-circle" : "checkmark-circle-outline",
      danger: active,
      onAction: () => void manage({ action: active ? "deactivate" : "activate", id: listing._id }),
    },
  ];
}
