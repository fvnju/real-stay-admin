"use client";

import { Button, FieldError, Label, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import type { AdminReport } from "@/app/endpoints/attention/attention-types";
import { reportsApi, type ReportOutcome } from "@/app/endpoints/reports/reports-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { MAX_NOTE_LENGTH } from "@/lib/report-reasons";
import { reportTargetHref } from "./report-text";

const TEXT: Record<ReportOutcome, { title: string; button: string; done: string }> = {
  dismissed: { title: "Dismiss the report", button: "Dismiss", done: "Report dismissed." },
  actioned: { title: "Mark as actioned", button: "Mark as actioned", done: "Report marked as actioned." },
};

/**
 * Closes a report with a staff note. "Mark as actioned" does not do the
 * action itself: staff take it first on the page of the target.
 */
export function ResolveDialog({
  report,
  outcome,
  onClose,
}: {
  report: AdminReport;
  outcome: ReportOutcome | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [resolve, { isLoading }] = reportsApi.useResolveReportMutation();
  const text = outcome ? TEXT[outcome] : null;
  const trimmed = note.trim();
  const error = !trimmed
    ? "Write a note for the team."
    : trimmed.length > MAX_NOTE_LENGTH
      ? `Write ${MAX_NOTE_LENGTH} characters or less.`
      : null;
  const href = reportTargetHref(report);

  const close = () => {
    setNote("");
    setTouched(false);
    onClose();
  };

  const submit = async () => {
    setTouched(true);
    if (error || !outcome) return;
    try {
      await resolve({ id: report.id, outcome, note: trimmed }).unwrap();
      toast.success(text!.done);
      close();
    } catch (err) {
      // Another admin closed it first (409): the detail loads again with
      // the tag, and the message says why.
      toast.error(GetErrorMessage(err));
      close();
    }
  };

  return (
    <Modal.Backdrop isOpen={outcome !== null} onOpenChange={(open) => !open && close()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>{text?.title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            {outcome === "actioned" ? (
              <p className="rounded-2xl bg-default px-3 py-2 text-sm">
                Take the action first, for example deactivate the user or hide the listing.{" "}
                {href ? (
                  <Link href={href} className="font-medium text-accent underline-offset-2 hover:underline">
                    Open the {report.targetType === "listing" ? "listing" : "user"}
                  </Link>
                ) : null}
              </p>
            ) : null}
            <TextField
              value={note}
              onChange={setNote}
              onBlur={() => setTouched(true)}
              isInvalid={touched && !!error}
              fullWidth
            >
              <Label>Note for the team</Label>
              <TextArea rows={4} placeholder="What you checked, and why." />
              <p className="text-xs text-muted">
                The reporter does not see this note. {trimmed.length}/{MAX_NOTE_LENGTH}
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
              {text?.button}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
