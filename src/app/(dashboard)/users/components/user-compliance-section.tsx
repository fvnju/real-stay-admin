"use client";

import { Button, Card, Chip, FieldError, Label, Skeleton, Spinner, TextArea, TextField } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { formatDateTime, StatusChip, useGuardedAction } from "@/components/admin";
import { Icon } from "@/components/icon";
import { reportsApi } from "@/app/endpoints/reports/reports-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import type { User, UserNoteKind } from "@/app/endpoints/user/user-types";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { reasonLabel } from "@/lib/report-reasons";
import { usePermission } from "@/lib/use-permission";
import {
  isFlaggedUser,
  MAX_NOTE_LENGTH,
  noteKindLabel,
  requiredTextError,
} from "@/lib/user-management";
import { FlagUserDialog, UnflagUserDialog } from "./user-action-dialogs";

const NOTE_CHIP_COLOR: Record<UserNoteKind, "default" | "warning" | "danger" | "success"> = {
  note: "default",
  flag: "warning",
  escalate: "danger",
  clear_flag: "success",
};

/** Fraud/abuse flag actions and internal compliance notes timeline for a user. */
export function UserComplianceSection({
  user,
  userName,
}: {
  user: User;
  userName: string;
}) {
  const userId = user._id || user.id;
  const guard = useGuardedAction();
  const [flagOpen, setFlagOpen] = useState(false);
  const [unflagOpen, setUnflagOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);

  const { data: notesRes, isFetching: isFetchingNotes } = userApi.useGetUserNotesQuery(userId);
  const notes = notesRes?.data?.notes ?? [];

  const [flagMutation, { isLoading: isFlagging }] = userApi.useFlagUserMutation();
  const [unflagMutation, { isLoading: isUnflagging }] = userApi.useUnflagUserMutation();
  const [addNoteMutation, { isLoading: isAddingNote }] = userApi.useAddUserNoteMutation();

  const flagged = isFlaggedUser(user);
  const noteError = requiredTextError(noteBody, "a note", MAX_NOTE_LENGTH);

  const submitNote = async () => {
    setNoteTouched(true);
    if (noteError) return;
    await addNoteMutation({ id: userId, body: noteBody.trim() })
      .unwrap()
      .then(() => {
        setNoteBody("");
        setNoteTouched(false);
        toast.success("Note added.");
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Compliance &amp; flags</h2>
          <p className="text-xs text-muted">
            Internal staff notes, fraud flags, and case escalations. Never shown to the user.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {flagged ? (
            <Button
              size="sm"
              variant="secondary"
              onPress={guard("users:actions", () => setUnflagOpen(true))}
            >
              <Icon name="checkmark-circle-outline" size={16} />
              Clear flag
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={flagged ? "danger-soft" : "secondary"}
            onPress={guard("users:actions", () => setFlagOpen(true))}
          >
            <Icon name="flag-outline" size={16} />
            {flagged ? "Escalate / update flag" : "Flag account"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <TextField
          value={noteBody}
          onChange={setNoteBody}
          isInvalid={noteTouched && !!noteError}
          fullWidth
        >
          <Label className="sr-only">Add internal note</Label>
          <TextArea
            rows={2}
            placeholder="Add an internal compliance or support note..."
          />
          <FieldError>{noteTouched ? noteError : undefined}</FieldError>
        </TextField>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">
            {noteBody.trim().length}/{MAX_NOTE_LENGTH}
          </span>
          <Button
            size="sm"
            variant="primary"
            isDisabled={isAddingNote}
            onPress={guard("users:actions", () => void submitNote())}
          >
            {isAddingNote ? <Spinner size="sm" color="current" /> : null}
            Add note
          </Button>
        </div>
      </div>

      {isFetchingNotes && notes.length === 0 ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted">No flags or compliance notes yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator rounded-2xl bg-default px-4">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-1.5 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="soft" color={NOTE_CHIP_COLOR[n.kind]}>
                    {noteKindLabel(n.kind)}
                  </Chip>
                  <span className="text-xs font-medium">
                    {n.author
                      ? `${n.author.first_name} ${n.author.last_name}`.trim() || n.author.email
                      : "Staff"}
                  </span>
                </div>
                <span className="text-xs text-muted">{formatDateTime(n.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
            </li>
          ))}
        </ul>
      )}

      <FlagUserDialog
        open={flagOpen}
        userName={userName}
        alreadyFlagged={flagged}
        isLoading={isFlagging}
        onClose={() => setFlagOpen(false)}
        onConfirm={async (reason, escalate) => {
          await flagMutation({ id: userId, reason, escalate })
            .unwrap()
            .then(() => toast.success(escalate ? "Account escalated." : "Account flagged."))
            .catch((err) => toast.error(GetErrorMessage(err)));
        }}
      />

      <UnflagUserDialog
        open={unflagOpen}
        userName={userName}
        isLoading={isUnflagging}
        onClose={() => setUnflagOpen(false)}
        onConfirm={async (note) => {
          await unflagMutation({ id: userId, note })
            .unwrap()
            .then(() => toast.success("Account flag cleared."))
            .catch((err) => toast.error(GetErrorMessage(err)));
        }}
      />
    </Card>
  );
}

/** Shows reports filed against this user or any of their listings. */
export function UserReportsSection({ userId }: { userId: string }) {
  const canViewReports = usePermission("reports:view") === "allowed";
  const { data, isFetching } = reportsApi.useGetReportsQuery(
    { page: 1, limit: 20, userId },
    { skip: !canViewReports },
  );

  if (!canViewReports) return null;

  const items = data?.data?.data ?? [];
  const total = data?.data?.total ?? items.length;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Reports ({total})</h2>
          <p className="text-xs text-muted">
            Abuse or fraud reports against this user or their listings.
          </p>
        </div>
      </div>
      {isFetching && items.length === 0 ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No reports filed against this user.</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl bg-default">
          {items.map((r) => (
            <li key={r.id} className="border-b border-separator last:border-b-0">
              <Link
                href={`/reports/${r.id}`}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm outline-none hover:bg-default-hover focus-visible:bg-default-hover"
              >
                <StatusChip status={r.status} />
                <span className="min-w-0 flex-1 truncate">
                  {reasonLabel(r.reason)}
                  {r.targetType === "listing" && r.listing?.title
                    ? ` · ${r.listing.title}`
                    : " · User account"}
                </span>
                <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span>
                <Icon name="chevron-forward" size={14} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
