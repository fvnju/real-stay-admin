import type { Listing } from "@/app/endpoints/properties/properties-types";
import type { Field } from "./detail-fields";
import { formatNaira } from "./format";

const yesNo = (v?: boolean) => (v === undefined ? undefined : v ? "Yes" : "No");

/** The facts of a listing, for a DetailSection. */
export function listingFields(listing?: Listing | null): Field[] {
  return [
    { label: "Title", value: listing?.title, wide: true },
    { label: "Description", value: listing?.description, wide: true },
    { label: "Type", value: <span className="capitalize">{listing?.type ?? "–"}</span> },
    { label: "Price", value: listing ? `${formatNaira(listing.cost)} / ${listing.cost_cycle ?? "night"}` : undefined },
    { label: "Area", value: [listing?.lga, listing?.state].filter(Boolean).join(", ") },
    { label: "Address", value: listing?.google_formatted_address || listing?.place_holder_address, wide: true },
    { label: "Bedrooms", value: listing?.no_of_bedrooms },
    { label: "Beds", value: listing?.no_of_beds },
    { label: "Bathrooms", value: listing?.no_of_bathrooms },
    { label: "Pets allowed", value: yesNo(listing?.are_pets_allowed) },
    { label: "Parties allowed", value: yesNo(listing?.are_parties_allowed) },
    {
      label: "Average rating",
      value: listing?.average_rating != null ? `${listing.average_rating.toFixed(1)} of 5` : "No ratings",
    },
    { label: "Extras", value: listing?.extra_offerings?.length ? listing.extra_offerings.join(", ") : undefined, wide: true },
  ];
}
