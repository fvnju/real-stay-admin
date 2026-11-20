# Reports page, roles, and permissions

Date: 2026-11-21. Repos: `real-stay-admin` (this panel) and `real-stay-backend`.

## Intent

1. Staff close the reports that users send about listings, hosts, and guests, from a page of the panel. Today the panel shows open reports only in the bell, and staff must call the backend routes by hand.
2. Staff make roles and choose the permissions of each role. A permission must really stop an admin: the backend refuses a route without it, and the panel shows a blocked page. Today each role keeps a list of permissions, but no code reads it, so every admin can do everything.

## Goals

- A Reports page: a list with filters, a detail view, and "Dismiss" / "Take action" with a staff note.
- A Roles page: list, create, edit, and delete roles, with a grid of permissions.
- Change the role of an admin.
- No admin can give a role above their own role (to themselves, to another admin, or in an invite). Only the Super Admin has no limit.
- An admin asks for a promotion or for more permissions, and an admin who can give them decides.
- At the deploy, only `info@edgetechino.com` has the Super Admin role.
- The backend checks a permission on each admin route.
- The panel keeps every menu link. A page that the role cannot use shows a blocked state: a picture and a message "You do not have permission to see this page", with the name of the permission and "Ask an admin with the Super Admin role to change your role." An action that the role cannot do (for example "Dismiss") shows the same message in a small dialog when the admin clicks it.

## Non-goals

- A page for listing verification. The bell stays the entry for it. Its backend routes get the permissions below, so a later page can use them.
- Permissions for each single record (for example "only reports of Lagos").
- Notifications for admins.

## Anti-goals

- Do not hide menu links or pages because of a permission. The owner asked for the blocked state.
- Do not lock out all admins. The Super Admin role (slug `superadmin`) always has every permission, and nobody can edit or delete it.
- Do not trust the panel. A permission that only the panel checks is not a permission.

## Approaches

- **A. The backend checks, and the panel shows the blocked state. Picked.** The only way that makes the permissions real.
- B. Only the panel checks. Cheapest, but any admin can still call every route through the proxy or the browser tools.
- C. The backend checks only the actions, and reads stay open to all admins. A role without `transactions:view` could still read the transactions through the API.

The owner picked A.

## Permissions

Keep the form `<area>:<level>`. Levels: `view` (open the list page), `details` (open a detail page), `actions` (change something). The list stays in two copies: backend `src/constants/rbac.perms.ts` and panel `src/app/configs/rbac.perms.ts`. Change both together.

Add these areas: `reports`, `verifications`, `roles`. Keep the old areas. `notifications:*` and `profile:*` stay in the list but no route checks them: every admin can open "My profile" and the Notifications page (my call; a blocked own profile has no use).

Map of the backend routes (my call; the builder can correct a route that this map misses):

| Route | Permission |
| --- | --- |
| `GET /analytics`, `/analytics/bookings`, `/analytics/listing-analytics/*` | `dashboard:view` |
| `GET /analytics/admins`, `GET /users/admins` | `admin-management:view` |
| `GET /users` | `users:view` |
| `GET /kyc/admin/:id` | `users:details` |
| `PATCH /users/:id/:action` (activate, deactivate) | `users:actions` |
| `PATCH /users/:id` by an admin on another user | `users:actions` |
| `PATCH /listing/review/:id/:action` by an admin who is not the owner | `properties:actions` |
| `PATCH /bookings/:id/:status` by an admin who is not the host or the guest | `bookings:actions` |
| `GET /audit-logs` | `audit-logs:view` |
| `GET /v1/admin/reports` | `reports:view` |
| `GET /v1/admin/reports/:id` | `reports:details` |
| `POST /v1/admin/reports/:id/resolve` | `reports:actions` |
| `GET /v1/admin/listing-verifications` | `verifications:view` |
| `GET /v1/admin/listing-verifications/:id` | `verifications:details` |
| the `POST` routes of listing verification | `verifications:actions` |
| `GET /rbac`, `GET /rbac/:id` | `roles:view`, or `admin-management:actions` (the invite and "Change role" selects need the list; my call) |
| `POST /rbac`, `PATCH /rbac/:id`, `DELETE /rbac/:id` | `roles:actions` |
| `POST /auth/admin-invite`, `PATCH /users/:id/role` | `admin-management:actions` |

The old routes for properties, bookings, and transactions that the panel reads with the normal user guards (not admin guards) stay as they are in this work, because guests and hosts also use them. The panel still blocks those pages from the permission. The builder lists these routes in the backend `CLAUDE.md` as a known gap.

## Backend

