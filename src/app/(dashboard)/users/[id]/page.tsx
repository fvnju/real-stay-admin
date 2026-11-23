"use client";

import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  formatDateTime,
  fullName,
  PageHeader,
  ReviewList,
  StatusChip,
  UserAvatar,
  totalItems,
  formatPhone,
  phoneToCopy,
  useGuardedAction,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { kycApi } from "@/app/endpoints/kyc/kyc-api-slice";
import { reviewsApi } from "@/app/endpoints/reviews/reviews-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import {
  effectiveUserStatus,
  isDeletedUser,
  isFlaggedUser,
  kycImageSrc,
} from "@/lib/user-management";
import { UserActionEnum, UserStatusEnum } from "../interfaces/users.types";
import { EditUserModal } from "../components/edit-user-modal";
import { TestAccountSection } from "../components/test-account-section";
import { DeleteUserDialog, RevokeKycDialog } from "../components/user-action-dialogs";
import {
  UserComplianceSection,
  UserReportsSection,
} from "../components/user-compliance-section";

export default function UserDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeKycOpen, setRevokeKycOpen] = useState(false);

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

  const [manageUserMutation, { isLoading: isChanging }] = userApi.useManageUsersMutation();
  const [updateUserMutation, { isLoading: isUpdating }] = userApi.useUpdateUserMutation();
  const [deleteUserMutation, { isLoading: isDeleting }] = userApi.useDeleteUserMutation();
  const [restoreUserMutation, { isLoading: isRestoring }] = userApi.useRestoreUserMutation();
  const [revokeKycMutation, { isLoading: isRevokingKyc }] = kycApi.useRevokeUserKycMutation();

  const deleted = isDeletedUser(user);
  const flagged = isFlaggedUser(user);
  const active = user?.status === UserStatusEnum.ACTIVE;

  const guard = useGuardedAction();
  const toggleStatus = async () => {
    if (!userId) return;
    const action = active ? UserActionEnum.DEACTIVATE : UserActionEnum.ACTIVATE;
    await manageUserMutation({ path: { id: userId, action } })
      .unwrap()
      .then(() => {
        toast.success(
          active
            ? "User deactivated. They are signed out and cannot sign in."
            : "User activated.",
        );
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const restoreAccount = async () => {
    if (!userId) return;
    await restoreUserMutation(userId)
      .unwrap()
      .then(() => {
        toast.success("User account restored.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const selfie = kyc?.identity_data?.selfie_verification;
  const selfieSrc = kycImageSrc(kyc?.selfie_image);
  const idPhotoSrc = kycImageSrc(kyc?.identity_data?.image);
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
            <div className="flex flex-wrap items-center gap-2">
              {!deleted ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={guard("users:actions", () => setEditOpen(true))}
                  >
                    <Icon name="pencil-outline" size={16} />
                    Edit
                  </Button>
                  <Button
                    variant={active ? "danger-soft" : "primary"}
                    size="sm"
                    isPending={isChanging}
                    onPress={guard("users:actions", toggleStatus)}
                  >
                    <Icon
                      name={active ? "close-circle-outline" : "checkmark-circle-outline"}
                      size={16}
                    />
                    {active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="danger-soft"
                    size="sm"
                    onPress={guard("users:actions", () => setDeleteOpen(true))}
                  >
                    <Icon name="trash-outline" size={16} />
                    Delete
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  isPending={isRestoring}
                  onPress={guard("users:actions", restoreAccount)}
                >
                  <Icon name="refresh" size={16} />
                  Restore account
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {deleted ? (
        <Card className="flex-row items-start gap-3 bg-danger-soft p-4">
          <Icon name="trash-outline" size={20} className="mt-0.5 text-danger" />
          <div className="text-sm">
            <p className="font-medium">This account was deleted on {formatDateTime(user?.deleted_at)}</p>
            <p className="text-muted">
              {user?.delete_reason ? `Reason: ${user.delete_reason}` : "No deletion reason recorded."}
            </p>
          </div>
        </Card>
      ) : null}

      {flagged ? (
        <Card
          className={`flex-row items-start gap-3 p-4 ${
            user?.flag_escalated ? "bg-danger-soft" : "bg-warning-soft"
          }`}
        >
          <Icon
            name="flag-outline"
            size={20}
            className={`mt-0.5 ${user?.flag_escalated ? "text-danger" : "text-warning"}`}
          />
          <div className="text-sm">
            <p className="font-medium">
              {user?.flag_escalated ? "Account escalated for compliance review" : "Account flagged"}
              {" · "}
              {formatDateTime(user?.flagged_at)}
            </p>
            <p className="text-muted">{user?.flag_reason}</p>
          </div>
        </Card>
      ) : null}

      <Card className="flex-row flex-wrap items-center gap-4 p-5">
        {isFetching && !user ? (
          <Skeleton className="size-16 rounded-full" />
        ) : (
          <UserAvatar user={user} size="lg" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-lg font-semibold">{isFetching && !user ? "" : name}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm capitalize text-muted">{user?.user_type}</span>
          {user?.has_completed_kyc ? (
            <Chip size="sm" variant="soft" color="success">
              <Icon name="shield-checkmark-outline" size={12} />
              KYC verified
            </Chip>
          ) : null}
          {flagged ? (
            <Chip size="sm" variant="soft" color={user?.flag_escalated ? "danger" : "warning"}>
              <Icon name="flag-outline" size={12} />
              {user?.flag_escalated ? "Escalated" : "Flagged"}
            </Chip>
          ) : null}
          <StatusChip status={effectiveUserStatus(user)} />
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
          {
            label: "Phone number",
            value: formatPhone(user?.phone_number),
            copy: phoneToCopy(user?.phone_number),
          },
          { label: "Gender", value: <span className="capitalize">{user?.gender ?? "–"}</span> },
          {
            label: "Password",
            value:
              user?.is_password_set === false
                ? "Not set yet (host must set via Forgot password)"
                : "Set",
          },
          { label: "Joined", value: formatDate(user?.createdAt) },
        ]}
      />

      <DetailSection
        title="Identity (KYC)"
        isLoading={isFetchingKyc}
        actions={
          kyc && userId ? (
            <Button
              size="sm"
              variant="danger-soft"
              onPress={guard("users:actions", () => setRevokeKycOpen(true))}
            >
              <Icon name="shield-outline" size={16} />
              Revoke KYC
            </Button>
          ) : null
        }
        fields={
          kyc
            ? [
                { label: "ID number", value: kyc.id_number, copy: kyc.id_number },
                { label: "ID type", value: kyc.id_type?.toUpperCase() },
                { label: "Provider", value: kyc.provider },
                { label: "Date of birth", value: formatDate(kyc.identity_data?.date_of_birth) },
                {
                  label: "Selfie match",
                  value: selfie ? (
                    <StatusChip status={selfie.match ? "Approved" : "Failed"} />
                  ) : undefined,
                },
                {
                  label: "Confidence",
                  value:
                    selfie?.confidence_value != null
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
        {kyc && (selfieSrc || idPhotoSrc) ? (
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {selfieSrc ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Submitted selfie</span>
                <a
                  href={selfieSrc}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="overflow-hidden rounded-2xl bg-default"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfieSrc} alt="Submitted KYC selfie" className="h-48 w-full object-cover" />
                </a>
              </div>
            ) : null}
            {idPhotoSrc ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">Dojah ID photo</span>
                <a
                  href={idPhotoSrc}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="overflow-hidden rounded-2xl bg-default"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={idPhotoSrc} alt="Dojah ID photo" className="h-48 w-full object-cover" />
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailSection>

      {user ? <UserComplianceSection user={user} userName={name} /> : null}

      {userId ? <UserReportsSection userId={userId} /> : null}

      {userId ? <TestAccountSection userId={userId} /> : null}

      {user?.user_type === "host" || reviewsRes?.data?.reviews?.length ? (
        <ReviewList
          title="Reviews of this host"
          reviews={reviewsRes?.data?.reviews ?? []}
          total={totalItems(reviewsRes)}
          isLoading={isFetchingReviews}
        />
      ) : null}

      {user && userId ? (
        <>
          <EditUserModal
            user={user}
            open={editOpen}
            isLoading={isUpdating}
            onClose={() => setEditOpen(false)}
            onSubmit={(payload) =>
              updateUserMutation({ id: userId, data: payload })
                .unwrap()
                .then(() => {
                  toast.success("User updated.");
                  setEditOpen(false);
                  refetch();
                  return true;
                })
                .catch((err) => {
                  toast.error(GetErrorMessage(err));
                  return false;
                })
            }
          />
          <DeleteUserDialog
            open={deleteOpen}
            userName={name}
            isHost={user.user_type === "host"}
            isLoading={isDeleting}
            onClose={() => setDeleteOpen(false)}
            onConfirm={async (reason) => {
              await deleteUserMutation({ id: userId, reason })
                .unwrap()
                .then((res) => {
                  const deactivated = res?.data?.deactivated_listings ?? 0;
                  toast.success(
                    deactivated > 0
                      ? `User deleted and ${deactivated} active listing${deactivated === 1 ? "" : "s"} deactivated.`
                      : "User account deleted.",
                  );
                  refetch();
                })
                .catch((err) => toast.error(GetErrorMessage(err)));
            }}
          />
          <RevokeKycDialog
            open={revokeKycOpen}
            userName={name}
            isLoading={isRevokingKyc}
            onClose={() => setRevokeKycOpen(false)}
            onConfirm={async (reason) => {
              await revokeKycMutation({ id: userId, reason })
                .unwrap()
                .then(() => {
                  toast.success("KYC revoked. The user must verify again.");
                  refetch();
                })
                .catch((err) => toast.error(GetErrorMessage(err)));
            }}
          />
        </>
      ) : null}
    </div>
  );
}
