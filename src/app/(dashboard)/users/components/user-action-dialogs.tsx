"use client";

import {
  Button,
  Checkbox,
  FieldError,
  Label,
  Modal,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { useState } from "react";
import {
  MAX_NOTE_LENGTH,
  MAX_REASON_LENGTH,
  optionalTextError,
  requiredTextError,
} from "@/lib/user-management";

export function DeleteUserDialog({
  open,
  userName,
  isHost,
  isLoading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  userName: string;
  isHost: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const error = optionalTextError(reason, MAX_REASON_LENGTH);

  const close = () => {
    setReason("");
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(o) => !o && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Delete user account</Modal.Heading>
            <p className="text-sm text-muted">{userName}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <p className="text-sm">
              This soft-deletes the account, signs them out immediately, and hides them from active users.
              {isHost ? " Any active listings they own will also be deactivated." : ""}{" "}
              Booking and payment records stay intact, and an admin can restore the account later.
            </p>
            <TextField value={reason} onChange={setReason} isInvalid={!!error} fullWidth>
              <Label>Reason (optional)</Label>
              <TextArea rows={3} placeholder="Why is this account being deleted?" />
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
            <Button
              variant="danger"
              isDisabled={isLoading || !!error}
              onPress={async () => {
                await onConfirm(reason.trim());
                close();
              }}
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              Delete user
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function RevokeKycDialog({
  open,
  userName,
  isLoading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  userName: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const error = requiredTextError(reason, "a reason", MAX_REASON_LENGTH);

  const close = () => {
    setReason("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(o) => !o && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Revoke KYC verification</Modal.Heading>
            <p className="text-sm text-muted">{userName}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <p className="text-sm">
              This removes the Dojah verification record and marks the user as unverified so they must complete identity verification again.
            </p>
            <TextField
              value={reason}
              onChange={setReason}
              onBlur={() => setTouched(true)}
              isInvalid={touched && !!error}
              fullWidth
            >
              <Label>Reason</Label>
              <TextArea rows={3} placeholder="For example: selfie does not match the NIN photo." />
              <p className="text-xs text-muted">
                {reason.trim().length}/{MAX_REASON_LENGTH}
              </p>
              <FieldError>{touched ? error : undefined}</FieldError>
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isDisabled={isLoading}
              onPress={async () => {
                setTouched(true);
                if (error) return;
                await onConfirm(reason.trim());
                close();
              }}
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              Revoke KYC
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function FlagUserDialog({
  open,
  userName,
  alreadyFlagged,
  isLoading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  userName: string;
  alreadyFlagged: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string, escalate: boolean) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [escalate, setEscalate] = useState(alreadyFlagged);
  const [touched, setTouched] = useState(false);
  const error = requiredTextError(reason, "a reason", MAX_NOTE_LENGTH);

  const close = () => {
    setReason("");
    setEscalate(alreadyFlagged);
    setTouched(false);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(o) => !o && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>{alreadyFlagged ? "Update / escalate flag" : "Flag account"}</Modal.Heading>
            <p className="text-sm text-muted">{userName}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <TextField
              value={reason}
              onChange={setReason}
              onBlur={() => setTouched(true)}
              isInvalid={touched && !!error}
              fullWidth
            >
              <Label>Reason</Label>
              <TextArea
                rows={4}
                placeholder="Describe the suspected fraud, abuse, or compliance issue."
              />
              <p className="text-xs text-muted">
                Internal only. {reason.trim().length}/{MAX_NOTE_LENGTH}
              </p>
              <FieldError>{touched ? error : undefined}</FieldError>
            </TextField>

            <Checkbox isSelected={escalate} onChange={setEscalate}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label>Escalate case for compliance review</Label>
              </Checkbox.Content>
            </Checkbox>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant={escalate ? "danger" : "primary"}
              isDisabled={isLoading}
              onPress={async () => {
                setTouched(true);
                if (error) return;
                await onConfirm(reason.trim(), escalate);
                close();
              }}
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              {escalate ? "Escalate account" : "Flag account"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function UnflagUserDialog({
  open,
  userName,
  isLoading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  userName: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const error = requiredTextError(note, "a closing note", MAX_NOTE_LENGTH);

  const close = () => {
    setNote("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(o) => !o && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Clear account flag</Modal.Heading>
            <p className="text-sm text-muted">{userName}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <TextField
              value={note}
              onChange={setNote}
              onBlur={() => setTouched(true)}
              isInvalid={touched && !!error}
              fullWidth
            >
              <Label>Resolution note</Label>
              <TextArea rows={3} placeholder="Explain why the flag is being cleared." />
              <p className="text-xs text-muted">
                Recorded in the compliance timeline. {note.trim().length}/{MAX_NOTE_LENGTH}
              </p>
              <FieldError>{touched ? error : undefined}</FieldError>
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={isLoading}
              onPress={async () => {
                setTouched(true);
                if (error) return;
                await onConfirm(note.trim());
                close();
              }}
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              Clear flag
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