- A decorator `@RequirePermission('reports:actions')` and one guard that reads it. The guard runs after the JWT guard and the admin guard. It loads the role of `req.user.role_id` and checks `permissions`. The role `superadmin` passes always. A role that is missing gives no permission.
- Refusal: the old routes answer `403` with `{ message, code: 'MISSING_PERMISSION', permission }`; the v1 routes answer the v1 error shape with the same `code` and `permission`. The panel reads `code` and `permission` from both.
- Cache the role in memory for at most 60 seconds (my call), and clear the cache entry when the role changes, so a change works within a minute at the latest on each dyno.
- `GET /rbac/me`: the role of the signed-in admin, `{ role: { id, name, slug }, permissions }` (with every permission for `superadmin`). No permission needed, only the admin guard.
- Fix `PATCH /rbac/:id`: use `@Param('id')`. Today `@Param() id` gives an object, so an update changes nothing. Refuse a change of `superadmin`. Validate `permissions` against `PERMISSIONS_CONFIG`. Add `name` to `UpdateRoleDto`, so a role can be renamed. The slug never changes after the create (my call), so a rename cannot collide with the unique index or take the slug `superadmin`.
- `GET /users/:id` (the admin detail page) stays on the user guard. List it as a known gap, as the other shared routes.
- `DELETE /rbac/:id`: refuse `superadmin` and refuse a role that an admin still has (`409 ROLE_IN_USE`, with the count).
- `PATCH /users/:id/role` `{ role_id }`: changes the role of an admin. Refuse a user that is not an admin, an unknown role, and the rules of "No admin above their own role" below. Refuse to take the last active Super Admin out of `superadmin`.

### No admin above their own role (the owner's rule)

The owner said: "An admin cannot give themselves more power than they have, except the Super Admin. The Super Admin has absolute power. Admins can invite another admin, but cannot give them a role greater than theirs. Admins can ask for a promotion or more permissions."

One pure function, `canGrant(actorPermissions, rolePermissions)`: true when each permission of the role is also a permission of the actor. A Super Admin passes always. The backend applies it to:

- `POST /auth/admin-invite`: the `role_id` must pass `canGrant`. So only a Super Admin can invite a Super Admin.
- `PATCH /users/:id/role`: the new role must pass `canGrant`. An admin also cannot change their own role, and cannot change the role of an admin whose current role does not pass `canGrant` (an admin cannot move someone above them, my call). A Super Admin can do all of these.
- `POST /rbac` and `PATCH /rbac/:id`: the permissions of the new or changed role must pass `canGrant`. An admin who is not a Super Admin cannot change the role that they have (else they add permissions to themselves), and cannot change or delete a role that does not pass `canGrant`. Only a Super Admin changes the role `superadmin`; its permission list stays all permissions.
- Refusal: `403` with `code: 'ABOVE_OWN_ROLE'`.

The panel shows the same rule before the click: the role selects mark a role that the admin cannot give as "Above your role" and do not let the admin pick it; the permission grid does not let the admin check a permission that they do not have (with a tooltip "You do not have this permission"). The backend stays the check.

### Requests for more permissions (the owner's rule)

Permissions live on roles, so a request is satisfied with a role.

- An admin sends a request from the blocked state ("Ask for access", which fills in the permission of the page) or from "My profile" ("Ask for more permissions"): `POST /v1/admin/access-requests` `{ permissions: string[], roleId?: string, reason: string }`. The admin asks for permissions, or for a role (a promotion), or both. Reason: needed, 500 characters or less. One open request for each admin (`409 REQUEST_OPEN`); the admin can cancel it.
- Who decides (my call): an admin with `admin-management:actions` for whom the result passes `canGrant`, and who is not the requester. In practice this is often the Super Admin.
- Decide: "Approve" gives the requester a role: the asked role, or a role that the decider picks or makes in the same dialog that has the asked permissions. The role change goes through the same rules as `PATCH /users/:id/role`. "Decline" with a note. The requester sees the result and the note on "My profile".
- `GET /v1/admin/access-requests` (`status`, the oldest first), `POST /:id/approve` `{ roleId }`, `POST /:id/decline` `{ note }`, `POST /:id/cancel` (the requester only). Each writes an audit log.
- The bell gets a queue "Access requests" for an admin with `admin-management:actions`. The Admins page gets a tab "Requests" with the list and the decide dialog.

### Production roles at the deploy (the owner's rule)

The owner said: "Only give info@edgetechino.com the Super Admin role."

- A script, run once after the deploy with the Heroku config vars, as `yarn bootstrap:admin`:
  1. Sets the permissions of `superadmin` to all of `PERMISSIONS_CONFIG`.
  2. Gives the admin `info@edgetechino.com` the role `superadmin`. It stops with an error if that user is missing or is not an admin.
  3. Moves each other admin who has `superadmin` to a role "Staff" (made if missing) with all `view` and `details` permissions and no `actions` (my call). They then ask for more with a request.
  4. Leaves the other roles and admins as they are, and prints each role with its permissions and its admins, so the owner sees who lost access.
  5. Prints the admins whose `role_id` points to no role. The guard gives them no permission; they ask for access, or the Super Admin gives them a role.
- It has a dry run (`--dry-run`) that only prints, and the owner runs the dry run first.
- Each role create, change, delete, and each role change of an admin writes an audit log, as the report resolve does.
- Tests: the guard (pass, refuse, `superadmin`, missing role, cache clear), the route map (extend `admin-user.guard.spec.ts` to check the permission of each route), `canGrant` and each route that uses it, the rules of role delete and role change, the access requests, and the production script (with a test database).

