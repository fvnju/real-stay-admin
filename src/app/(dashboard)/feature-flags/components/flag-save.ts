import { toast } from "react-toastify";
import { errorCodeOf } from "@/lib/permissions";
import { posthogErrorMessage } from "./posthog-error-state";

export const AUDIT_FAILED_TEXT = "The change is saved, but the audit log has no record of it.";

/** The field errors of a 400 INVALID_FLAG answer. */
export function fieldErrorsOf(error: unknown): Record<string, string> | null {
  if (errorCodeOf(error) !== "INVALID_FLAG") return null;
  const fields = (error as { data?: { fields?: unknown } }).data?.fields;
  return fields && typeof fields === "object" ? (fields as Record<string, string>) : {};
}

/** Shows the result of a save: a warning when the audit write failed. */
export function toastSaved(text: string, auditFailed: boolean) {
  if (auditFailed) toast.warning(AUDIT_FAILED_TEXT);
  else toast.success(text);
}

export function toastSaveError(error: unknown) {
  toast.error(posthogErrorMessage(error));
}
