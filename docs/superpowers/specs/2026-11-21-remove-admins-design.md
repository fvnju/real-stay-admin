# Remove admins

Date: 2026-11-21. Status: approved by the owner.

## Intent

A Super Admin can remove an admin from the panel. Only `info@edgetechino.com` can remove another Super Admin. A removal can be undone (restore).

## Facts found

- The backend checks the account status nowhere: not at sign-in, refresh, invite acceptance, or in the admin guards. "Deactivate" (`PATCH /users/:id/:action`) blocks nothing, and needs only `users:actions`, so any admin with it can deactivate a Super Admin.
- `JwtStrategy` reads the account from the database on each request; `AdminUserGuard` and `V1AdminGuard` read `req.user` from it.

## Approaches

- **A (picked): a separate mark `admin_removed_at` (+ `admin_removed_by`) on the account.** Sign-in, refresh, invite acceptance and `JwtStrategy` refuse a removed admin. Guests and hosts do not change.
- B: make `inactive` block everywhere. Also signs out deactivated app users; a larger change with app effects. Not now.
- Delete the account: rejected by the owner (audit links break, no undo).

## Rules

- Remove and restore: only a Super Admin (`403 SUPER_ADMIN_ONLY`). A Super Admin target: only `info@edgetechino.com` (`403 OWNER_ONLY`). Not the own account (`403 OWN_ACCOUNT`). The last active Super Admin stays (`409 LAST_SUPER_ADMIN`).
- Remove sets `admin_removed_at`, `admin_removed_by`, `status: inactive`, deletes the refresh token and the invite token in Redis, and writes an audit log `admin.removed`. A removed admin is blocked on the next request.
- Restore clears the mark, sets `status` to `active` (password set) or `pending` (invite not accepted), and writes `admin.restored`. The admin signs in with the old password; a pending admin needs a new invite.
- An invite to a removed email: `409 ADMIN_REMOVED` ("This admin was removed. Restore them on their admin page.").
- `PATCH /users/:id/activate|deactivate` refuses an admin target: `400 USE_ADMIN_REMOVAL`.
- The count of other Super Admins (`changeAdminRole` and removal) leaves out removed admins.
- Routes: `POST /users/:id/remove-admin`, `POST /users/:id/restore-admin` (`admin-management:actions`, plus the rules). `GET /users/admins?removed=true|false`.

## Panel

- Admin page: "Remove admin" (danger, confirm dialog) or "Restore admin". The button always shows; when the rules refuse, a dialog says why before any request (`src/lib/admin-removal.ts`, the same rules).
- Admins list: chip "Removed" for a removed admin; the status filter has "Removed".
- Error texts from the backend codes.

## Deploy

Backend first. No migration: an account without the field is not removed.
