# Remove Admins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Super Admin removes and restores admins; only `info@edgetechino.com` removes or restores a Super Admin; a removed admin is blocked at once.

**Architecture:** Backend: pure rules in `src/features/users/admin-removal-rules.ts`, a service `AdminRemovalService` in the users feature, two routes on `UsersController`, and checks in `JwtStrategy`, `validateUser`, `refreshTokens`, `inviteAdmin`, `acceptAdminInvite`. Panel: the same rules in `src/lib/admin-removal.ts`, RTK mutations, the admin page and the Admins list.

**Tech Stack:** NestJS, Mongoose, jest + mongodb-memory-server e2e (backend); Next.js, HeroUI, RTK Query, vitest (panel).

**Spec:** `docs/superpowers/specs/2026-11-21-remove-admins-design.md`

## Global Constraints

- Owner email: `info@edgetechino.com`, compared without case.
- Error codes: `SUPER_ADMIN_ONLY`, `OWNER_ONLY`, `OWN_ACCOUNT` (403), `LAST_SUPER_ADMIN`, `ADMIN_REMOVED` (409), `USE_ADMIN_REMOVAL` (400). Old-route error shape `{ message, code }` (the global filter puts it in `data`).
- Audit actions: `admin.removed`, `admin.restored`.
- An account without `admin_removed_at` (or with null) is not removed.
- Backend checks: `npx jest <files>`, `yarn test:e2e -- admin-removal admin-roles rbac`, `npm run typecheck`. Panel: `yarn test`, `yarn typecheck`, `next build` in a worktree.
- Commit only the files of each task. Backend on `main`; panel on `ui/heroui`.

## Review Focus

1. A removed admin with a valid access token (15 min) calls an admin route: 401 at once, not after the token expires. Test in Task 2.
2. A removed admin with the right password signs in: refused with `ADMIN_REMOVED`, after the password check (no account probe). Test in Task 2.
3. The owner removes the last other Super Admin and then a Super Admin without the owner email tries to restore them: refused. Test in Task 2.
4. An invite to a removed pending admin's email: refused, no mail sent. Test in Task 2.
5. The panel dialog and the backend agree on who may remove whom. Same cases in Task 1 (backend) and Task 3 (panel) tests.

---

### Task 1: Backend rules

**Files:** Create `src/features/users/admin-removal-rules.ts`, test `src/features/users/admin-removal-rules.spec.ts`. Modify `scripts/setup-admin-roles.ts` to import `OWNER_SUPER_ADMIN_EMAIL`.

**Produces:**
- `OWNER_SUPER_ADMIN_EMAIL = 'info@edgetechino.com'`
- `type RemovalActor = { id: string; email: string; isSuperAdmin: boolean }`, `type RemovalTarget = { id: string; isSuperAdmin: boolean }`
- `removalRefusal(actor, target): { status: 403; code: 'SUPER_ADMIN_ONLY' | 'OWNER_ONLY' | 'OWN_ACCOUNT'; message: string } | null` (order: own account, Super Admin only, owner only)
- `isRemovedAdmin(user: { user_type?: string; admin_removed_at?: Date | string | null }): boolean`
- `adminRemovedError()` (409 `ADMIN_REMOVED` "This admin was removed. Restore them on their admin page.")

- [ ] Write the spec (cases: staff actor → SUPER_ADMIN_ONLY; super actor on staff → null; super non-owner on super → OWNER_ONLY; owner on super → null; owner email in capitals → null; actor on self → OWN_ACCOUNT; `isRemovedAdmin` for admin with date, admin with null, guest with date). Run: FAIL.
- [ ] Implement. Run: PASS. Commit `feat(admins): rules of admin removal`.

### Task 2: Backend service, routes and blocks

**Files:** Create `src/features/users/admin-removal.service.ts`; modify `users.controller.ts`, `users.module.ts`, `schemas/user.schema.ts` (`admin_removed_at?: Date`, `admin_removed_by?: string`), `auth/jwt.strategy.ts`, `auth/auth.service.ts`, `rbac/rbac.service.ts` (count), `auth/guards/admin-user.guard.spec.ts` (two routes), `CLAUDE.md`. Test `test/admin-removal.e2e-spec.ts` (harness of `test/admin-roles.e2e-spec.ts`).

- [ ] Write the e2e spec: remove (audit, status inactive, refresh key deleted); restore (active or pending); the rule refusals of Task 1 through HTTP; `LAST_SUPER_ADMIN`; a removed admin's token on `GET /users/admins` → 401; `PATCH /users/:id/deactivate` on an admin → 400 `USE_ADMIN_REMOVAL`, on a guest → 200; `GET /users/admins?removed=true` lists only removed. Auth parts (sign-in, refresh, invite) as unit tests of `AuthService` with mocks in `src/features/auth/auth-admin-removed.spec.ts`. Run: FAIL.
- [ ] Implement. Run the specs: PASS; run `npx jest src/features/auth src/features/rbac src/features/users` and `npm run typecheck`. Commit `feat(admins): remove and restore admins`.

### Task 3: Panel

**Files:** Create `src/lib/admin-removal.ts` + test; modify the user API slice (mutations `removeAdmin`, `restoreAdmin`, `removed` param), `admin-management/[id]/page.tsx` (button + dialogs), `admin-management/components/UserTable.tsx` (chip), the Admins page status filter, `src/lib/role-text.ts` (error texts), `CLAUDE.md`.

- [ ] Write the vitest cases of Task 1 for `removalRefusalOf(me, myEmail, target)` and the texts. Run: FAIL. Implement. PASS.
- [ ] Build the UI; check in the browser without pressing remove on a real admin. `yarn test`, `yarn typecheck`, build in a worktree. Commit only the task's lines (the owner has uncommitted changes in these files: stage hunks). Commit `feat(admins): remove and restore admins in the panel`.
