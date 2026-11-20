# Reports page, roles, and permissions: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff close user reports from the panel, and admin roles with permissions really limit what each admin can do, with a blocked state in the panel and requests for more access.

**Architecture:** The backend owns the rules: a `@RequirePermission` decorator and a `PermissionGuard` on every admin route, a pure `canGrant` rule on every route that gives a role, and a new access-request module. The panel reads the permissions of the signed-in admin from `GET /rbac/me`, wraps each page in a `PermissionGate` that shows `BlockedState`, and adds the Reports, Roles, and Requests screens.

**Tech Stack:** Backend: NestJS, Mongoose, Zod (v1 routes), class-validator (old routes), Jest (`yarn test`, `yarn test:e2e`). Panel: Next.js 15, React 19, HeroUI v3, RTK Query, and Vitest (new, for pure rules only).

**Spec:** `docs/superpowers/specs/2026-11-21-reports-and-roles-design.md` (this repo). Read it before each task.

## Global Constraints

- Two repos. Part A is `~/DEV/real-stay-backend`, Part B is `~/DEV/real-stay-admin`. Do Part A first: Part B needs its routes.
- Package manager: `yarn` in both repos.
- Checks after each task. Backend: `yarn test`, `yarn typecheck`, and the e2e file of the task. Panel: `yarn typecheck`, `yarn test` (from Task B1). Compare the typecheck count with `main` before the task, not with 0.
- Commit each task to `main` of its repo. Commit only the files of the task: both repos have unrelated local changes. End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Do not deploy. A production deploy needs the owner's approval.
- Permission form: `<area>:<level>`, levels `view`, `details`, `actions`. New areas: `reports`, `verifications`, `roles`. Keep the two copies of the list the same: backend `src/constants/rbac.perms.ts`, panel `src/app/configs/rbac.perms.ts`.
- The Super Admin role has slug `superadmin`. It has every permission, always, whatever its stored list says.
- Error codes (exact): `MISSING_PERMISSION` (with `permission`), `ABOVE_OWN_ROLE`, `ROLE_IN_USE` (with `count`), `REQUEST_OPEN`, `LAST_SUPER_ADMIN`, `OWN_ROLE`.
- Panel UI: HeroUI v3 and `src/components/admin` parts, HeroUI theme colors only (light and dark), no new animation.
- Copy (exact): blocked title "You do not have permission"; blocked text "Your role, <role name>, cannot open <page name>." and "Ask a Super Admin to change your role."; button "Ask for access"; role select mark "Above your role"; grid tooltip "You do not have this permission"; own-role text "You cannot change your own role."; Super Admin note "Super Admin always has every permission."; role delete conflict "N admins have this role. Give them another role first."; actioned dialog "Take the action first, for example deactivate the user or hide the listing."
- Limits: report staff note 1 to 1000 characters; access request reason 1 to 500 characters; role cache 60 seconds.

## Review Focus

1. An admin whose `role_id` points to a deleted role, or who has no `role_id`: the backend gives no permission, the panel blocks the pages, and the admin can still send an access request. Tests: Task A2 (`missing role`), Task A6 (`a request from an admin with no role`).
2. A Super Admin removes the last Super Admin (themselves or the only other one) from `superadmin`: the backend refuses with `LAST_SUPER_ADMIN`. Test: Task A5.
3. A role changes while its admins are signed in: on the same dyno the change works at once (cache entry cleared), on other dynos within 60 seconds. Test: Task A2 (`clear`), Task A4 (the change calls `clear`).
4. The panel on a backend without `/rbac/me` (404): every page is allowed, nothing is blocked. Test: Task B1 (`permissionStateOf` with a 404).
5. Two admins close the same report: the second gets `409 INVALID_STATE`; the panel shows the error and loads the detail again. Check: Task B3, Step 5.

---

## Part A: Backend (`~/DEV/real-stay-backend`)

### Task A1: Permission list and pure rules

**Files:**
- Modify: `src/constants/rbac.perms.ts`
- Create: `src/features/rbac/permission-rules.ts`
- Test: `src/features/rbac/permission-rules.spec.ts`

**Interfaces:**
- Produces:
  - `PERMISSIONS_CONFIG` gets `reports:*`, `verifications:*`, `roles:*` (three levels each), after `audit-logs:*`.
  - `type Permission = (typeof PERMISSIONS_CONFIG)[number]` (make the array `as const`).
  - `SUPER_ADMIN_SLUG = 'superadmin'`.
  - `effectivePermissions(role: { slug: string; permissions: string[] } | null): Set<string>`: all of `PERMISSIONS_CONFIG` for `superadmin`, the empty set for `null`, else the stored list that is in `PERMISSIONS_CONFIG`.
  - `canGrant(actor: Set<string>, actorIsSuperAdmin: boolean, rolePermissions: readonly string[]): boolean`.
  - `invalidPermissions(list: readonly string[]): string[]` (the items not in `PERMISSIONS_CONFIG`).