## Panel

### Permissions of the signed-in admin

- RTK Query `getMyPermissions` (`GET /rbac/me`), tag `MyPermissions`. A role change of the own role is not possible, but a change of the role by another admin shows after a reload or after 5 minutes (the RTK cache rule), and at once when the backend answers `403 MISSING_PERMISSION`: the panel then loads `/rbac/me` again.
- `usePermission('reports:actions')` gives `allowed | denied | loading`.
- `PermissionGate` wraps each page body. With `denied` it shows `BlockedState`; with `loading` the normal skeleton.
- `BlockedState` (in `src/components/admin`): an illustration (an SVG made for this, in the HeroUI colors so it works in light and dark mode, no animation), the title "You do not have permission", the text "Your role, <role name>, cannot open <page name>." and "Ask a Super Admin to change your role." It also shows when a query of the page answers `403 MISSING_PERMISSION`.
- An action button stays visible. When the role cannot do it, a click opens a small dialog with the same message (my call; the button does not look disabled, so the owner's "show, do not hide" rule holds).

### Page permissions

| Page | Needs |
| --- | --- |
| Dashboard | `dashboard:view` |
| Users, user detail | `users:view`, `users:details` |
| Properties, property detail | `properties:view`, `properties:details` |
| Bookings, booking detail | `bookings:view`, `bookings:details` |
| Transactions | `transactions:view` |
| Reports, report detail | `reports:view`, `reports:details` |
| Admins, admin detail | `admin-management:view`, `admin-management:details` |
| Roles, role detail | `roles:view`, `roles:details` (read with `roles:view` on the backend) |
| Audit logs | `audit-logs:view` |
| Notifications, My profile | always |

The bell shows each queue only when the admin has its `:view` permission (reports, verifications, admin-management). A queue that the role cannot see does not count in the badge. This is not a hidden page: the bell lists work to do, and work that the admin cannot do is noise (my call).

### Reports page

- Menu item "Reports" (icon from the mobile app, for example `flag-outline` if it exists, else add one to `admin-glyphs.ts`), shortcut "g r", in the first menu group after "Bookings". Add its first query to `PREFETCH` in `src/lib/page-queries.ts`.
- List: `SegmentTabs` Open / Dismissed / Actioned (default Open), `FilterMenu` for the target type (listing, user), `AdminTable` with: the target (listing title or user name), the reason (a readable label), the reporter, the count of open reports of the target, and the date. The oldest first, as the backend sends. `TablePagination`.
- Detail (`/reports/[id]`): the reason, the details text of the reporter, the reporter (`UserCell`, opens the user page), the target (opens the listing or the user page), the other open reports of the same target (from `GET /v1/admin/reports?targetId=…&status=open`), and for a closed report the outcome, the staff note, who closed it, and when.
- Close: two buttons, "Dismiss" and "Mark as actioned". Each opens a dialog with a note (needed, 1000 characters or less, as the backend) and a confirm. After the resolve, the panel loads the list, the detail, and the bell again. A report that another admin closed first: show the backend error and load the detail again.
- "Mark as actioned" does not do the action. The dialog says: "Take the action first, for example deactivate the user or hide the listing." with links to the target page.
- The reason labels are a copy of the reasons of the backend `report-rules.ts`; the builder puts them in `src/lib/report-reasons.ts`.

### Roles page

- The Admins page already has a "Roles" tab. Make it the place for roles (my call; one menu item "Admins" for staff and roles, as today): the list gets "New role" and a row click opens `/admin-management/roles/[id]`.
- Role form (create and edit): name (letters and spaces, as the backend DTO), description, and a grid of permissions. Rows are the areas, columns are View / Details / Actions. A checkbox for each cell, and a checkbox for each row and column. Rule in the form: checking `details` or `actions` also checks `view` of the area (my call; an action without the page has no use).
- The `superadmin` role shows read-only, with the note "Super Admin always has every permission."
- Delete: a confirm dialog. On `409 ROLE_IN_USE` show "N admins have this role. Give them another role first."
- Admin detail (`/admin-management/[id]`): a "Role" row with "Change role" (a select of the roles). It does not show the button for the own account; it shows "You cannot change your own role."

## Constraints

- Panel: HeroUI v3, build from `src/components/admin`, the colors of the HeroUI theme, rounding of the panel, and no new animation.
- Backend: `@RequirePermission` must run after the guard that sets `req.user`. `@AdminOnly()` protects nothing alone.
- Deploy order: the backend first. A panel that calls `/rbac/me` on an old backend gets `404`; the panel then treats the admin as allowed everywhere and shows nothing blocked (my call; the old backend lets everything in any case). Run the production script (dry run first) right after the backend deploy.
- A production deploy needs the owner's approval.

## Left to the builder

- The file layout of the guard and the cache.
- The exact SVG of the blocked state.
- The order of the work, and the split into commits.
- Any admin route that the map above misses: give it the closest permission and list it in the backend `CLAUDE.md`.
- Update both `CLAUDE.md` files: the "The bell" sections, "Admins", and a new "Roles and permissions" section.
