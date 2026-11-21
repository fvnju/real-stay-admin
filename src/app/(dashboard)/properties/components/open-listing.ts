"use client";

import { useTransitionRouter } from "next-view-transitions";
import { type CSSProperties, useCallback } from "react";
import type { ApiResponse } from "@/app/endpoints/api";
import { listingsApi } from "@/app/endpoints/properties/properties-api-slice";
import type { Listing } from "@/app/endpoints/properties/properties-types";
import { useAppDispatch } from "@/app/store/hooks/store-hooks";

/**
 * The view transition style of the photo of a listing. The card photo and the
 * first photo of the detail page have the same name, so the browser morphs
 * one into the other when the page changes.
 */
export const listingPhotoTransition = (id: string): CSSProperties =>
  ({
    viewTransitionName: `listing-photo-${id}`,
    // globals.css: the photo keeps its crop while it changes size.
    viewTransitionClass: "listing-photo",
  }) as CSSProperties;

/**
 * Open the detail page of a listing with a view transition.
 *
 * The listing of the list goes into the cache of the detail query first, so
 * the detail page shows its photo at once and the morph has a target. The
 * detail page then loads the listing again in the background.
 */
export function useOpenListing(listings: Listing[]) {
  const router = useTransitionRouter();
  const dispatch = useAppDispatch();

  return useCallback(
    (id: string) => {
      const listing = listings.find((l) => l._id === id);
      if (listing) {
        dispatch(
          listingsApi.util.upsertQueryData("getListing", { path: { id } }, {
            success: true,
            data: listing,
          } as ApiResponse<Listing>),
        );
      }
      router.push(`/properties/${id}`);
    },
    [listings, dispatch, router],
  );
}
