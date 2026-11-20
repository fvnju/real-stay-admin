"use client";

import { Card, Skeleton } from "@heroui/react";
import { useParams } from "next/navigation";
import {
  DetailSection,
  formatDate,
  fullName,
  PageHeader,
  StatusChip,
  UserAvatar,
} from "@/components/admin";
import { userApi } from "@/app/endpoints/user/user-api-slice";

/** One admin account. Also used by `/audit-logs/[id]` (the admin of a log). */
export default function AdminDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const { data, isFetching } = userApi.useGetUserQuery({ path: { id: params.id } });
  const user = data?.data?.user;
  const userId = user?._id || user?.id;
  const name = fullName(user);
  const loading = isFetching && !user;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader showBack title={name} description="Admin details" isLoading={loading} />

      <Card className="flex-row flex-wrap items-center gap-4 p-5">
        {loading ? (
          <Skeleton className="size-16 rounded-full" />
        ) : (
          <UserAvatar user={user} size="lg" />
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{loading ? "" : name}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
        <div className="ml-auto">
          <StatusChip status={user?.status} />
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
    </div>
  );
}
