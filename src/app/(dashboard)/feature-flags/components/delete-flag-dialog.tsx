"use client";

import { Button, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import { useEffect, useState } from "react";
import { isAppFlag } from "@/lib/feature-flag-rules";

/** Confirms a delete. For a flag of the app, the admin types the key. */
export function DeleteFlagDialog({
  flagKey,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: {
  flagKey: string;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const appFlag = isAppFlag(flagKey);
  const canDelete = !appFlag || typed.trim() === flagKey;
  // Each time the dialog closes (Cancel, the close button, or an error of
  // the delete), it forgets the typed key.
  useEffect(() => {
    if (!isOpen) setTyped("");
  }, [isOpen]);
  const close = onClose;

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Modal.Container size="sm">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Delete the flag {flagKey}?</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              {appFlag
                ? "The app reads this flag. After the delete, the app uses its default value for all users."
                : "Code that reads this flag stops getting it."}{" "}
              The owner can restore it in PostHog.
            </p>
            {appFlag ? (
              <TextField value={typed} onChange={setTyped} fullWidth>
                <Label>Type {flagKey} to confirm</Label>
                <Input className="font-mono" autoComplete="off" />
              </TextField>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button variant="danger" isDisabled={!canDelete || isDeleting} onPress={onConfirm}>
              {isDeleting ? <Spinner size="sm" color="current" /> : null}
              Delete
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
