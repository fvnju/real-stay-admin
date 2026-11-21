"use client";

import { Button, FieldError, Input, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import type { AdminVerification } from "@/app/endpoints/attention/attention-types";
import { verificationsApi } from "@/app/endpoints/verifications/verifications-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import {
  MAX_REASON_LENGTH,
  MAX_VISIT_NOTES_LENGTH,
  reasonError,
  visitNotesError,
  type VerificationAction,
} from "@/lib/verification-rules";

type Text = { title: string; intro: string; button: string; done: string; danger?: boolean };

const TEXT: Record<VerificationAction, Text> = {
  approve_documents: {
    title: "Approve the papers",
    intro: "The papers show that the host can let this place. The host gets a push: RealStay will plan a visit.",
    button: "Approve papers",
    done: "Papers approved. Plan the visit.",
  },
  verify: {
    title: "Verify the listing",
    intro: "The visit was good. The listing gets the Verified badge, and the host gets a push.",
    button: "Verify listing",
    done: "Listing verified.",
  },
  reject: {
    title: "Reject the request",
    intro: "The host sees the reason and can ask again.",
    button: "Reject",
    done: "Request rejected.",
    danger: true,
  },
  revoke: {
    title: "Remove the Verified badge",
    intro: "The listing loses the badge at once. The host sees the reason and can ask again.",
    button: "Remove badge",
    done: "Badge removed.",
    danger: true,
  },
  clear_recheck: {
    title: "Clear the recheck flag",
    intro: "You looked at the change, and the listing can keep the badge.",
    button: "Clear flag",
    done: "Recheck flag cleared.",
  },
};

/** Today in Lagos, "YYYY-MM-DD". */
const lagosToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

/** One action of staff on a verification request. */
export function VerificationActionDialog({
  verification,
  action,
  onClose,
}: {
  verification: AdminVerification;
  action: VerificationAction | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [visitDate, setVisitDate] = useState(lagosToday);
  const [touched, setTouched] = useState(false);

  const [approve, approveState] = verificationsApi.useApproveDocumentsMutation();
  const [verify, verifyState] = verificationsApi.useVerifyListingMutation();
  const [reject, rejectState] = verificationsApi.useRejectVerificationMutation();
  const [revoke, revokeState] = verificationsApi.useRevokeBadgeMutation();
  const [clear, clearState] = verificationsApi.useClearRecheckMutation();
  const isLoading = [approveState, verifyState, rejectState, revokeState, clearState].some((s) => s.isLoading);

  const text = action ? TEXT[action] : null;
  const needsReason = action === "reject" || action === "revoke";
  const error = needsReason
    ? reasonError(reason)
    : action === "verify"
      ? visitNotesError(notes) ?? (visitDate ? null : "Pick the day of the visit.")
      : null;

  const close = () => {
    setReason("");
    setNotes("");
    setVisitDate(lagosToday());
    setTouched(false);
    onClose();
  };

  const run = () => {
    const { id, listingId } = verification;
    switch (action) {
      case "approve_documents":
        return approve(id).unwrap();
      case "verify":
        // Noon in Lagos, so the day is the same in each time zone.
        return verify({
          id,
          visitedAt: `${visitDate}T12:00:00+01:00`,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }).unwrap();
      case "reject":
        return reject({ id, reason: reason.trim() }).unwrap();
      case "revoke":
        return revoke({ listingId, reason: reason.trim() }).unwrap();
      case "clear_recheck":
        return clear(listingId).unwrap();
      default:
        return Promise.resolve();
    }
  };

  const submit = async () => {
    setTouched(true);
    if (error || !action) return;
    try {
      await run();
      toast.success(text!.done);
      close();
    } catch (err) {
      // Another admin acted first (409 INVALID_STATE): the tag loads the
      // request again, and the message says why.
      toast.error(GetErrorMessage(err));
      close();
    }
  };

  return (
    <Modal.Backdrop isOpen={action !== null} onOpenChange={(open) => !open && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>{text?.title}</Modal.Heading>
            <p className="text-sm text-muted">{verification.listing?.title || "A listing"}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <p className="text-sm">{text?.intro}</p>

            {needsReason ? (
              <TextField
                value={reason}
                onChange={setReason}
                onBlur={() => setTouched(true)}
                isInvalid={touched && !!error}
                fullWidth
              >
                <Label>Reason for the host</Label>
                <TextArea
                  rows={4}
                  placeholder={
                    action === "reject"
                      ? "For example: the name on the title document is not the name of the host."
                      : "For example: the address changed, and the new place was not visited."
                  }
                />
                <p className="text-xs text-muted">
                  The host sees this text. {reason.trim().length}/{MAX_REASON_LENGTH}
                </p>
                <FieldError>{error}</FieldError>
              </TextField>
            ) : null}

            {action === "verify" ? (
              <>
                <TextField type="date" value={visitDate} onChange={setVisitDate} fullWidth>
                  <Label>Day of the visit</Label>
                  <Input max={lagosToday()} />
                </TextField>
                <TextField value={notes} onChange={setNotes} isInvalid={touched && !!error} fullWidth>
                  <Label>Visit notes (optional)</Label>
                  <TextArea rows={3} placeholder="What you saw at the place." />
                  <p className="text-xs text-muted">
                    Only staff see these notes. {notes.trim().length}/{MAX_VISIT_NOTES_LENGTH}
                  </p>
                  <FieldError>{error}</FieldError>
                </TextField>
              </>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant={text?.danger ? "danger" : "primary"}
              isDisabled={isLoading}
              onPress={() => void submit()}
            >
              {isLoading ? <Spinner size="sm" color="current" /> : null}
              {text?.button}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
