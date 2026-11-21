import type { PersonSummary } from "../attention/attention-types";

export type AccessRequestStatus = "open" | "approved" | "declined" | "cancelled";
type RoleRef = { id: string; name: string } | null;

/** An access request (backend `src/features/access-requests`). */
export type AccessRequest = {
  id: string;
  /** `permissions`: the permissions of the current role of the requester. */
  requester: (PersonSummary & { roleName: string | null; permissions?: string[] }) | null;
  permissions: string[];
  role: RoleRef;
  reason: string;
  status: AccessRequestStatus;
  decision: { note: string | null; at: string; by: string; role: RoleRef } | null;
  createdAt: string;
};
