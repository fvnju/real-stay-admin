"use client";

import { Button, Chip } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  fullName,
  listingFields,
  PageHeader,
  PhotoGallery,
  ReviewList,
  StatusChip,
  totalItems,
  useGuardedAction,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { listingsApi } from "@/app/endpoints/properties/properties-api-slice";
import { reviewsApi } from "@/app/endpoints/reviews/reviews-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";

export default function PropertyDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isFetching, refetch } = listingsApi.useGetListingQuery({
    path: { id: params.id },
  });
  const listing = data?.data;
  const loading = isFetching && !listing;

  const { data: reviewsRes, isFetching: isFetchingReviews } = reviewsApi.useGetReviewsQuery({
    params: { listing_id: params.id },
  });

  const [manageListing, { isLoading: isChanging }] = listingsApi.useManageListingMutation();
  const active = listing?.status === "active";

  const guard = useGuardedAction();
  const toggleStatus = async () => {
    if (!listing) return;
    const action = active ? "deactivate" : "activate";
    await manageListing({ path: { id: listing._id, action } })
      .unwrap()
      .then(() => {
        toast.success(active ? "Listing deactivated." : "Listing activated.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={listing?.title || "Listing"}
        isLoading={loading}
        description={
          listing ? (
            <span className="flex flex-wrap items-center gap-2">
              <StatusChip status={listing.status || "pending"} />
              {listing.isVerified ? (
                <Chip size="sm" variant="soft" color="accent">
                  <Icon name="shield-checkmark" size={12} />
                  Verified
                </Chip>
              ) : null}
              <span>{[listing.neighbourhood, listing.lga, listing.state].filter(Boolean).join(", ")}</span>
            </span>
          ) : undefined
        }
        actions={
          listing ? (
            <Button
              size="sm"
              variant={active ? "danger-soft" : "primary"}
              isPending={isChanging}
              onPress={guard("properties:actions", toggleStatus)}
            >
              <Icon name={active ? "close-circle" : "checkmark-circle-outline"} size={16} />
              {active ? "Deactivate" : "Activate"}
            </Button>
          ) : null
        }
      />

      <DetailSection title="Photos" isLoading={loading}>
        {listing ? <PhotoGallery photos={listing.photos ?? []} title={listing.title} /> : null}
      </DetailSection>

      <DetailSection title="Listing" isLoading={loading} fields={listingFields(listing)} />

      <DetailSection
        title="Host"
        isLoading={loading}
        fields={[
          { label: "Name", value: fullName(listing?.owner) },
          { label: "Email", value: listing?.owner?.email, copy: listing?.owner?.email },
          { label: "Phone number", value: listing?.owner?.phone_number, copy: listing?.owner?.phone_number },
          { label: "Joined", value: formatDate(listing?.owner?.createdAt) },
        ]}
        actions={
          listing?.owner_id ? (
            <Button size="sm" variant="ghost" onPress={() => router.push(`/users/${listing.owner_id}`)}>
              View
              <Icon name="chevron-forward" size={14} />
            </Button>
          ) : null
        }
      />

      <ReviewList
        reviews={reviewsRes?.data?.reviews ?? []}
        total={totalItems(reviewsRes)}
        isLoading={isFetchingReviews}
      />
    </div>
  );
}
