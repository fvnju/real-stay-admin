"use client";

import { Button, FieldError, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { accessRequestsApi } from "@/app/endpoints/access-requests/access-requests-api-slice";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { RoleSelect } from "@/app/(dashboard)/admin-management/components/role-select";
import { PermissionGrid } from "@/app/(dashboard)/admin-management/components/permission-grid";
import { MAX_REASON_LENGTH, accessRequestError } from "@/lib/access-requests";
import { errorCodeOf } from "@/lib/permissions";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";

/**
 * "Ask for access": the admin asks for permissions, a role (a promotion),
 * or both, with a reason. A decider gives a role that has them.
 */
export function AskAccessDialog({
  open,
  onClose,
  initialPermissions = [],
}: {
  open: boolean;
  onClose: () => void;
  initialPermissions?: string[];
}) {
  const { data: me } = useMyPermissions();
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);
  const [roleId, setRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [openRequest, setOpenRequest] = useState(false);
  // The list of roles needs roles:view; without it the admin asks for permissions only.
  const roles = rbacApi.useGetRolesQuery(ALL_ROLES_ARGS, { skip: !open });
  const [send, { isLoading }] = accessRequestsApi.useCreateRequestMutation();
  // Only the permissions that the admin does not have yet.
  const mine = new Set(me?.permissions ?? []);
  const asked = permissions.filter((p) => !mine.has(p));
  const error = accessRequestError({ permissions: asked, roleId, reason });

  const close = () => {
    setTouched(false);
    setOpenRequest(false);
    onClose();
  };

  const submit = async () => {
    setTouched(true);
    if (error) return;
    try {
      await send({
        permissions: asked,
        roleId: roleId || undefined,
        reason: reason.trim(),
      }).unwrap();
      toast.success("Request sent. You see the answer on My profile.");
      setReason("");
      setRoleId("");
      close();
    } catch (err) {
      if (errorCodeOf(err) === "REQUEST_OPEN") setOpenRequest(true);
      else toast.error(roleErrorMessage(err));
    }
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(next) => !next && close()}>
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Ask for access</Modal.Heading>
            <p className="text-sm text-muted">
              Ask for permissions, for a role, or both. An admin who can give them decides.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            {openRequest ? (
              <p className="rounded-2xl bg-default px-3 py-2 text-sm">
                You already have an open request.{" "}
                <Link href="/profile" onClick={close} className="font-medium text-accent hover:underline">
                  Open My profile
                </Link>
              </p>
            ) : null}
            {roles.data ? (
              <RoleSelect
                label="Role (optional)"
                roles={roles.data.data?.roles ?? []}
                value={roleId}
                onChange={setRoleId}
                limit={false}
              />
            ) : null}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Permissions</p>
              <PermissionGrid value={permissions} onChange={setPermissions} />
            </div>
            <TextField value={reason} onChange={setReason} isInvalid={touched && !!error} fullWidth>
              <Label>Why do you need it?</Label>
              <TextArea rows={3} placeholder="I answer the hosts about their payouts." />
              <p className="text-xs text-muted">
                {reason.trim().length}/{MAX_REASON_LENGTH}
              </p>
              <FieldError>{error}</FieldError>
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button variant="primary" isDisabled={isLoading} onPress={() => void submit()}>
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              Send request
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** The "Ask for access" button of the blocked state, with its dialog. */
export function AskAccessButton({ permission }: { permission: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onPress={() => setOpen(true)}>
        Ask for access
      </Button>
      {open ? (
        <AskAccessDialog open={open} onClose={() => setOpen(false)} initialPermissions={withView(permission)} />
      ) : null}
    </>
  );
}

/** A details or actions permission also needs the view permission of its area. */
function withView(permission: string) {
  const [area, level] = permission.split(":");
  return level === "view" ? [permission] : [`${area}:view`, permission];
}
