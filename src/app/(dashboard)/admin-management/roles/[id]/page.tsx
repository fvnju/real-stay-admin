"use client";

import { Button, Card, Modal, Skeleton, Spinner } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { PageHeader, useGuardedAction } from "@/components/admin";
import { Icon } from "@/components/icon";
import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { canGrant } from "@/lib/permissions";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { PermissionGrid } from "../../components/permission-grid";
import { RoleForm } from "../../components/role-form";

const SUPER_ADMIN_SLUG = "superadmin";

export default function RolePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const guard = useGuardedAction();
  const { data: me } = useMyPermissions();
  const { data, isFetching } = rbacApi.useGetRoleQuery(id);
  const role = data?.data ?? null;
  const [updateRole, { isLoading: isSaving }] = rbacApi.useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = rbacApi.useDeleteRoleMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSuper = role?.slug === SUPER_ADMIN_SLUG;
  // The same rules as the backend: only a Super Admin changes the Super
  // Admin role, the role that they have, or a role above them.
  const editable =
    !!role &&
    !!me &&
    (me.isSuperAdmin || (!isSuper && me.role?.id !== role._id && canGrant(me, role.permissions ?? [])));
  const whyReadOnly = !role || !me || editable
    ? null
    : isSuper
      ? "Super Admin always has every permission."
      : me.role?.id === role._id
        ? "This is your role. Only a Super Admin can change it."
        : "This role has permissions that you do not have.";

  if (isFetching && !role) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader showBack title="Role" isLoading />
        <Skeleton className="h-64 w-full rounded-[20px]" />
      </div>
    );
  }
  if (!role) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader showBack title="Role not found" description="Another admin may have deleted it." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={role.name}
        description={role.description || undefined}
        actions={
          editable && !isSuper ? (
            <Button variant="danger-soft" size="sm" onPress={guard("roles:actions", () => setConfirmDelete(true))}>
              <Icon name="trash-outline" size={16} />
              Delete
            </Button>
          ) : null
        }
      />

      {isSuper && me?.isSuperAdmin ? (
        <p className="rounded-2xl bg-default px-3 py-2 text-sm text-muted">Super Admin always has every permission.</p>
      ) : null}

      {editable ? (
        <RoleForm
          key={role._id}
          initial={{ name: role.name, description: role.description, permissions: role.permissions ?? [] }}
          me={me}
          submitText="Save"
          isSaving={isSaving}
          onSubmit={guard("roles:actions", (input) =>
            updateRole({ id: role._id, ...(isSuper ? { name: input.name, description: input.description } : input) })
              .unwrap()
              .then(() => toast.success("Role saved."))
              .catch((err) => toast.error(roleErrorMessage(err))),
          )}
        />
      ) : (
        <Card className="gap-3 p-5">
          <p className="text-sm text-muted">{whyReadOnly}</p>
          <PermissionGrid value={role.permissions ?? []} readOnly />
        </Card>
      )}

      <Modal.Backdrop isOpen={confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(false)}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Delete the role {role.name}?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">You cannot undo this.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isDisabled={isDeleting}
                onPress={() =>
                  deleteRole(role._id)
                    .unwrap()
                    .then(() => {
                      toast.success(`Role ${role.name} deleted.`);
                      router.push("/admin-management?view=roles");
                    })
                    .catch((err) => {
                      toast.error(roleErrorMessage(err));
                      setConfirmDelete(false);
                    })
                }
              >
                {isDeleting ? <Spinner size="sm" color="current" /> : null}
                Delete
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
