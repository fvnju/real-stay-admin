/**
 * The reasons of a report. A copy of real-stay-backend
 * `src/features/reports/report-rules.ts` (and the app): change them together.
 */
export const LISTING_REPORT_REASONS = [
  "fake_listing",
  "wrong_information",
  "scam",
  "unsafe",
  "offensive",
  "other",
] as const;

export const USER_REPORT_REASONS = [
  "scam",
  "harassment",
  "unsafe",
  "fake_profile",
  "offensive",
  "other",
] as const;

const LABELS: Record<string, string> = {
  fake_listing: "Fake listing",
  wrong_information: "Wrong information",
  scam: "Scam",
  unsafe: "Unsafe",
  offensive: "Offensive",
  harassment: "Harassment",
  fake_profile: "Fake profile",
  other: "Other",
};

/** The label of a reason. An unknown reason shows as the raw text. */
export function reasonLabel(reason: string): string {
  return LABELS[reason] ?? reason;
}

/** The longest staff note that the backend takes. */
export const MAX_NOTE_LENGTH = 1000;
