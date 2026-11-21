# PostHog Feature Flags and Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff control the PostHog feature flags of the app and see the product numbers of PostHog in the admin panel.

**Architecture:** Next.js server routes under `src/app/api/posthog/` call PostHog with a personal API key that only the server has. Each route checks the permission of the admin with backend `GET /rbac/me`. A flag write also writes a backend audit log through a new `POST /audit-logs/feature-flag`. The pages use a new RTK Query API on `/api/posthog`.

**Tech Stack:** Next.js 15 App Router, React 19, HeroUI v3, RTK Query, Chart.js, vitest (panel); NestJS, zod, jest (backend).

**Spec:** `docs/superpowers/specs/2026-11-21-posthog-flags-and-analytics-design.md`

## Global Constraints

- Server-only env: `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_HOST` (`https://eu.posthog.com`), `POSTHOG_PROJECT_ID` (`339639`). Never a `NEXT_PUBLIC_` prefix. The key never goes into a response body, a log line, or an error message.
- New permissions (both repos, same order, after `roles:*`): `feature-flags:view`, `feature-flags:details`, `feature-flags:actions`, `product-analytics:view`, `product-analytics:details`, `product-analytics:actions`.
- Do not hide a page or a button for a permission. Use `PAGE_PERMISSIONS` and `useGuardedAction`.
- Build pages from `@/components/admin`. Use HeroUI colors only (light and dark mode). No enter, exit, or layout animations.
- Rounding scale of the panel: `rounded-md`, `rounded-xl`, `rounded-2xl`, `rounded-[20px]`, `rounded-3xl`, `rounded-full` only.
- A route that is not GET refuses a request whose `Origin` is not the origin of the panel (403), as the backend proxy does.
- Analytics ranges: `7`, `30`, `90` days; default `30`. Cache of each result: 300 seconds.
- Read the PostHog API docs for each request shape (flag `filters`, endpoint run, error tracking). Do not guess a shape.
- Panel checks: `yarn test`, `yarn typecheck` (compare the error count with `main` before the task, not with 0). Backend checks: `npx jest <file>`, `npm run typecheck` if it exists, else `npx tsc --noEmit`.
- Commit each task to `main` with only the files of the task. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **PostHog is down or slow.** A request that takes more than 10 s or fails gives `502 POSTHOG_UNAVAILABLE` with no PostHog body; the page shows an error state, not a crash. Test in Task 2.
2. **The key is not set** (a local `.env.local` without it). Each PostHog route answers `503 POSTHOG_NOT_CONFIGURED`, and the page says "PostHog is not set up". Test in Task 2.
3. **Two admins edit one flag.** The second save gets `409 FLAG_CHANGED` and the "This flag changed since you opened it" message, not a silent overwrite. Test in Task 4.
4. **Bad form input**: variants that do not add to 100, a rollout outside 0–100, a payload that is not JSON, a key with capitals or spaces. The form blocks save and names the field. Tests in Task 3.
5. **A crafted analytics request**: a metric name not in the list, or a range not 7/30/90. The route answers 400 and calls nothing. Test in Task 6.

---

### Task 1: Backend permissions and the flag audit route (real-stay-backend)

**Files:**
- Modify: `~/DEV/real-stay-backend/src/constants/rbac.perms.ts` (the six permissions)
- Create: `~/DEV/real-stay-backend/src/features/auditlogs/feature-flag-audit.schema.ts`
- Modify: `~/DEV/real-stay-backend/src/features/auditlogs/auditlogs.controller.ts`
- Modify: `~/DEV/real-stay-backend/src/features/auth/guards/admin-user.guard.spec.ts`
- Test: `~/DEV/real-stay-backend/src/features/auditlogs/feature-flag-audit.schema.spec.ts`
- Modify: `~/DEV/real-stay-backend/CLAUDE.md` (the route and the permission map, "Roles and permissions")

