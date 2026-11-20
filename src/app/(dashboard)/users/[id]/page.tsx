"use client";

import { Avatar, Button, Card, Skeleton } from "@heroui/react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  fullName,
  initialsOf,
  PageHeader,
  ReviewList,
  StatusChip,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { kycApi } from "@/app/endpoints/kyc/kyc-api-slice";
import { reviewsApi } from "@/app/endpoints/reviews/reviews-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { UserActionEnum, UserStatusEnum } from "../interfaces/users.types";

export default function UserDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const { data, isFetching, refetch } = userApi.useGetUserQuery({
    path: { id: params.id },
  });
  const user = data?.data?.user;
  const userId = user?._id || user?.id;

  const { data: kycRes, isFetching: isFetchingKyc } = kycApi.useGetUserKycQuery({
    path: { id: params.id },
  });
  const kyc = kycRes?.data;

  const { data: reviewsRes, isFetching: isFetchingReviews } =
    reviewsApi.useGetReviewsQuery(
      { params: { property_owner_id: userId } },
      { skip: !userId },
    );

  const [manageUserMutation, { isLoading: isChanging }] =
    userApi.useManageUsersMutation();
  const active = user?.status === UserStatusEnum.ACTIVE;

  const toggleStatus = async () => {
    if (!userId) return;
    const action = active ? UserActionEnum.DEACTIVATE : UserActionEnum.ACTIVATE;
    await manageUserMutation({ path: { id: userId, action } })
      .unwrap()
      .then(() => {
        toast.success(active ? "User deactivated." : "User activated.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const selfie = kyc?.identity_data?.selfie_verification;
  const name = fullName(user);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={name}
        description="User details"
        isLoading={isFetching && !user}
        actions={
          user ? (
            <Button
              variant={active ? "danger-soft" : "primary"}
              size="sm"
              isPending={isChanging}
              onPress={() => void toggleStatus()}
            >
              <Icon name={active ? "close-circle" : "checkmark-circle-outline"} size={16} />
              {active ? "Deactivate" : "Activate"}
            </Button>
          ) : null
        }
      />

      <Card className="flex-row flex-wrap items-center gap-4 p-5">
        {isFetching && !user ? (
          <Skeleton className="size-16 rounded-full" />
        ) : (
          <Avatar className="size-16 text-lg">
            {user?.image_url ? <Avatar.Image src={user.image_url} alt="" /> : null}
            <Avatar.Fallback>{initialsOf(name)}</Avatar.Fallback>
          </Avatar>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-lg font-semibold">{isFetching && !user ? "" : name}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm capitalize text-muted">{user?.user_type}</span>
          <StatusChip status={user?.status} />
        </div>
      </Card>

      <DetailSection
        title="Account"
        isLoading={isFetching && !user}
        fields={[
          { label: "User ID", value: userId, copy: userId },
          { label: "First name", value: user?.first_name },
          { label: "Last name", value: user?.last_name },
          { label: "Email", value: user?.email, copy: user?.email },
          { label: "Phone number", value: user?.phone_number, copy: user?.phone_number },
          { label: "Gender", value: <span className="capitalize">{user?.gender ?? "–"}</span> },
          { label: "Joined", value: formatDate(user?.createdAt) },
        ]}
      />

      <DetailSection
        title="Identity (KYC)"
        isLoading={isFetchingKyc}
        fields={
          kyc
            ? [
                { label: "ID number", value: kyc.id_number, copy: kyc.id_number },
                { label: "ID type", value: kyc.id_type?.toUpperCase() },
                { label: "Provider", value: kyc.provider },
                { label: "Date of birth", value: formatDate(kyc.identity_data?.date_of_birth) },
                {
                  label: "Selfie match",
                  value: selfie ? <StatusChip status={selfie.match ? "Approved" : "Failed"} /> : undefined,
                },
                {
                  label: "Confidence",
                  value: selfie?.confidence_value != null
                    ? `${Number(selfie.confidence_value).toFixed(2)}%`
                    : undefined,
                },
              ]
            : undefined
        }
      >
        {!isFetchingKyc && !kyc ? (
          <p className="text-sm text-muted">This user has not done the identity check.</p>
        ) : null}
      </DetailSection>

      {user?.user_type === "host" || reviewsRes?.data?.reviews?.length ? (
        <ReviewList
          title="Reviews of this host"
          reviews={reviewsRes?.data?.reviews ?? []}
          total={reviewsRes?.data?.pagination?.total_items}
          isLoading={isFetchingReviews}
        />
      ) : null}
    </div>
  );
}