- [ ] **Step 1: Write the failing tests**

```ts
it('gives every permission to superadmin, whatever is stored', () => {
  expect(effectivePermissions({ slug: 'superadmin', permissions: [] }).size).toBe(PERMISSIONS_CONFIG.length);
});
it('gives no permission to a missing role', () => {
  expect(effectivePermissions(null).size).toBe(0);
});
it('drops unknown stored permissions', () => {
  expect([...effectivePermissions({ slug: 'x', permissions: ['users:view', 'nope'] })]).toEqual(['users:view']);
});
it('lets an actor grant a subset of their permissions', () => {
  expect(canGrant(new Set(['users:view', 'users:actions']), false, ['users:view'])).toBe(true);
});
it('refuses a role above the actor', () => {
  expect(canGrant(new Set(['users:view']), false, ['users:view', 'roles:actions'])).toBe(false);
});
it('lets a super admin grant anything', () => {
  expect(canGrant(new Set(), true, [...PERMISSIONS_CONFIG])).toBe(true);
});
it('lists invalid permissions', () => {
  expect(invalidPermissions(['reports:view', 'x:y'])).toEqual(['x:y']);
});
```

- [ ] **Step 2: Run** `yarn test src/features/rbac/permission-rules` and see it fail (module not found).
- [ ] **Step 3: Implement** the list change and `permission-rules.ts`. Make `bootstrap-admin.ts` import `SUPER_ADMIN_SLUG` for its slug.
- [ ] **Step 4: Run** `yarn test src/features/rbac src/features/auth` and see PASS.
- [ ] **Step 5: Commit** `feat(rbac): permission list with reports, verifications and roles, and the canGrant rule`.

### Task A2: Permission guard and role cache

