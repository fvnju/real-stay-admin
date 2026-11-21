"use client";

import { Button, FieldError, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { formatDateTime } from "@/components/admin";
import { accessRequestsApi } from "@/app/endpoints/access-requests/access-requests-api-slice";
import type { AccessRequest } from "@/app/endpoints/access-requests/access-requests-types";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { MAX_REASON_LENGTH, missingFromRole, permissionsForApproval } from "@/lib/access-requests";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleSelect } from "./role-select";

const nameOf = (r: AccessRequest) =>
  [r.requester?.firstName, r.requester?.lastName].filter(Boolean).join(" ") || "Unknown admin";

/**
 * Approve (give the requester a role that has the asked permissions) or
 * decline (with a note). "Make a role" opens the role form with the asked
 * permissions, and comes back here with the new role.
 */
export function DecideRequestDialog({
  request,
  initialRoleId,
  isOwn = false,
  onClose,
}: {
  request: AccessRequest | null;
  initialRoleId?: string;
  /** The signed-in admin sent it: another admin decides it. */
  isOwn?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: me } = useMyPermissions();
  const roles = rbacApi.useGetRolesQuery(ALL_ROLES_ARGS, { skip: !request });
  const [roleId, setRoleId] = useState(initialRoleId ?? request?.role?.id ?? "");
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [approve, { isLoading: isApproving }] = accessRequestsApi.useApproveRequestMutation();
  const [decline, { isLoading: isDeclining }] = accessRequestsApi.useDeclineRequestMutation();

  if (!request) return null;
  const roleList = roles.data?.data?.roles ?? [];
  const chosen = roleList.find((r) => r._id === roleId);
  const missing = chosen ? missingFromRole(request.permissions, chosen) : [];
  // An approval replaces the role: these are the permissions that the admin loses.
  const current = request.requester?.permissions ?? [];
  const lost = chosen ? missingFromRole(current, chosen) : [];
  const noteError = !note.trim()
    ? "Write a note for the admin."
    : note.trim().length > MAX_REASON_LENGTH
      ? `Write ${MAX_REASON_LENGTH} characters or less.`
      : null;
  const decided = request.status !== "open";
  const canDecide = !decided && !isOwn;

  const done = (text: string) => {
    toast.success(text);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Request of {nameOf(request)}</Modal.Heading>
            <p className="text-sm text-muted">
              {request.requester?.email} · now {request.requester?.roleName ?? "no role"} ·{" "}
              {formatDateTime(request.createdAt)}
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1 rounded-2xl bg-default p-3">
              {request.role ? <p>Asks for the role: {request.role.name}</p> : null}
              {request.permissions.length ? (
                <p className="break-words">Asks for: {request.permissions.join(", ")}</p>
              ) : null}
              <p className="text-muted">“{request.reason}”</p>
            </div>

            {isOwn && !decided ? (
              <p className="text-muted">This is your request. Another admin decides it.</p>
            ) : decided ? (
              <p>
                {request.status === "approved"
                  ? `Approved: ${request.decision?.role?.name ?? ""}`
                  : request.status === "declined"
                    ? `Declined: ${request.decision?.note ?? ""}`
                    : "Cancelled by the admin."}
              </p>
            ) : declining ? (
              <TextField value={note} onChange={setNote} isInvalid={!!note && !!noteError} fullWidth>
                <Label>Note for the admin</Label>
                <TextArea rows={3} placeholder="Why not, or what to ask for instead." />
                <FieldError>{noteError}</FieldError>
              </TextField>
            ) : (
              <div className="flex flex-col gap-2">
                <RoleSelect
                  label="Give the role"
                  roles={roleList}
                  me={me}
                  value={roleId}
                  onChange={setRoleId}
                  isLoading={roles.isLoading}
                />
                {missing.length ? (
                  <p className="text-danger">This role does not have: {missing.join(", ")}</p>
                ) : null}
                {lost.length ? (
                  <p className="text-warning">The admin loses: {lost.join(", ")}</p>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onPress={() => {
                    const q = new URLSearchParams({
                      permissions: permissionsForApproval(current, request.permissions).join(","),
                      request: request.id,
                    });
                    router.push(`/admin-management/roles/new?${q}`);
                  }}
                >
                  Make a role with the current and the asked permissions
                </Button>
              </div>
            )}
          </Modal.Body>
          {!canDecide ? null : (
            <Modal.Footer>
              {declining ? (
                <>
                  <Button variant="secondary" onPress={() => setDeclining(false)}>
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    isDisabled={isDeclining || !!noteError}
                    onPress={() =>
                      decline({ id: request.id, note: note.trim() })
                        .unwrap()
                        .then(() => done("Request declined."))
                        .catch((err) => toast.error(roleErrorMessage(err)))
                    }
                  >
                    {isDeclining ? <Spinner size="sm" color="current" /> : null}
                    Decline
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onPress={() => setDeclining(true)}>
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    isDisabled={isApproving || !roleId || missing.length > 0}
                    onPress={() =>
                      approve({ id: request.id, roleId })
                        .unwrap()
                        .then(() => done(`${nameOf(request)} now has the role ${chosen?.name ?? ""}.`))
                        .catch((err) => toast.error(roleErrorMessage(err)))
                    }
                  >
                    {isApproving ? <Spinner size="sm" color="current" /> : null}
                    Approve
                  </Button>
                </>
              )}
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