**Interfaces:**
- Produces: `POST /audit-logs/feature-flag`, body `{ action: "created" | "updated" | "deleted", flagId: number, key: string, description: string }`, answers `{ data: { id: string } }` (201). It writes `action: "feature_flag.<action>"`, `description`, `tags: [String(flagId), key]`, and the name of the admin, as `reports.service.ts` does.

- [ ] **Step 1: Write the failing schema test** `feature-flag-audit.schema.spec.ts`:
  - accepts `{ action: "updated", flagId: 370262, key: "hotel-rooms", description: "Turned on hotel-rooms" }`;
  - refuses `action: "renamed"`, `flagId: 0`, `flagId: "1"`, `key: ""`, a key of 401 characters, `description: ""`, a description of 2001 characters.
- [ ] **Step 2: Run** `npx jest src/features/auditlogs/feature-flag-audit.schema.spec.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Add `FeatureFlagAuditBodySchema` (zod) and `type FeatureFlagAuditBody`** in `feature-flag-audit.schema.ts` with the limits above (`key` and `description` trimmed).
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Add the six permissions** to `rbac.perms.ts`.
- [ ] **Step 6: Add the guard expectation** to `admin-user.guard.spec.ts`: `[AuditLogsController, 'createFeatureFlagLog', ['feature-flags:actions']]`. Run `npx jest src/features/auth/guards/admin-user.guard.spec.ts`. Expected: FAIL.
- [ ] **Step 7: Add `createFeatureFlagLog(body, req)`** to `AuditLogsController`: `@Post('feature-flag')`, `@RequirePermission('feature-flags:actions')` (the method decorator must win over the class `audit-logs:view`; check that `PermissionGuard` reads the handler first), `ZodValidationPipe(FeatureFlagAuditBodySchema)`. Read the admin's `first_name`/`last_name` from the user record, as `reports.service.ts:233` does.
- [ ] **Step 8: Run** the guard spec and `npx jest src/features/rbac`. Expected: PASS.
- [ ] **Step 9: Update the backend `CLAUDE.md`** (permission list and map: `POST /audit-logs/feature-flag` `feature-flags:actions`).
- [ ] **Step 10: Commit** in the backend repo: `feat(audit): POST /audit-logs/feature-flag and the flag and analytics permissions`. Do not deploy; the owner approves each deploy.

---

### Task 2: PostHog server client and the permission check (panel)

**Files:**
- Modify: `src/app/configs/rbac.perms.ts` (copy of Task 1 list)
- Create: `src/server/posthog-errors.ts` (pure, no `server-only`, so vitest can import it)
- Create: `src/server/posthog.ts` (`import "server-only"`)
- Create: `src/server/require-permission.ts` (`import "server-only"`)
- Create: `src/server/permission-decision.ts` (pure)
- Test: `src/server/posthog-errors.test.ts`, `src/server/permission-decision.test.ts`

**Interfaces:**
- Produces:
  - `type PosthogError = { status: number; code: "POSTHOG_NOT_CONFIGURED" | "POSTHOG_UNAVAILABLE" | "FLAG_CHANGED" | "NOT_FOUND" | "BAD_REQUEST" | "POSTHOG_ERROR"; message: string }`
  - `toPosthogError(status: number, body: unknown): PosthogError` — maps 409 → `FLAG_CHANGED`, 404 → `NOT_FOUND`, 400 → `BAD_REQUEST` (message from PostHog `detail` only when it has no `phx_` text), 5xx → `POSTHOG_UNAVAILABLE` (502), else `POSTHOG_ERROR` (502).
  - `posthogFetch<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<{ ok: true; data: T } | { ok: false; error: PosthogError }>` — `path` is relative to `/api/projects/<POSTHOG_PROJECT_ID>`; 10 s timeout (`AbortSignal.timeout(10_000)`); no key → `{ status: 503, code: "POSTHOG_NOT_CONFIGURED" }`; network error or timeout → `POSTHOG_UNAVAILABLE`.
  - `permissionDecision(me: { status: number; permissions?: string[] }, permission: Permission): "allow" | "deny" | "signed-out"` — 404 → `allow` (old backend), 401 → `signed-out`, 200 with the permission or with `superadmin` rights → `allow`, else `deny`.
  - `requirePermission(request: NextRequest, permission: Permission): Promise<{ ok: true; accessToken: string; newTokens: SessionTokens | null } | { ok: false; response: NextResponse }>` — checks `Origin` for non-GET, calls `<BASE_URL>/rbac/me` with the refresh rules of `src/app/api/backend/[...path]/route.ts` (move the shared token and refresh code there into a helper in `src/server/session.ts`; the proxy keeps its behavior). Deny → `403 { code: "MISSING_PERMISSION", permission }`, the same body as the backend, so the listener in `store.ts` reloads `/rbac/me`.
  - `withSession(response: NextResponse, newTokens: SessionTokens | null): NextResponse` — writes refreshed tokens on the response.

- [ ] **Step 1: Write the failing tests.** `posthog-errors.test.ts`: the five mappings; a 400 body `{ detail: "Bad key phx_abc123" }` gives a message with no `phx_`; a body that is a string, `null`, or HTML gives a generic message. `permission-decision.test.ts`: the four cases above, and the shape of `/rbac/me` that `src/lib/permissions.ts` reads (copy its `MyPermissions` type).
- [ ] **Step 2: Run** `yarn test src/server`. Expected: FAIL.
- [ ] **Step 3: Implement** `posthog-errors.ts` and `permission-decision.ts`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Implement** `posthog.ts`, `require-permission.ts`, and the session helper. Copy the permission list from the backend.
- [ ] **Step 6: Run** `yarn test` and `yarn typecheck`. Expected: tests PASS; no new type errors.
- [ ] **Step 7: Commit** `feat(posthog): server client and permission check for PostHog routes`.

---

### Task 3: Flag rules (pure)

**Files:**
- Create: `src/lib/app-flags.ts` — `export const APP_FLAG_KEYS = ["hotel-rooms", "listing-verification", "typesense-search"] as const;` with a comment: a copy of the keys of `FEATURE_FLAGS` in realstay-prod `src/features/analytics/feature-flags.ts`; change both together.
- Create: `src/lib/feature-flag-rules.ts`
- Test: `src/lib/feature-flag-rules.test.ts`

**Interfaces:**
- Produces (types, exact names):
  - `type FlagFilter = { kind: "person"; key: string; operator: FlagOperator; value: string } | { kind: "cohort"; cohortId: number }`
  - `type FlagOperator = "exact" | "is_not" | "icontains" | "is_set" | "is_not_set" | "gt" | "lt" | "regex"`
  - `type FlagCondition = { filters: FlagFilter[]; rollout: number; variant: string | null }`
  - `type FlagVariant = { key: string; name: string; rollout: number }`
  - `type FlagForm = { key: string; name: string; active: boolean; type: "boolean" | "multivariate"; variants: FlagVariant[]; payloads: Record<string, string>; conditions: FlagCondition[] }`
  - `type PosthogFlag` — the fields of a PostHog flag that the panel reads: `id`, `key`, `name`, `active`, `filters`, `version?`, `last_called_at`, `updated_at`, `deleted`, and the fields that show ownership by an experiment or a survey (read the docs).
  - `formFromFlag(flag: PosthogFlag): FlagForm`, `flagBodyFromForm(form: FlagForm): { key; name; active; filters }` (PostHog `filters` shape from the docs).
  - `validateFlagForm(form: FlagForm): Record<string, string>` — field path → message; `{}` when valid.
  - `rolloutSummary(flag: PosthogFlag): string` — `"Off"`, `"Nobody"` (no condition), `"20% of all users"` (one condition, no filters), `"2 conditions"`, `"3 variants"` (multivariate wins).
  - `isAppFlag(key: string): boolean`
  - `isReadOnlyFlag(flag: PosthogFlag): boolean` — owned by an experiment or a survey.
  - `describeFlagChange(before: FlagForm | null, after: FlagForm | null): string` — the audit text: created, deleted, on/off, key, name, rollout changes, "conditions changed", "variants changed", "payload changed"; at most 2000 characters.

- [ ] **Step 1: Write the failing tests:**
  - `validateFlagForm`: key `"Hotel Rooms"` → `{ key: "Use lowercase letters, digits, - and _" }`; variants 50 + 40 → `{ variants: "The variants must add up to 100%" }`; rollout `101` and `-1` → `{ "conditions.0.rollout": "Use 0 to 100" }`; payload `"{bad"` → `{ "payloads.true": "This is not valid JSON" }`; a valid form → `{}`.
  - Round trip: `formFromFlag(f)` then `flagBodyFromForm` gives the same `filters` for a boolean flag with one condition at 20%, a flag with a `role` = `host` filter, a cohort filter, and a multivariate flag with a payload per variant.
  - `rolloutSummary`: the five cases above.
  - `isAppFlag("hotel-rooms")` true, `isAppFlag("new-thing")` false.
  - `describeFlagChange(null, form)` starts with `"Created"`; on → off gives `"Turned off hotel-rooms"`; 20 → 50 gives text with `"20% → 50%"`; a 3000-character change is cut to 2000.
- [ ] **Step 2: Run** `yarn test src/lib/feature-flag-rules.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `feature-flag-rules.ts` and `app-flags.ts`.
- [ ] **Step 4: Run** the tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat(flags): pure rules of the flag form`.

---

### Task 4: Flag routes, audit write, and the RTK Query API

**Files:**
- Create: `src/app/api/posthog/flags/route.ts` (GET list, POST create)
- Create: `src/app/api/posthog/flags/[id]/route.ts` (GET, PATCH, DELETE)
- Create: `src/app/api/posthog/cohorts/route.ts` (GET)
- Create: `src/server/flag-audit.ts` — `writeFlagAudit(accessToken: string, entry: { action: "created" | "updated" | "deleted"; flagId: number; key: string; description: string }): Promise<boolean>`
- Create: `src/app/endpoints/posthog/posthog-api-slice.ts`
- Modify: `src/app/store/store.ts` (add the reducer and middleware)
- Test: `src/server/flag-route-rules.test.ts` with pure helpers in `src/server/flag-route-rules.ts`

**Interfaces:**
- Consumes: `requirePermission`, `withSession`, `posthogFetch` (Task 2); `flagBodyFromForm`, `formFromFlag`, `describeFlagChange`, `validateFlagForm`, `PosthogFlag`, `FlagForm` (Task 3).
- Produces:
  - Routes: `GET /api/posthog/flags?search=&active=` (`feature-flags:view`) → `{ data: PosthogFlag[] }`; `GET /api/posthog/flags/:id` (`feature-flags:details`) → `{ data: PosthogFlag }`; `POST` and `PATCH` (`feature-flags:actions`) take `{ form: FlagForm, version?: number }` → `{ data: PosthogFlag, auditFailed: boolean }`; `DELETE` → `{ data: { id }, auditFailed: boolean }` (PostHog `PATCH { deleted: true }`); `GET /api/posthog/cohorts` (`feature-flags:details`) → `{ data: { id: number; name: string }[] }`.
  - Server-side validation: POST/PATCH run `validateFlagForm`; errors → `400 { code: "INVALID_FLAG", fields }`.
  - Errors: `{ code, message }` with the status from `PosthogError`.
  - `posthogApi` (`createApi`, `reducerPath: "posthog"`, `baseQuery: axiosBaseQuery({ baseURL: "/api/posthog" }, AxiosInstance)`, `tagTypes: ["Flag", "Analytics"]`, `keepUnusedDataFor: 300`, `refetchOnMountOrArgChange: 10`) with hooks `useGetFlagsQuery({ search?, active? })`, `useGetFlagQuery(id)`, `useCreateFlagMutation`, `useUpdateFlagMutation`, `useDeleteFlagMutation`, `useGetCohortsQuery()`. Mutations invalidate `Flag`.
  - `flagsArgs = (f: { search?: string; active?: "true" | "false" }) => f` in `src/lib/page-queries.ts`.
- `flag-route-rules.ts`: `parseFlagId(raw: string): number | null`, `flagListQuery(search: string | null, active: string | null): string` (only `true`/`false` pass for `active`; search trimmed to 100 characters).

- [ ] **Step 1: Write the failing tests:** `parseFlagId("370262")` → `370262`; `"0"`, `"-1"`, `"abc"`, `"1.5"` → `null`. `flagListQuery("hotel", "true")` contains `search=hotel` and `active=true`; `active: "STALE"` is dropped. Review Focus 3: a PATCH helper `versionConflict(error: PosthogError): boolean` is true for code `FLAG_CHANGED`.
- [ ] **Step 2: Run** `yarn test src/server/flag-route-rules.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the helpers, the routes, `writeFlagAudit` (POST to `<BASE_URL>/audit-logs/feature-flag`; `false` on any failure, no throw), and the API slice. PATCH reads the flag first, refuses a read-only flag (`isReadOnlyFlag` → `400 READ_ONLY_FLAG`), sends `version` when PostHog supports it (check the docs; if it does not, compare `updated_at` from the client with the current flag and answer `409 FLAG_CHANGED` on a difference).
- [ ] **Step 4: Run** `yarn test` and `yarn typecheck`. Expected: PASS; no new type errors.
- [ ] **Step 5: Manual check** with a key in `.env.local` and `yarn dev`: `curl -b <cookies> localhost:3000/api/posthog/flags` returns the three flags. Without the key: `503 POSTHOG_NOT_CONFIGURED`.
- [ ] **Step 6: Commit** `feat(flags): PostHog flag routes with audit records`.

