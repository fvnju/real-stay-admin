"use client";

import { Button, Card, Modal, Skeleton, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  DetailSection,
  formatDate,
  fullName,
  PageHeader,
  StatusChip,
  UserAvatar,
  useGuardedAction,
  formatPhone,
  phoneToCopy,
} from "@/components/admin";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { useSessionUser } from "@/app/providers/session-user";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleSelect } from "../components/role-select";
import { AdminAccessSection } from "../components/admin-access-section";

/** One admin account. Also used by `/audit-logs/[id]` (the admin of a log). */
export default function AdminDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const { data, isFetching } = userApi.useGetUserQuery({ path: { id: params.id } });
  const user = data?.data?.user;
  const userId = user?._id || user?.id;
  const name = fullName(user);
  const loading = isFetching && !user;
  const session = useSessionUser();
  const { data: me } = useMyPermissions();
  const isSelf = !!userId && session?.id === userId;
  const canChangeOwn = !!me?.isSuperAdmin;
  const [changeOpen, setChangeOpen] = useState(false);
  const guard = useGuardedAction();

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
        title="Role"
        isLoading={loading}
        actions={
          user && (!isSelf || canChangeOwn) ? (
            <Button
              size="sm"
              variant="secondary"
              onPress={guard("admin-management:actions", () => setChangeOpen(true))}
            >
              Change role
            </Button>
          ) : null
        }
        fields={[
          { label: "Role", value: user?.role_name || "No role" },
          ...(isSelf && !canChangeOwn
            ? [{ label: "Your role", value: "You cannot change your own role." }]
            : []),
        ]}
      />

      {user && userId ? (
        <ChangeRoleDialog
          open={changeOpen}
          onClose={() => setChangeOpen(false)}
          adminId={userId}
          currentRoleId={user.role_id ?? ""}
        />
      ) : null}

      {user && userId && user.user_type === "admin" ? <AdminAccessSection admin={user} adminId={userId} /> : null}

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
    </div>
  );
}

/** Gives the admin another role, never above the role of the signed-in admin. */
function ChangeRoleDialog({
  open,
  onClose,
  adminId,
  currentRoleId,
}: {
  open: boolean;
  onClose: () => void;
  adminId: string;
  currentRoleId: string;
}) {
  const [roleId, setRoleId] = useState(currentRoleId);
  const { data: me } = useMyPermissions();
  const roles = rbacApi.useGetRolesQuery(ALL_ROLES_ARGS, { skip: !open });
  const [changeRole, { isLoading }] = userApi.useChangeAdminRoleMutation();

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && onClose()}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Change role</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <RoleSelect
              roles={roles.data?.data?.roles ?? []}
              me={me}
              value={roleId}
              onChange={setRoleId}
              isLoading={roles.isLoading}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={isLoading || !roleId || roleId === currentRoleId}
              onPress={() =>
                changeRole({ id: adminId, roleId })
                  .unwrap()
                  .then(() => {
                    toast.success("Role changed.");
                    onClose();
                  })
                  .catch((err) => toast.error(roleErrorMessage(err)))
              }
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              Save
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
