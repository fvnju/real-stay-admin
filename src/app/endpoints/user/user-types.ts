export interface User {
  id: string;
  _id?: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url?: string;
  gender?: string;
  user_type?: string;
  phone_number?: string;
  status?: string;
  is_password_set?: boolean;
  has_completed_kyc?: boolean;
  createdAt?: string; // ISO date
  /** An admin: the id and the name of the role. */
  role_id?: string | null;
  role_name?: string;
  /** A removed admin (see `src/lib/admin-removal.ts`); null or missing: not removed. */
  admin_removed_at?: string | null;
  /** Soft-deleted guest/host account. */
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
  /** Fraud/abuse flag on a guest/host account. */
  flagged_at?: string | null;
  flagged_by?: string | null;
  flag_reason?: string | null;
  flag_escalated?: boolean;
}

export type UserNoteKind = "note" | "flag" | "escalate" | "clear_flag";

export interface UserNote {
  id: string;
  user_id: string;
  kind: UserNoteKind;
  body: string;
  createdAt: string;
  author: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface UserNotesResponse {
  notes: UserNote[];
}

export interface CreateHostResponse {
  user: User;
  email_sent: boolean;
}

export interface DeleteUserResponse {
  user: User;
  deactivated_listings: number;
}
export interface UserResponse {
  user: User;
}
export interface UsersResponse {
  users: User[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
  };
}