---

### Task 5: Feature flags pages

**Files:**
- Create: `src/app/(dashboard)/feature-flags/page.tsx` (list)
- Create: `src/app/(dashboard)/feature-flags/new/page.tsx`
- Create: `src/app/(dashboard)/feature-flags/[id]/page.tsx`
- Create: `src/app/(dashboard)/feature-flags/components/flag-form.tsx`, `condition-editor.tsx`, `variant-editor.tsx`, `delete-flag-dialog.tsx`, `posthog-error-state.tsx`
- Modify: `src/lib/dashboardMenu.ts` (`{ label: "Feature flags", icon: <pick from glyphs, e.g. "flag">, path: "/feature-flags", shortcut: "f" }` in `adminMenuItems`)
- Modify: `src/lib/permissions.ts` (`PAGE_PERMISSIONS`: `/feature-flags` `feature-flags:view`, `/feature-flags/new` `feature-flags:actions`, `/feature-flags/[id]` `feature-flags:details`)
- Modify: `src/lib/page-queries.ts` (`PREFETCH["/feature-flags"]` with `flagsArgs({})`)
- Test: `src/lib/permissions.test.ts` (add the three paths to `pagePermissionOf` cases)

**Interfaces:**
- Consumes: the hooks of Task 4, the rules of Task 3, `useGuardedAction`, `AdminTable`, `PageHeader`, `SearchInput`, `FilterMenu`, `StatusChip`, `waitsForData`.

