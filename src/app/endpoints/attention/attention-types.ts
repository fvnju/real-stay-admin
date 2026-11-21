/** The backend v1 admin lists answer `{ data: { data, total, page, limit } }`. */
export type AdminQueue<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  status: string;
};

/** `GET /v1/admin/reports` (backend `src/features/reports`). */
export type AdminReport = {
  id: string;
  targetType: "listing" | "user";
  targetId: string;
  reason: string;
  status: "open" | "dismissed" | "actioned";
  createdAt: string;
  details: string | null;
  reporter: PersonSummary | null;
  /** The reported user, or the owner of the reported listing. */
  targetUser: PersonSummary | null;
  listing: { id: string; title: string; status: string; deleted: boolean } | null;
  openReportsOfTarget: number;
  /** A closed report: the staff note, when, and the id of the admin. */
  resolution?: { note: string | null; at: string; by: string } | null;
};

/** `GET /v1/admin/listing-verifications` (backend `src/features/listing-verification`). */
export type AdminVerification = {
  id: string;
  listingId: string;
  attempt: number;
  status: "submitted" | "documents_approved" | "verified" | "rejected" | "cancelled" | "revoked";
  createdAt: string | null;
  updatedAt: string | null;
  listing: {
    id: string;
    title: string;
    state?: string;
    isVerified: boolean;
    deleted: boolean;
    recheck: { reasons: string[]; at: string } | null;
  } | null;
  host: { id: string; firstName: string; lastName: string; email: string } | null;
};