**Files:**
- Create: `src/features/rbac/role-permissions.service.ts`, `src/features/rbac/require-permission.decorator.ts`, `src/features/rbac/permission.guard.ts`
- Modify: `src/features/rbac/rbac.module.ts` (provide and export the service and the guard; mark the module `@Global()` so every controller can use the guard without import changes, or import `RBACModule` in each module that uses it; builder's choice)
- Test: `src/features/rbac/role-permissions.service.spec.ts`, `src/features/rbac/permission.guard.spec.ts`

**Interfaces:**
- Consumes: `effectivePermissions`, `SUPER_ADMIN_SLUG` (A1).
- Produces:
  - `RolePermissionsService.of(user: { role_id?: string | null }): Promise<{ role: { id: string; name: string; slug: string } | null; permissions: Set<string>; isSuperAdmin: boolean }>`. Cache by role ID for 60 seconds. An invalid or unknown ID gives `role: null` and no permissions.
  - `RolePermissionsService.has(user, permission: string): Promise<boolean>`.
  - `RolePermissionsService.assert(user, permission: string, v1: boolean): Promise<void>`: throws the refusal below. For checks inside a handler.
  - `RolePermissionsService.clear(roleId?: string): void` (no argument clears all).
  - `@RequirePermission(...permissions: string[])`: metadata key `REQUIRED_PERMISSIONS`. The guard passes when the user has ANY of them.
  - `PermissionGuard`: reads the metadata of the handler, then of the controller. No metadata: pass. Refusal on a v1 controller (`VERSION_METADATA` is `'1'`): `new ProxyHttpException(403, { error: 'You do not have permission', code: 'MISSING_PERMISSION', permission })`. Refusal on an old controller: `new ForbiddenException({ message: 'You do not have permission', code: 'MISSING_PERMISSION', permission })`. `permission` is the first required permission.
  - Put it last: `@UseGuards(JwtAuthGuard, AdminUserGuard, PermissionGuard)` or `@UseGuards(V1JwtAuthGuard, V1AdminGuard, PermissionGuard)`.

- [ ] **Step 1: Write the failing tests**: service: `superadmin` gives all; `missing role` (unknown ID, invalid ID, no `role_id`) gives none; the second call within 60 s does not read the database (count calls on a mocked model); `clear(roleId)` makes the next call read again; after 60 s (jest fake timers) it reads again. Guard: passes with no metadata; passes with one of two required permissions; refuses with the old shape on an old controller and the v1 shape on a v1 controller (assert status 403, `code`, `permission`).
- [ ] **Step 2: Run** `yarn test src/features/rbac` and see it fail.
- [ ] **Step 3: Implement** the three files and the module change.
- [ ] **Step 4: Run** `yarn test src/features/rbac` and see PASS.
- [ ] **Step 5: Commit** `feat(rbac): a permission guard that reads the role of the admin`.

### Task A3: Permissions on every admin route

**Files:**
- Modify: `src/features/analytics/analytics.controller.ts`, `src/features/users/users.controller.ts`, `src/features/kyc/kyc.controller.ts`, `src/features/auditlogs/auditlogs.controller.ts`, `src/features/auth/auth.controller.ts`, `src/features/reports/admin-reports-v1.controller.ts`, `src/features/listing-verification/admin-verification-v1.controller.ts`, the listing review handler (`PATCH /listing/review/:id/:action`) and the booking status handler (`PATCH /bookings/:id/:status`)
- Test: `src/features/auth/guards/admin-user.guard.spec.ts` (extend)

**Interfaces:**
- Consumes: `@RequirePermission`, `PermissionGuard`, `RolePermissionsService.assert` (A2).
- Produces: the route map of the spec ("Permissions" table). `rbac.controller.ts` gets its permissions in Task A4, and `PATCH /users/:id/role` in Task A5.

- [ ] **Step 1: Write the failing test**: a table test in `admin-user.guard.spec.ts` that reads the `REQUIRED_PERMISSIONS` metadata and the guards of each handler:

```ts
it.each([
  [AnalyticsController, 'get', ['dashboard:view']],
  [AnalyticsController, 'getAdmins', ['admin-management:view']],
  [UsersController, 'getUsers', ['users:view']],
  [UsersController, 'getAdmins', ['admin-management:view']],
  [UsersController, 'activateDeactivate', ['users:actions']],
  [KycController, 'getByAdmin', ['users:details']],
  [AuditLogsController, 'get', ['audit-logs:view']],
  [AuthController, 'adminInvite', ['admin-management:actions']],
  [AdminReportsV1Controller, 'list', ['reports:view']],
  [AdminReportsV1Controller, 'get', ['reports:details']],
  [AdminReportsV1Controller, 'resolve', ['reports:actions']],
  [AdminVerificationV1Controller, 'list', ['verifications:view']],
  // ...each POST of AdminVerificationV1Controller: ['verifications:actions']
])('%p.%s needs %p', (controller, handler, perms) => {
  expect(permissionsOf(controller, handler)).toEqual(perms);
  expect(guardsOf(controller, handler)).toContain(PermissionGuard);
});
```

Use the real handler names of each controller. Add one test for each conditional check: `PATCH /users/:id` by an admin on another user calls `assert(user, 'users:actions', false)`; by a user on themselves it does not. The same for listing review (`properties:actions`, not for the owner) and booking status (`bookings:actions`, not for the host or the guest). Mock `RolePermissionsService`.
- [ ] **Step 2: Run** `yarn test src/features/auth/guards` and see it fail.
- [ ] **Step 3: Implement** the decorators and the three conditional checks.
- [ ] **Step 4: Run** `yarn test` and `yarn test:e2e -- reports listing-verification-admin` and see PASS. The e2e admins of these files need a role with the permissions: give the test admin the `superadmin` role in the e2e helpers (`test/helpers`).
- [ ] **Step 5: Commit** `feat(admin): each admin route needs a permission`.

### Task A4: RBAC routes

**Files:**
- Modify: `src/features/rbac/rbac.controller.ts` (rename the class to `RbacController`; update the import alias in `admin-user.guard.spec.ts`), `src/features/rbac/rbac.service.ts`, `src/features/rbac/dto/rbac.dto.ts`
- Test: `src/features/rbac/rbac.service.spec.ts`, `test/rbac.e2e-spec.ts`

**Interfaces:**
- Consumes: `canGrant`, `invalidPermissions` (A1), `RolePermissionsService` (A2), `AuditlogsService.createAuditLog` (fields as `reports.service.ts:233-241`).
- Produces (old routes; the response interceptor wraps the body in `{ data, success }`):
  - `GET /rbac/me` (admin guard only, no permission) → `{ role: { id, name, slug } | null, permissions: string[], isSuperAdmin: boolean }`. Declare it before `GET /rbac/:id`.
  - `GET /rbac`, `GET /rbac/:id`: `@RequirePermission('roles:view', 'admin-management:actions')`. Fix `@Param() id` to `@Param('id') id`.
  - `POST /rbac`, `PATCH /rbac/:id`, `DELETE /rbac/:id`: `@RequirePermission('roles:actions')`.
  - `UpdateRoleDto` accepts `name` (same rule as create), `description`, `permissions`. The update never changes `slug`.
  - Rules (service): `400` for invalid permissions (list them); `403 ABOVE_OWN_ROLE` when the new list does not pass `canGrant`, when a non-super admin changes their own role, or changes or deletes a role that does not pass `canGrant`; `403` for a change or delete of `superadmin` by a non-super admin; `400` for a delete of `superadmin` by anyone; the stored list of `superadmin` stays all permissions on a change; `409 ROLE_IN_USE` with `count` for a delete of a role that admins have.
  - Each create, change, and delete calls `clear(roleId)` and writes an audit log (`role.created`, `role.updated`, `role.deleted`).

- [ ] **Step 1: Write the failing tests**: e2e: `/rbac/me` for a super admin (all, `isSuperAdmin: true`), for a role, for a missing role (`role: null`, `[]`); a PATCH that now changes the role (the old bug); a PATCH that renames and keeps the slug; each refusal above with its status and code; a DELETE in use (409, `count`) and a DELETE free (200, role gone); an admin with only `admin-management:actions` can `GET /rbac`; an audit log row after each change.
- [ ] **Step 2: Run** `yarn test:e2e -- rbac` and see it fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `yarn test`, `yarn test:e2e -- rbac`, and see PASS.
- [ ] **Step 5: Commit** `feat(rbac): edit and delete roles, /rbac/me, and no role above the own role`.

### Task A5: Role change of an admin, and the invite rule

**Files:**
- Modify: `src/features/users/users.controller.ts`, `src/features/users/users.service.ts`, `src/features/auth/auth.service.ts` (invite), a new DTO `src/features/users/dto/change-role.dto.ts`
- Test: `test/admin-roles.e2e-spec.ts`

**Interfaces:**
- Consumes: `canGrant` (A1), `RolePermissionsService` (A2).
- Produces:
  - `PATCH /users/:id/role` `{ role_id }`: `@UseGuards(JwtAuthGuard, AdminUserGuard, PermissionGuard)`, `@RequirePermission('admin-management:actions')`. Declare it before `PATCH /users/:id/:action`, or Nest routes `role` as an action. Returns the user without the password, with the new `role_id` and `role_name`.
  - Refusals: `404` unknown user or role; `400` a user who is not an admin; `403 OWN_ROLE` for the own account by a non-super admin; `403 ABOVE_OWN_ROLE` when the new role or the current role of the target does not pass `canGrant`; `409 LAST_SUPER_ADMIN` when the change takes the last active admin out of `superadmin`.
  - Audit log `admin.role_changed`, with the old and the new role name in `description`.
  - `POST /auth/admin-invite`: `403 ABOVE_OWN_ROLE` when `role_id` does not pass `canGrant` for the inviter.
  - Export `changeAdminRole(actor, targetId, roleId)` from the users service; Task A6 uses it.

- [ ] **Step 1: Write the failing tests**: each refusal above; a super admin moves another super admin to a role (passes when two are active); a super admin moves the last one, themselves included (409); an admin gives an equal or smaller role (200); an invite with `superadmin` by a non-super admin (403); an invite with a smaller role (201).
- [ ] **Step 2: Run** `yarn test:e2e -- admin-roles` and see it fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `yarn test`, `yarn test:e2e -- admin-roles rbac`, and see PASS.
- [ ] **Step 5: Commit** `feat(admins): change the role of an admin, never above the own role`.

### Task A6: Access requests

**Files:**
- Create: `src/features/access-requests/` with `access-request.schema.ts`, `access-requests.schemas.ts` (Zod), `access-requests.service.ts`, `access-requests-v1.controller.ts`, `access-requests.module.ts`; register the module in `app.module.ts`
- Test: `test/access-requests.e2e-spec.ts`

**Interfaces:**
- Consumes: `canGrant`, `invalidPermissions` (A1), `RolePermissionsService` (A2), `changeAdminRole` (A5), the v1 helpers of `admin-reports-v1.controller.ts` (`RawResponse`, `ProxyErrorFilter`, `proxyError`, `ZodValidationPipe`).
- Produces (v1, `@Controller({ path: 'admin/access-requests', version: '1' })`, guards `V1JwtAuthGuard, V1AdminGuard, PermissionGuard`):
  - Record: `requester_id`, `permissions: string[]`, `role_id: string | null`, `reason`, `status: 'open' | 'approved' | 'declined' | 'cancelled'`, `is_open: boolean`, `decision: { by, at, note, role_id } | null`, timestamps. A partial unique index on `requester_id` where `is_open: true`.
  - Item shape: `{ id, requester: PersonSummary & { roleName: string | null }, permissions, role: { id, name } | null, reason, status, decision: { note: string | null; at: string; by: string; role: { id, name } | null } | null, createdAt }`. `PersonSummary` as in `reports.service.ts`.
  - `POST /` (no permission) `{ permissions?: string[], roleId?: string, reason: string }`: at least one of `permissions` or `roleId`; `reason` 1 to 500 characters; `400` for invalid permissions or an unknown role; `409 REQUEST_OPEN` when the admin has an open request.
  - `GET /mine` (no permission) → `{ data: Item | null }`, the newest request of the admin.
  - `POST /:id/cancel` (no permission): the requester only, an open request only (`409 INVALID_STATE` else).
  - `GET /` `@RequirePermission('admin-management:actions')` with `status`, `page`, `limit` → `{ data: { data, total, page, limit } }`, the oldest first.
  - `POST /:id/approve` `{ roleId }`, `@RequirePermission('admin-management:actions')`: refuses the requester (`403 OWN_ROLE`); the role must contain every asked permission (`400`); then calls `changeAdminRole(actor, requesterId, roleId)`, so all A5 rules apply; marks the request `approved`.
  - `POST /:id/decline` `{ note }` (1 to 500 characters), `@RequirePermission('admin-management:actions')`.
  - Audit logs: `access_request.created`, `.approved`, `.declined`, `.cancelled`.

- [ ] **Step 1: Write the failing tests**: create, second create (409), cancel, `mine`; `a request from an admin with no role` (201); list for a decider and 403 for an admin without the permission; approve with a role that has the permissions (requester's role changes); approve with a role above the decider (403 `ABOVE_OWN_ROLE`); approve own request (403); approve with a role that misses an asked permission (400); decline with a note; approve or decline a closed request (409).
- [ ] **Step 2: Run** `yarn test:e2e -- access-requests` and see it fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `yarn test`, `yarn test:e2e -- access-requests`, and see PASS.
- [ ] **Step 5: Commit** `feat(admins): requests for more permissions or a promotion`.

### Task A7: Production role script and backend docs

**Files:**
- Create: `src/features/rbac/setup-admin-roles.ts` (logic with injected deps, as `bootstrap-admin.ts`), `scripts/setup-admin-roles.ts`; add `"setup:admin-roles"` to `package.json` (same form as `bootstrap:admin`)
- Modify: `CLAUDE.md` (sections "Admins", "Reports", "Listing verification", and a new "Roles and permissions")
- Test: `test/setup-admin-roles.e2e-spec.ts`

**Interfaces:**
- Produces: `setupAdminRoles(deps, { superAdminEmail: 'info@edgetechino.com', dryRun: boolean }): Promise<SetupReport>`, where `SetupReport = { superAdminRoleId: string; staffRoleId: string | null; movedToStaff: string[]; roles: { name: string; slug: string; permissions: string[]; admins: string[] }[]; adminsWithoutRole: string[] }`. Steps, in order, as the spec ("Production roles at the deploy"): store all permissions on `superadmin` (create it if missing); give the role to `info@edgetechino.com` (throw if the user is missing or not an admin); move each other admin with `superadmin` to "Staff" (slug `staff`, all `view` and `details`, no `actions`; create it if missing); leave the rest; report. `--dry-run` writes nothing and prints the same report. Clear no cache: the script runs in its own process, and the 60 s cache of the dynos expires.

- [ ] **Step 1: Write the failing tests**: with two super admins and one other admin: after the run, only `info@edgetechino.com` has `superadmin`, the other super admin has `staff`, the other admin keeps their role; the dry run changes nothing and gives the same report; a missing `info@edgetechino.com` throws; a second run changes nothing more; an admin with a deleted role is in `adminsWithoutRole`.
- [ ] **Step 2: Run** `yarn test:e2e -- setup-admin-roles` and see it fail.
- [ ] **Step 3: Implement**, then update `CLAUDE.md`: the guard and where to put it, the route map, `canGrant` and where it applies, the access requests, the script with the Heroku command (as `bootstrap:admin`, dry run first), and the known gap (the shared routes of properties, bookings, transactions, and `GET /users/:id` have no permission check).
- [ ] **Step 4: Run** `yarn test`, `yarn test:e2e`, `yarn typecheck`, and see PASS.
- [ ] **Step 5: Commit** `feat(rbac): script that sets the admin roles at the deploy`.

---

## Part B: Admin panel (`~/DEV/real-stay-admin`)

### Task B1: Vitest and the pure permission rules

**Files:**
- Modify: `package.json` (dev dependency `vitest`, script `"test": "vitest run"`), `src/app/configs/rbac.perms.ts` (the same list as A1, `as const`)
- Create: `vitest.config.ts` (alias `@` to `src`), `src/lib/permissions.ts`
- Test: `src/lib/permissions.test.ts`

**Interfaces:**
- Produces:
  - `type Permission` from the list.
  - `type MyPermissions = { role: { id: string; name: string; slug: string } | null; permissions: string[]; isSuperAdmin: boolean }`.
  - `canGrant(me: MyPermissions, rolePermissions: readonly string[]): boolean` (same rule as A1).
  - `withImpliedView(list: string[], changed: string, checked: boolean): string[]`: checking `details` or `actions` adds `view` of the area; unchecking `view` removes `details` and `actions` of the area.
  - `type PermissionState = 'allowed' | 'denied' | 'loading'`.
  - `permissionStateOf(query: { data?: MyPermissions; error?: unknown; isLoading: boolean }, permission: Permission | null): PermissionState`: `null` permission → `allowed`; loading → `loading`; an error with status 404 → `allowed` (old backend); another error → `denied`; else from the list (`isSuperAdmin` → `allowed`).
  - `missingPermissionOf(error: unknown): string | null`: the `permission` of a 403 with `code: 'MISSING_PERMISSION'` (old shape in `data.message`/`data`, v1 shape in `data`), else `null`. Read the error shape of `src/app/store/axiosBaseQuery.ts`.
  - `PAGE_PERMISSIONS: Record<string, { permission: Permission | null; name: string }>` keyed by route pattern, from the spec table ("Page permissions"), plus `/admin-management/roles` and `/admin-management/roles/[id]` (`roles:view`).

- [ ] **Step 1: Write the failing tests** for each function: `canGrant` subset, above, super admin; `withImpliedView` both directions; `permissionStateOf` with no permission, loading, 404, 500, super admin, allowed, denied; `missingPermissionOf` for the old shape, the v1 shape, another 403, a 500.
- [ ] **Step 2: Run** `yarn test` and see it fail.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `yarn test` and `yarn typecheck`, and see PASS.
- [ ] **Step 5: Commit** `feat(permissions): pure permission rules of the panel, with Vitest`.

### Task B2: Blocked state on every page

**Files:**
- Create: `src/app/endpoints/rbac/my-permissions.ts` (or add to `rbac-api-slice.ts`), `src/components/admin/permission-gate.tsx`, `src/components/admin/blocked-state.tsx`, `src/components/admin/blocked-illustration.tsx`, `src/components/admin/permission-dialog.tsx`, `src/lib/use-permission.ts`
- Modify: `src/components/admin/index.ts`, `src/app/store/storeConfigQuery.ts` (tag `MyPermissions`), each page under `src/app/(dashboard)/` from the page table, `src/components/dashboard/attention-center.tsx`, `src/lib/page-queries.ts` (prefetch only what the admin can open)

**Interfaces:**
- Consumes: B1 rules, `GET /rbac/me` (A4).
- Produces:
  - `rbacApi.useGetMyPermissionsQuery()` → `MyPermissions` (unwrap `res.data`), tag `MyPermissions`, `keepUnusedDataFor` as the store default.
  - `usePermission(permission: Permission | null): PermissionState`, and `useCan(): (permission: Permission) => boolean` for buttons.
  - `<PermissionGate permission="reports:view" pageName="Reports">{children}</PermissionGate>`: `loading` → `children` (the page shows its own skeleton); `denied` → `<BlockedState />`.
  - `<BlockedState permission pageName />`: the illustration and the exact copy of the Global Constraints. Task B6 adds the "Ask for access" button.
  - `<PermissionDialog permission isOpen onClose />`: the same message in a small dialog, for an action click.
  - `useGuardedAction(permission, action)`: returns a click handler that runs `action` when allowed and opens `PermissionDialog` when not.
  - A query error that `missingPermissionOf` reads: the page shows `BlockedState` for that permission and invalidates `MyPermissions`.
- The bell shows a queue only with its permission: reports `reports:view`, verifications `verifications:view`, admin invites `admin-management:view`. A hidden queue does not count in the badge.

- [ ] **Step 1: Implement** the endpoint, the hook, and the four components. The illustration is an inline SVG with `currentColor` and HeroUI color classes (a closed lock over a card), about 160 px wide.
- [ ] **Step 2: Wrap** each page body and each existing action button (deactivate a user, booking and listing actions, invite admin) with the gate or `useGuardedAction`.
- [ ] **Step 3: Run** `yarn test`, `yarn typecheck`, `yarn build`, and see PASS.
- [ ] **Step 4: Check in the browser** (`yarn dev`, against a local backend from Part A): sign in as an admin whose role has only `bookings:view`; Users shows the blocked state with the role name; Bookings opens; "Invite admin" on the Admins page shows the blocked state (the page is blocked); the bell shows no report queue. Sign in as the Super Admin: nothing is blocked. Check light and dark mode.
- [ ] **Step 5: Commit** `feat(permissions): a blocked state on pages and actions without the permission`.

### Task B3: Reports page

**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`, `src/app/(dashboard)/reports/[id]/page.tsx`, `src/app/(dashboard)/reports/components/resolve-dialog.tsx`, `src/lib/report-reasons.ts`, `src/app/endpoints/reports/reports-api-slice.ts`
- Modify: `src/lib/dashboardMenu.ts` (after Bookings: `{ label: "Reports", icon: <a flag icon>, path: "/reports", shortcut: "r" }`; add the glyph to `admin-glyphs.ts` with `tools/make-icons.mjs` if the app has none), `src/lib/page-queries.ts` (`reportsArgs` and `PREFETCH`), `src/app/endpoints/attention/attention-types.ts` (add `resolution: { note: string | null; at: string; by: string } | null` to `AdminReport`), `src/app/store/storeConfigQuery.ts` (tag `Report`)
- Test: `src/lib/report-reasons.test.ts`

**Interfaces:**
- Consumes: `GET /v1/admin/reports`, `GET /v1/admin/reports/:id`, `POST /v1/admin/reports/:id/resolve` `{ outcome: 'dismissed' | 'actioned', note }`; `PermissionGate`, `useGuardedAction` (B2).
- Produces: `reportsApi` with `getReports({ status, targetType, targetId, page, limit })`, `getReport(id)`, `resolveReport({ id, outcome, note })`. The resolve invalidates `Report` and the bell queries. `reasonLabel(reason: string): string` and the reason lists, copied from backend `src/features/reports/report-rules.ts`; an unknown reason shows as the raw text.

- [ ] **Step 1: Write the failing test** for `reasonLabel` (each backend reason has a label; `'something_new'` gives `'something_new'`). Run `yarn test` and see it fail, then implement `report-reasons.ts` and see PASS.
- [ ] **Step 2: Implement** the list page as the spec ("Reports page"): `SegmentTabs` Open / Dismissed / Actioned (default Open), `FilterMenu` target type, `AdminTable` columns target, reason, reporter, open reports of the target, date; `TablePagination`. Gate `reports:view`.
- [ ] **Step 3: Implement** the detail page and `resolve-dialog.tsx`: the fields of the spec, the other open reports of the target, the two buttons with `useGuardedAction('reports:actions', …)`, the note field (1 to 1000 characters), and the exact actioned copy with links to the target page. Gate `reports:details`.
- [ ] **Step 4: Run** `yarn test`, `yarn typecheck`, `yarn build`.
- [ ] **Step 5: Check in the browser**: send a report from the mobile app or with `POST /v1/reports`; it shows under Open; dismiss it with a note; it moves to Dismissed with the note, the admin and the date; the bell count drops. Open the same open report in two tabs, close it in one, then in the other: the second shows the backend message and loads the detail again (Review Focus 5). "g r" opens the page.
- [ ] **Step 6: Commit** `feat(reports): a page to review and close reports`.

### Task B4: Roles

**Files:**
- Create: `src/app/(dashboard)/admin-management/roles/new/page.tsx`, `src/app/(dashboard)/admin-management/roles/[id]/page.tsx`, `src/app/(dashboard)/admin-management/components/role-form.tsx`, `src/app/(dashboard)/admin-management/components/permission-grid.tsx`
- Modify: `src/app/endpoints/rbac/rbac-api-slice.ts` (`getRole`, `createRole`, `updateRole`, `deleteRole`, tag `Role`; each change also invalidates `MyPermissions`), `src/app/(dashboard)/admin-management/page.tsx` (Roles tab: "New role" button with `useGuardedAction('roles:actions', …)`, row click to the role page)

**Interfaces:**
- Consumes: `canGrant`, `withImpliedView` (B1), `useGetMyPermissionsQuery`, `useGuardedAction` (B2), the A4 routes and codes.
- Produces: `<PermissionGrid value onChange me readOnly />`: rows are the areas of `PERMISSIONS_CONFIG` in its order, columns View / Details / Actions, a checkbox per cell, per row, and per column; a permission that `me` does not have is disabled with the exact tooltip (not for a super admin); changes go through `withImpliedView`.

- [ ] **Step 1: Implement** the endpoints and the grid.
- [ ] **Step 2: Implement** the form (name with the backend rule, letters and spaces; description; grid), the new and edit pages, and delete with a confirm. The `superadmin` role shows read-only with the exact note and no delete. Map the codes: `ROLE_IN_USE` → the exact copy with `count`; `ABOVE_OWN_ROLE` → "This role has permissions that you do not have."
- [ ] **Step 3: Run** `yarn test`, `yarn typecheck`, `yarn build`.
- [ ] **Step 4: Check in the browser**: as an admin with `roles:actions` and some permissions, make a role: permissions outside the own set are disabled; checking "Actions" checks "View"; edit and rename it (the slug in the list stays); delete a role in use (the conflict message); the role that the admin has is read-only for them. As the Super Admin, everything is editable except `superadmin`.
- [ ] **Step 5: Commit** `feat(roles): make, edit and delete roles with a permission grid`.

### Task B5: Change the role of an admin, and the invite rule

**Files:**
- Modify: `src/app/(dashboard)/admin-management/[id]/page.tsx` (a "Role" row with "Change role"), `src/app/(dashboard)/admin-management/components/InviteAdminModal.tsx`, `src/app/endpoints/user/user-api-slice.ts` (`changeAdminRole({ id, roleId })`, invalidates the admin queries)
- Create: `src/app/(dashboard)/admin-management/components/role-select.tsx`

**Interfaces:**
- Consumes: `canGrant` (B1), `getRoles` (existing), `PATCH /users/:id/role` and its codes (A5).
- Produces: `<RoleSelect value onChange me />`: lists the roles; a role that does not pass `canGrant` shows "Above your role" and cannot be picked.

- [ ] **Step 1: Implement** `RoleSelect` and use it in the invite modal.
- [ ] **Step 2: Implement** "Change role" on the admin detail with `useGuardedAction('admin-management:actions', …)`. For the own account (`useSessionUser().id`) show the exact own-role text instead of the button, except for a super admin. Map `LAST_SUPER_ADMIN` → "RealStay needs at least one Super Admin." and `ABOVE_OWN_ROLE` → "This admin or this role is above your role."
- [ ] **Step 3: Run** `yarn test`, `yarn typecheck`, `yarn build`.
- [ ] **Step 4: Check in the browser**: a non-super admin sees "Above your role" on `superadmin` in the invite and the change; cannot change their own role; changes another admin to a smaller role. The Super Admin cannot move themselves out when they are the only one.
- [ ] **Step 5: Commit** `feat(admins): change the role of an admin, never above the own role`.

### Task B6: Access requests, and panel docs

**Files:**
- Create: `src/app/endpoints/access-requests/access-requests-api-slice.ts`, `src/app/endpoints/access-requests/access-requests-types.ts`, `src/components/admin/ask-access-dialog.tsx`, `src/app/(dashboard)/admin-management/components/requests-tab.tsx`, `src/app/(dashboard)/admin-management/components/decide-request-dialog.tsx`, `src/components/profile/my-access.tsx`
- Modify: `src/components/admin/blocked-state.tsx` (the "Ask for access" button), `src/app/(dashboard)/admin-management/page.tsx` (tab "Requests"), `src/app/(dashboard)/profile/page.tsx`, `src/components/dashboard/attention-center.tsx` (queue "Access requests", needs `admin-management:actions`), `CLAUDE.md`

**Interfaces:**
- Consumes: the A6 routes and the item shape; `RoleSelect`, `PermissionGrid` (B4, B5); `useCan` (B2).
- Produces: `accessRequestsApi` with `createRequest`, `getMyRequest`, `cancelRequest`, `getRequests({ status, page, limit })`, `approveRequest({ id, roleId })`, `declineRequest({ id, note })`, tag `AccessRequest`; approve also invalidates the admin queries.

- [ ] **Step 1: Implement** the endpoints and `AskAccessDialog` (the permissions, prefilled with the permission of the blocked page; an optional role with `RoleSelect` without the `canGrant` limit, because the requester asks for more; the reason, 1 to 500 characters). Map `REQUEST_OPEN` → "You already have an open request." with a link to "My profile".
- [ ] **Step 2: Implement** "My profile" → "My access": the role name, its permissions (read-only `PermissionGrid`), the newest request with its status and decision note, "Cancel request" for an open one, and "Ask for more permissions".
- [ ] **Step 3: Implement** the Requests tab (Open / Approved / Declined, oldest first) and `DecideRequestDialog`: the requester, the asked permissions and role, the reason; "Approve" with `RoleSelect` (prefilled with the asked role) or "Make a role" (opens the role form with the asked permissions prefilled, then comes back with the new role); "Decline" with a note. The own request shows no buttons. Add the bell queue.
- [ ] **Step 4: Update** `CLAUDE.md`: a "Roles and permissions" section (`GET /rbac/me`, `usePermission`, `PermissionGate`, `useGuardedAction`, the blocked state, the copies of `rbac.perms.ts` and `canGrant`, Vitest), the Reports page, the Requests tab; replace the line "The panel has no page to resolve a report" in both "The bell" sections, and remove the duplicated older "The bell" section.
- [ ] **Step 5: Run** `yarn test`, `yarn typecheck`, `yarn build`.
- [ ] **Step 6: Check in the browser**: as a "Staff" admin, open Transactions (blocked), "Ask for access", send; the request shows in "My profile"; a second request is refused. As the Super Admin, the bell shows the request; approve with a new role made from the request; the Staff admin reloads and opens Transactions. Decline another request with a note; the requester sees the note.
- [ ] **Step 7: Commit** `feat(admins): ask for access, and decide requests`.
