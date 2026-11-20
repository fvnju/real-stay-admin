"use client";

import { Avatar, Card, Skeleton } from "@heroui/react";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  fullName,
  initialsOf,
  PageHeader,
} from "@/components/admin";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { useSessionUser } from "@/app/providers/session-user";
import { GetErrorMessage } from "@/app/utils/error-handler";

export default function Profile() {
  const sessionUser = useSessionUser();
  const [userQuery, { isFetching, data }] = userApi.useLazyGetUserQuery();

  useEffect(() => {
    if (!sessionUser?.id) return;
    userQuery({ path: { id: sessionUser.id } })
      .unwrap()
      .catch((error) => {
        toast.error(GetErrorMessage(error) || "Could not load your profile.");
      });
  }, [sessionUser?.id, userQuery]);

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
          <Avatar className="size-16 text-lg">
            {user?.image_url ? <Avatar.Image src={user.image_url} alt="" /> : null}
            <Avatar.Fallback>{initialsOf(name)}</Avatar.Fallback>
          </Avatar>
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
          { label: "Phone number", value: user?.phone_number, copy: user?.phone_number },
          { label: "Gender", value: <span className="capitalize">{user?.gender ?? "–"}</span> },
          { label: "Joined", value: formatDate(user?.createdAt) },
        ]}
      />

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
