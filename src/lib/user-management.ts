import type { User, UserNoteKind } from "@/app/endpoints/user/user-types";

export const MAX_REASON_LENGTH = 500;
export const MAX_NOTE_LENGTH = 1000;

/** True when an admin soft-deleted this guest/host account. */
export function isDeletedUser(user?: Pick<User, "deleted_at"> | null): boolean {
  return Boolean(user?.deleted_at);
}

/** True when an account currently has an active fraud/abuse flag. */
export function isFlaggedUser(user?: Pick<User, "flagged_at"> | null): boolean {
  return Boolean(user?.flagged_at);
}

/** The status label shown in tables and headers (Deleted overrides inactive). */
export function effectiveUserStatus(user?: Pick<User, "status" | "deleted_at"> | null): string | undefined {
  if (!user) return undefined;
  if (isDeletedUser(user)) return "deleted";
  return user.status;
}

/**
 * Turns a stored KYC photo (data URL, https URL, or raw base64 from Dojah)
 * into a browser-safe `img src`, or `null` when empty.
 */
export function kycImageSrc(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^(https?:\/\/|data:image\/)/i.test(value)) return value;
  // Raw base64 payload from Dojah (often JPEG or PNG).
  const clean = value.replace(/\s+/g, "");
  if (/^[A-Za-z0-9+/=]+$/.test(clean) && clean.length >= 32) {
    return `data:image/jpeg;base64,${clean}`;
  }
  return null;
}

export function noteKindLabel(kind: UserNoteKind): string {
  switch (kind) {
    case "flag":
      return "Flagged";
    case "escalate":
      return "Escalated";
    case "clear_flag":
      return "Flag cleared";
    default:
      return "Note";
  }
}

export function requiredTextError(value: string, label: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `Enter ${label}.`;
  if (trimmed.length > max) return `Use ${max} characters or less.`;
  return null;
}

export function optionalTextError(value: string, max: number): string | null {
  if (value.trim().length > max) return `Use ${max} characters or less.`;
  return null;
}
