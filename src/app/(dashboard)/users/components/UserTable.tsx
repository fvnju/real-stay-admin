"use client";

import { Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import {
  AdminTable,
  CopyButton,
  formatDate,
  formatPhone,
  phoneToCopy,
  fullName,
  RowActions,
  StatusChip,
  UserCell,
  type Column,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import type { User } from "@/app/endpoints/user/user-types";
import { effectiveUserStatus, isDeletedUser, isFlaggedUser } from "@/lib/user-management";
import { UserActionEnum, UserStatusEnum } from "../interfaces/users.types";

const COLUMNS: Column[] = [
  { key: "user", label: "User", isRowHeader: true, skeleton: "user" },
  { key: "phone", label: "Phone number" },
  { key: "role", label: "Role" },
  { key: "kyc", label: "KYC", skeleton: "chip" },
  { key: "status", label: "Status", skeleton: "chip" },
  { key: "joined", label: "Joined" },
  { key: "actions", label: "Actions", hideLabel: true, className: "w-12" },
];

const idOf = (u: User) => u._id || u.id;

export const UserTable: FC<{
  users: User[];
  isFetching: boolean;
  manageUser: ({ action, id }: { action: string; id: string }) => Promise<void>;
  restoreUser: (id: string) => Promise<void>;
}> = ({ users, isFetching, manageUser, restoreUser }) => {
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
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                {formatPhone(u.phone_number)}
                <CopyButton text={phoneToCopy(u.phone_number) ?? u.phone_number} label="Copy phone number" />
              </span>
            ) : (
              <span className="text-muted">–</span>
            );
          case "role":
            return <span className="capitalize">{u.user_type ?? "–"}</span>;
          case "kyc":
            return u.has_completed_kyc ? (
              <Chip size="sm" variant="soft" color="success">
                <Icon name="shield-checkmark-outline" size={12} />
                Verified
              </Chip>
            ) : (
              <span className="text-xs text-muted">Unverified</span>
            );
          case "status": {
            const flagged = isFlaggedUser(u);
            return (
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusChip status={effectiveUserStatus(u)} />
                {flagged ? (
                  <Chip
                    size="sm"
                    variant="soft"
                    color={u.flag_escalated ? "danger" : "warning"}
                  >
                    <Icon name="flag-outline" size={12} />
                    {u.flag_escalated ? "Escalated" : "Flagged"}
                  </Chip>
                ) : null}
              </div>
            );
          }
          case "joined":
            return formatDate(u.createdAt);
          case "actions": {
            const deleted = isDeletedUser(u);
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
                  deleted
                    ? {
                        id: "restore",
                        label: "Restore account",
                        icon: "refresh",
                        onAction: () => void restoreUser(idOf(u)),
                      }
                    : {
                        id: "status",
                        label: active ? "Deactivate" : "Activate",
                        icon: active ? "close-circle-outline" : "checkmark-circle-outline",
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
