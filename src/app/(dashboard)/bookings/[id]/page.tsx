"use client";

import { Button } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import {
  DetailSection,
  formatDate,
  formatDateTime,
  formatNaira,
  formatStayDate,
  fullName,
  listingFields,
  nightsBetween,
  PageHeader,
  PhotoGallery,
  StatusChip,
  formatPhone,
  phoneToCopy,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { bookingsApi } from "@/app/endpoints/bookings/bookings-api-slice";
import type { User } from "@/app/endpoints/user/user-types";

export default function BookingDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isFetching } = bookingsApi.useGetBookingByIdQuery({
    path: { id: params.id },
  });
  const booking = data?.data;
  const loading = isFetching && !booking;
  const nights = nightsBetween(booking?.start_date, booking?.end_date);

  const personFields = (user?: User) => [
    { label: "Name", value: fullName(user) },
    { label: "Email", value: user?.email, copy: user?.email },
    { label: "Phone number", value: formatPhone(user?.phone_number), copy: phoneToCopy(user?.phone_number) },
    { label: "Joined", value: formatDate(user?.createdAt) },
  ];

  const openUser = (id?: string) => id && router.push(`/users/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={booking?.listing?.title || "Booking"}
        description={
          booking ? (
            <span className="flex flex-wrap items-center gap-2">
              Booking <StatusChip status={booking.status} />
            </span>
          ) : undefined
        }
        isLoading={loading}
      />

      <DetailSection
        title="Booking"
        isLoading={loading}
        fields={[
          { label: "Booking ID", value: booking?._id, copy: booking?._id },
          { label: "Status", value: <StatusChip status={booking?.status} /> },
          { label: "Requested", value: formatDateTime(booking?.createdAt) },
          { label: "Check-in", value: formatStayDate(booking?.start_date) },
          { label: "Checkout", value: formatStayDate(booking?.end_date) },
          { label: "Nights", value: nights },
          { label: "Total", value: formatNaira(booking?.booking_cost) },
          { label: "RealStay margin", value: formatNaira(booking?.margin) },
          { label: "Payment reference", value: booking?.paymentRef, copy: booking?.paymentRef },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DetailSection
          title="Guest"
          columns={2}
          isLoading={loading}
          fields={personFields(booking?.customer)}
          actions={
            booking?.customer_id ? (
              <Button size="sm" variant="ghost" onPress={() => openUser(booking.customer_id)}>
                View
                <Icon name="chevron-forward" size={14} />
              </Button>
            ) : null
          }
        />
        <DetailSection
          title="Host"
          columns={2}
          isLoading={loading}
          fields={personFields(booking?.owner)}
          actions={
            booking?.property_owner_id ? (
              <Button size="sm" variant="ghost" onPress={() => openUser(booking.property_owner_id)}>
                View
                <Icon name="chevron-forward" size={14} />
              </Button>
            ) : null
          }
        />
      </div>

      <DetailSection
        title="Listing"
        isLoading={loading}
        fields={listingFields(booking?.listing)}
        actions={
          booking?.listing_id ? (
            <Button size="sm" variant="ghost" onPress={() => router.push(`/properties/${booking.listing_id}`)}>
              View listing
              <Icon name="chevron-forward" size={14} />
            </Button>
          ) : null
        }
      >
        {booking?.listing ? (
          <PhotoGallery photos={booking.listing.photos ?? []} title={booking.listing.title} />
        ) : null}
      </DetailSection>
    </div>
  );
}
