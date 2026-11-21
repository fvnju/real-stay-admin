"use client";

import { isRemovedAdmin } from "@/lib/admin-removal";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  formatDate,
  StatusChip,
  UserCell,
  type Column,
} from "@/components/admin";
import type { User } from "@/app/endpoints/user/user-types";

const COLUMNS: Column[] = [
  { key: "user", label: "Admin", isRowHeader: true },
  { key: "phone", label: "Phone number" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined" },
];

const idOf = (u: User) => u._id || u.id;

export const UserTable: FC<{ users: User[]; isFetching: boolean }> = ({
  users,
  isFetching,
}) => {
  const router = useRouter();
  return (
    <AdminTable
      label="Admins"
      columns={COLUMNS}
      items={users}
      getKey={idOf}
      isLoading={isFetching}
      emptyText="No admins match."
      onRowAction={(u) => router.push(`/admin-management/${idOf(u)}`)}
      renderCell={(u, key) => {
        switch (key) {
          case "user":
            return <UserCell user={u} secondary={u.email} />;
          case "phone":
            return <span className="tabular-nums">{u.phone_number ?? "–"}</span>;
          case "status":
            return isRemovedAdmin(u) ? <StatusChip status="removed" /> : <StatusChip status={u.status} />;
          case "joined":
            return formatDate(u.createdAt);
        }
      }}
    />
  );
};
