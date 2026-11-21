"use client";

import { Button, Modal, Spinner } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { DetailSection, formatDate } from "@/components/admin";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import type { User } from "@/app/endpoints/user/user-types";
import { useSessionUser } from "@/app/providers/session-user";
import { isRemovedAdmin, removalRefusalOf, type RemovalRefusal } from "@/lib/admin-removal";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";

/**
 * Panel access of an admin: "Remove admin" or "Restore admin". The button
 * always shows; when the rules refuse, a dialog says why before any request.
 */
export function AdminAccessSection({ admin, adminId }: { admin: User; adminId: string }) {
  const session = useSessionUser();
  const { data: me } = useMyPermissions();
  const roles = rbacApi.useGetRolesQuery(ALL_ROLES_ARGS);
  const [removeAdmin, removing] = userApi.useRemoveAdminMutation();
  const [restoreAdmin, restoring] = userApi.useRestoreAdminMutation();
  const [dialog, setDialog] = useState<"confirm" | RemovalRefusal | null>(null);

  const removed = isRemovedAdmin(admin);
  const targetRole = roles.data?.data?.roles?.find((r) => r._id === admin.role_id);
  const targetIsSuper = admin.role_id ? (targetRole ? targetRole.slug === "superadmin" : null) : false;
  const refusal = removalRefusalOf(
    session && me ? { id: session.id, email: session.email, isSuperAdmin: me.isSuperAdmin } : null,
    { id: adminId, isSuperAdmin: targetIsSuper },
  );
  const name = `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() || admin.email;
  const busy = removing.isLoading || restoring.isLoading;

  const act = () => {
    const call = removed ? restoreAdmin(adminId) : removeAdmin(adminId);
    call
      .unwrap()
      .then(() => {
        toast.success(removed ? `${name} can use the panel again.` : `${name} can no longer use the panel.`);
        setDialog(null);
      })
      .catch((err) => {
        toast.error(roleErrorMessage(err));
        setDialog(null);
      });
  };

  return (
    <>
      <DetailSection
        title="Panel access"
        actions={
          <Button
            size="sm"
            variant={removed ? "secondary" : "danger-soft"}
            onPress={() => setDialog(refusal ?? "confirm")}
          >
            {removed ? "Restore admin" : "Remove admin"}
          </Button>
        }
        fields={[
          {
            label: "Access",
            value: removed ? `Removed on ${formatDate(admin.admin_removed_at)}` : "Can use the panel",
          },
        ]}
      />

      <Modal.Backdrop isOpen={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            {dialog === "confirm" ? (
              <>
                <Modal.Header>
                  <Modal.Heading>{removed ? `Restore ${name}?` : `Remove ${name}?`}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-muted">
                    {removed
                      ? admin.status === "pending" || !admin.status
                        ? "They get their access back. If they never accepted the invite, send a new invite."
                        : "They get their access back and sign in with their old password."
                      : "They can no longer sign in, and their open session stops now. The account stays, and you can restore it."}
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onPress={() => setDialog(null)}>
                    Cancel
                  </Button>
                  <Button variant={removed ? "primary" : "danger"} isDisabled={busy} onPress={act}>
                    {busy ? <Spinner size="sm" color="current" /> : null}
                    {removed ? "Restore admin" : "Remove admin"}
                  </Button>
                </Modal.Footer>
              </>
            ) : dialog ? (
              <>
                <Modal.Header>
                  <Modal.Heading>{removed ? "You cannot restore this admin" : "You cannot remove this admin"}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-muted">{dialog.message}.</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onPress={() => setDialog(null)}>
                    Close
                  </Button>
                </Modal.Footer>
              </>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