- [ ] **Step 1: Write the failing test:** `pagePermissionOf("/feature-flags/new")` → `feature-flags:actions` (the fixed segment wins over `[id]`); `/feature-flags/370262` → `feature-flags:details`.
- [ ] **Step 2: Run** `yarn test src/lib/permissions.test.ts`. Expected: FAIL.
- [ ] **Step 3: Add** the `PAGE_PERMISSIONS`, menu, and prefetch entries. Run the test. Expected: PASS.
- [ ] **Step 4: Build the list page:** columns key, name, status chip (On / Off), `rolloutSummary`, "Used by the app" chip, last called (`formatDate`, "Never"), updated. Search and On/Off/All filter. "New flag" button (guarded). Row click opens `/feature-flags/:id`.
- [ ] **Step 5: Build the form** as the spec says ("Flag form"). Show `validateFlagForm` errors under each field. Exact copy:
  - no condition: "This flag is on for nobody. Add a condition."
  - key change confirm on an app flag: "The app reads this key. After the change, the app uses its default value for all users."
  - conflict: "This flag changed since you opened it." with "Reload".
  - audit warning toast: "The change is saved, but the audit log has no record of it."
  - read-only: "An experiment or a survey owns this flag." with "Edit this flag in PostHog" (`https://eu.posthog.com/project/339639/feature-flags/<id>`).
  - delete of an app flag: the admin types the key; text "The app reads this flag. After the delete, the app uses its default value for all users."
  - not configured (503): "PostHog is not set up."
