"use client";

import { Card, Skeleton } from "@heroui/react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  fullName,
  PageHeader,
  formatPhone,
  phoneToCopy,
} from "@/components/admin";
import { MyAccess } from "@/components/profile/my-access";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { useSessionUser } from "@/app/providers/session-user";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { waitsForData } from "@/lib/page-queries";

export default function Profile() {
  const sessionUser = useSessionUser();
  // A query (not a lazy query), so that it loads again after a photo change.
  const listQuery = userApi.useGetUserQuery(
    { path: { id: sessionUser?.id } },
    { skip: !sessionUser?.id },
  );
  const { data, error } = listQuery;
  const isFetching = waitsForData(listQuery);

  useEffect(() => {
    if (error) toast.error(GetErrorMessage(error) || "Could not load your profile.");
  }, [error]);

  const user = data?.data?.user;
  const userId = user?._id || user?.id;
  const name = fullName(user);
  const loading = isFetching && !user;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader title="My profile" description="Your admin account." />

      <Card className="flex-row items-center gap-4 p-5">
        {loading ? (
          <Skeleton className="size-16 rounded-full" />
        ) : (
          <ProfilePhoto user={user} />
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{loading ? "" : name}</p>
          <p className="truncate text-sm text-muted">{user?.email ?? sessionUser?.email}</p>
        </div>
      </Card>

      <DetailSection
        title="Account"
        isLoading={loading}
        fields={[
          { label: "User ID", value: userId, copy: userId },
          { label: "First name", value: user?.first_name },
          { label: "Last name", value: user?.last_name },
          { label: "Email", value: user?.email, copy: user?.email },
          { label: "Phone number", value: formatPhone(user?.phone_number), copy: phoneToCopy(user?.phone_number) },
          { label: "Gender", value: <span className="capitalize">{user?.gender ?? "–"}</span> },
          { label: "Joined", value: formatDate(user?.createdAt) },
        ]}
      />

      <MyAccess />

      <Card className="flex-row flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-sm text-muted">Follow the system, or always use light or dark mode.</p>
        </div>
        <ThemeSwitcher />
      </Card>
    </div>
  );
}
