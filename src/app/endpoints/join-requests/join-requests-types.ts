export type JoinRequestStatus = "open" | "approved" | "declined";
type RoleRef = { id: string; name: string } | null;

/** Existing RealStay account matched by email on an open join request. */
export type JoinRequestExistingAccount = {
  id: string;
  userType: "guest" | "host" | "admin";
  status: "active" | "inactive" | "pending";
  isRemovedAdmin: boolean;
  isDeactivated: boolean;
};

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
  existingAccount?: JoinRequestExistingAccount | null;
  promoted?: boolean;
  createdAt: string;
};
