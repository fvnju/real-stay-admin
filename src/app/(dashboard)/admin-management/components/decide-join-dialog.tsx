"use client";

import { Button, FieldError, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { CopyButton, formatDateTime } from "@/components/admin";
import { joinRequestsApi } from "@/app/endpoints/join-requests/join-requests-api-slice";
import type { JoinRequest } from "@/app/endpoints/join-requests/join-requests-types";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { MAX_JOIN_REASON } from "@/lib/join-requests";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleSelect } from "./role-select";

export const joinNameOf = (r: JoinRequest) => [r.firstName, r.lastName].filter(Boolean).join(" ") || r.email;

/**
 * Approve a join request (send the admin invite with a role) or decline it
 * with a note. The person gets no email for a decline.
 */
export function DecideJoinDialog({ request, onClose }: { request: JoinRequest; onClose: () => void }) {
  const { data: me } = useMyPermissions();
  const roles = rbacApi.useGetRolesQuery(ALL_ROLES_ARGS);
  const [roleId, setRoleId] = useState("");
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [approve, { isLoading: isApproving }] = joinRequestsApi.useApproveJoinRequestMutation();
  const [decline, { isLoading: isDeclining }] = joinRequestsApi.useDeclineJoinRequestMutation();

  const roleList = roles.data?.data?.roles ?? [];
  const chosen = roleList.find((r) => r._id === roleId);
  const noteError = !note.trim()
    ? "Write a note for the team."
    : note.trim().length > MAX_JOIN_REASON
      ? `Write ${MAX_JOIN_REASON} characters or less.`
      : null;
  const isOpen = request.status === "open";

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
            <Modal.Heading>{joinNameOf(request)} asks to join</Modal.Heading>
            <p className="text-sm text-muted">Sent {formatDateTime(request.createdAt)}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-1 rounded-2xl bg-default p-3">
              <p className="flex items-center gap-1 break-all">
                {request.email} <CopyButton text={request.email} label="Copy email" />
              </p>
              <p className="flex items-center gap-1">
                {request.phone} <CopyButton text={request.phone} label="Copy phone" />
              </p>
              <p className="whitespace-pre-wrap break-words text-muted">“{request.reason}”</p>
            </div>
            <p className="text-muted">
              Anybody can send this form. Check that the person works for RealStay before you approve.
            </p>

            {!isOpen ? (
              <p>
                {request.status === "approved"
                  ? `Approved: invited as ${request.decision?.role?.name ?? "an admin"}.`
                  : `Declined: ${request.decision?.note ?? ""}`}
              </p>
            ) : declining ? (
              <TextField value={note} onChange={setNote} isInvalid={!!note && !!noteError} fullWidth>
                <Label>Note for the team</Label>
                <TextArea rows={3} placeholder="Why not. The person does not see this note." />
                <FieldError>{noteError}</FieldError>
              </TextField>
            ) : (
              <div className="flex flex-col gap-2">
                <RoleSelect
                  label="Invite with the role"
                  roles={roleList}
                  me={me}
                  value={roleId}
                  onChange={setRoleId}
                  isLoading={roles.isLoading}
                />
                <p className="text-xs text-muted">
                  The person gets the admin invite by email. The link is valid for 30 minutes; you can send it
                  again from the admin page.
                </p>
              </div>
            )}
          </Modal.Body>
          {!isOpen ? null : (
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
                    isDisabled={isApproving || !roleId}
                    onPress={() =>
                      approve({ id: request.id, roleId })
                        .unwrap()
                        .then(() => done(`Invite sent to ${request.email} with the role ${chosen?.name ?? ""}.`))
                        .catch((err) => toast.error(roleErrorMessage(err)))
                    }
                  >
                    {isApproving ? <Spinner size="sm" color="current" /> : null}
                    Approve and invite
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