- [ ] **Step 6: Check in the browser** (`yarn dev`, Claude in Chrome): list, open `hotel-rooms`, change nothing, save → no error; make a test flag `admin-panel-test`, add a `role` = `host` condition at 10%, save, change to 20%, delete it. Check the audit log page shows three records. Check light and dark mode, and phone width.
- [ ] **Step 7: Run** `yarn test` and `yarn typecheck`. Expected: PASS; no new type errors.
- [ ] **Step 8: Commit** `feat(flags): feature flags pages`.

---

### Task 6: PostHog endpoints and the analytics route

**Files:**
- Create: `tools/posthog-endpoints/*.json` — one query per metric: `admin-active-users`, `admin-signups`, `admin-booking-funnel`, `admin-payments`, `admin-hosts`, `admin-errors`. Each takes the variable `days`.
- Create: `tools/posthog-endpoints.mjs` — makes or updates each endpoint from its file (reads `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID` from the environment; prints the names only).
- Create: `src/lib/analytics-metrics.ts` (pure)
- Create: `src/app/api/posthog/analytics/[metric]/route.ts`
- Modify: `src/app/endpoints/posthog/posthog-api-slice.ts` (`useGetMetricQuery({ metric, days })`)
- Test: `src/lib/analytics-metrics.test.ts`

