export type JoinRequestStatus = "open" | "approved" | "declined";
type RoleRef = { id: string; name: string } | null;

/** A request of a person without an admin account (backend `src/features/join-requests`). */
export type JoinRequest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reason: string;
  status: JoinRequestStatus;
  decision: { note: string | null; at: string; by: string; role: RoleRef } | null;
  createdAt: string;
};
