"use client";

import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  CopyButton,
  formatDate,
  fullName,
  RowActions,
  StatusChip,
  UserCell,
  type Column,
} from "@/components/admin";
import type { User } from "@/app/endpoints/user/user-types";
import { UserActionEnum, UserStatusEnum } from "../interfaces/users.types";

const COLUMNS: Column[] = [
  { key: "user", label: "User", isRowHeader: true },
  { key: "phone", label: "Phone number" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined" },
  { key: "actions", label: "Actions", hideLabel: true, className: "w-12" },
];

const idOf = (u: User) => u._id || u.id;

export const UserTable: FC<{
  users: User[];
  isFetching: boolean;
  manageUser: ({ action, id }: { action: string; id: string }) => Promise<void>;
}> = ({ users, isFetching, manageUser }) => {
  const router = useRouter();

  return (
    <AdminTable
      label="Users"
      columns={COLUMNS}
      items={users}
      getKey={idOf}
      isLoading={isFetching}
      emptyText="No users match."
      onRowAction={(u) => router.push(`/users/${idOf(u)}`)}
      renderCell={(u, key) => {
        switch (key) {
          case "user":
            return <UserCell user={u} secondary={u.email} />;
          case "phone":
            return u.phone_number ? (
              <span className="flex items-center gap-1 tabular-nums">
                {u.phone_number}
                <CopyButton text={u.phone_number} label="Copy phone number" />
              </span>
            ) : (
              <span className="text-muted">–</span>
            );
          case "role":
            return <span className="capitalize">{u.user_type ?? "–"}</span>;
          case "status":
            return <StatusChip status={u.status} />;
          case "joined":
            return formatDate(u.createdAt);
          case "actions": {
            const active = u.status === UserStatusEnum.ACTIVE;
            return (
              <RowActions
                label={`Actions for ${fullName(u)}`}
                actions={[
                  {
                    id: "view",
                    label: "View details",
                    icon: "person-outline",
                    onAction: () => router.push(`/users/${idOf(u)}`),
                  },
                  {
                    id: "status",
                    label: active ? "Deactivate" : "Activate",
                    icon: active ? "close-circle" : "checkmark-circle-outline",
                    danger: active,
                    onAction: () =>
                      void manageUser({
                        action: active
                          ? UserActionEnum.DEACTIVATE
                          : UserActionEnum.ACTIVATE,
                        id: idOf(u),
                      }),
                  },
                ]}
              />
            );
          }
        }
      }}
    />
  );
};