**Interfaces:**
- Produces:
  - `ANALYTICS_METRICS = ["active-users", "signups", "booking-funnel", "payments", "hosts", "errors"] as const`; `type AnalyticsMetric`.
  - `RANGES = [7, 30, 90] as const`; `DEFAULT_RANGE = 30`.
  - `parseMetricRequest(metric: string, days: string | null): { metric: AnalyticsMetric; days: 7 | 30 | 90 } | null` — `days` null → 30.
  - `endpointNameOf(metric: AnalyticsMetric): string` → `admin-<metric>`.
  - Route `GET /api/posthog/analytics/:metric?days=30` (`product-analytics:view`) → `{ data: <endpoint result> }`, cached 300 s per metric and range; bad request → `400 { code: "BAD_METRIC" }` before any PostHog call.
- Before you write the queries, confirm each event and property in PostHog (`read-data-schema`): `signed_up`, `search_performed`, `listing_viewed`, `booking_started`, `booking_requested`, `payment_started`, `payment_succeeded` (and its amount property), `payment_failed`, `payment_cancelled`, `listing_published`, `host_booking_decided` (`decision`), person property `role`. If one is missing, say so in the task report; do not invent one.
- Confirm that PostHog endpoints exist for the project. If not, the route sends the same query files to the query API (spec, "Calls I made").

