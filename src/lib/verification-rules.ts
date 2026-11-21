/**
 * The rules of the Verifications pages. The statuses, the paper kinds, the
 * transitions and the text limits are a copy of real-stay-backend
 * `src/features/listing-verification/verification-rules.ts` and
 * `listing-verification.schemas.ts`: change them together.
 */

export const VERIFICATION_STATUSES = [
  "submitted",
  "documents_approved",
  "verified",
  "rejected",
  "cancelled",
  "revoked",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const DOCUMENT_KINDS = [
  "title_document",
  "tenancy_agreement",
  "owner_letter",
  "business_registration",
] as const;

/** An action of staff on a request (`clear_recheck` acts on the listing). */
export type VerificationAction = "approve_documents" | "verify" | "reject" | "revoke" | "clear_recheck";

const ACTIONS: Partial<Record<VerificationStatus, VerificationAction[]>> = {
  submitted: ["approve_documents", "reject"],
  documents_approved: ["verify", "reject"],
  verified: ["revoke"],
};

/** The actions that the backend permits on a request in this status. */
export function actionsOf(status: VerificationStatus, hasRecheck: boolean): VerificationAction[] {
  const actions = [...(ACTIONS[status] ?? [])];
  if (status === "verified" && hasRecheck) actions.push("clear_recheck");
  return actions;
}

export type VerificationQueue = "submitted" | "documents_approved" | "recheck" | "verified" | "rejected" | "all";

/** The tabs of the Verifications page. Each one is a backend filter. */
export const VERIFICATION_QUEUES: { label: string; value: VerificationQueue }[] = [
  { label: "Papers to check", value: "submitted" },
  { label: "Visits to do", value: "documents_approved" },
  { label: "Check again", value: "recheck" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

export type VerificationListArgs = {
  page: number;
  limit: number;
  status?: VerificationStatus;
  recheck?: boolean;
  state?: string;
};

/** The query of `GET /v1/admin/listing-verifications` for a tab. The backend sends the oldest first. */
export function verificationQueueArgs({
  queue,
  page,
  pageSize,
  state = "",
}: {
  queue: VerificationQueue;
  page: number;
  pageSize: number;
  state?: string;
}): VerificationListArgs {
  return {
    page,
    limit: pageSize,
    ...(queue === "recheck" ? { recheck: true } : queue === "all" ? {} : { status: queue }),
    ...(state ? { state } : {}),
  };
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Papers to check",
  documents_approved: "Papers approved",
  verified: "Verified",
  rejected: "Rejected",
  cancelled: "Cancelled by host",
  revoked: "Badge removed",
};

export function verificationStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const KIND_LABELS: Record<string, string> = {
  title_document: "Title document",
  tenancy_agreement: "Tenancy agreement",
  owner_letter: "Letter from the owner",
  business_registration: "Business registration",
};

export function documentKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

const RECHECK_LABELS: Record<string, string> = {
  address: "Address changed",
  photos: "Photos changed",
  room_photos: "Room photos changed",
};

export function recheckReasonLabel(reason: string): string {
  return RECHECK_LABELS[reason] ?? reason;
}

/** The limits of `ReasonBodySchema` (reject and revoke). */
export const MIN_REASON_LENGTH = 3;
export const MAX_REASON_LENGTH = 1000;
/** The limit of `VerifyBodySchema.notes`. */
export const MAX_VISIT_NOTES_LENGTH = 2000;

/** The error of a reject or revoke reason, or null when the backend takes it. */
export function reasonError(reason: string): string | null {
  const text = reason.trim();
  if (!text) return "Write the reason. The host sees it.";
  if (text.length < MIN_REASON_LENGTH) return `Write ${MIN_REASON_LENGTH} characters or more.`;
  if (text.length > MAX_REASON_LENGTH) return `Write ${MAX_REASON_LENGTH} characters or less.`;
  return null;
}

export function visitNotesError(notes: string): string | null {
  return notes.trim().length > MAX_VISIT_NOTES_LENGTH ? `Write ${MAX_VISIT_NOTES_LENGTH} characters or less.` : null;
}

/** True when a signed link of a paper is a PDF (from the `format` query value or the path). */
export function isPdfUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const format = u.searchParams.get("format");
    if (format) return format.toLowerCase() === "pdf";
    return u.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}