- [ ] **Step 1: Write the failing test** (Review Focus 5): `parseMetricRequest("signups", "7")` → `{ metric: "signups", days: 7 }`; `("signups", null)` → days 30; `("signups", "14")`, `("signups", "7; drop")`, `("users", "7")`, `("../flags", "7")` → `null`. `endpointNameOf("booking-funnel")` → `"admin-booking-funnel"`.
- [ ] **Step 2: Run** `yarn test src/lib/analytics-metrics.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `analytics-metrics.ts`. Run the test. Expected: PASS.
- [ ] **Step 4: Write the query files and the script.** Run `node tools/posthog-endpoints.mjs` with the key. Expected: six names printed, and six endpoints in PostHog.
- [ ] **Step 5: Implement** the route and the slice hook.
- [ ] **Step 6: Run** `yarn test` and `yarn typecheck`; `curl` `/api/posthog/analytics/active-users?days=7` returns data, `?days=14` returns 400.
- [ ] **Step 7: Commit** `feat(analytics): PostHog endpoints and the analytics route`.

---

### Task 7: Analytics page

**Files:**
- Create: `src/app/(dashboard)/analytics/page.tsx`
- Create: `src/app/(dashboard)/analytics/components/` — one component per section: `active-users-section.tsx`, `signups-section.tsx`, `funnel-section.tsx`, `payments-section.tsx`, `hosts-section.tsx`, `errors-section.tsx`
- Modify: `src/lib/dashboardMenu.ts` (`{ label: "Analytics", icon: <pick, e.g. "stats-chart">, path: "/analytics", shortcut: "y" }` in `menuItems`, after Dashboard)
- Modify: `src/lib/permissions.ts` (`/analytics` `product-analytics:view`), `src/lib/page-queries.ts` (`PREFETCH["/analytics"]`: the six metrics at `DEFAULT_RANGE`)
- Test: `src/lib/permissions.test.ts` (`/analytics` case)

**Interfaces:**
- Consumes: `useGetMetricQuery`, `RANGES`, `DEFAULT_RANGE` (Task 6); `StatCards`, `SegmentTabs` (range picker), `PageHeader`, the Chart.js wrapper in `src/app/(dashboard)/dashboard/components/Chart.tsx`, `formatNaira`, `NAIRA_FORMAT`, `toAmount`, `waitsForData`.

- [ ] **Step 1: Write the failing test** for `pagePermissionOf("/analytics")`. Run. Expected: FAIL. Add the entry. Expected: PASS.
- [ ] **Step 2: Build the page:** the range picker (7 / 30 / 90 days), the six sections of the spec in its order, each with its own loading skeleton and error state (`posthog-error-state.tsx` from Task 5). A line under the header: "Numbers come from preview and production builds of the app. Development builds send nothing."
- [ ] **Step 3: Check in the browser:** all six sections show data or an empty state; change the range; light and dark mode; phone width.
- [ ] **Step 4: Run** `yarn test` and `yarn typecheck`. Expected: PASS; no new type errors.
- [ ] **Step 5: Commit** `feat(analytics): analytics page`.

---

### Task 8: Documentation and final checks

**Files:**
- Modify: `CLAUDE.md` (panel): a "PostHog" section — env names, server routes, `requirePermission`, the endpoints script, `APP_FLAG_KEYS` copy rule, the audit route, "deploy the backend first".
- Modify: realstay-prod `CLAUDE.md` (Analytics section): one line — "Change `APP_FLAG_KEYS` in the admin panel (`src/lib/app-flags.ts`) when you add or remove a key in `FEATURE_FLAGS`." Commit it in realstay-prod with only that file.

- [ ] **Step 1: Write the docs.**
- [ ] **Step 2: Run** `yarn test`, `yarn typecheck`, `yarn build` in the panel. Expected: PASS; the build has no new warning about a server module in a client bundle.
- [ ] **Step 3: Check** that no client chunk has the key: `grep -r "POSTHOG_PERSONAL_API_KEY\|phx_" .next/static` gives no result.
- [ ] **Step 4: Commit** `docs(posthog): flags and analytics in CLAUDE.md` (panel) and `docs(claude): keep the admin flag list in sync` (app).
- [ ] **Step 5: Report** to the owner: the deploy order (backend, then `node tools/posthog-endpoints.mjs`, then the Vercel env and the panel deploy), and that each deploy needs their approval.
