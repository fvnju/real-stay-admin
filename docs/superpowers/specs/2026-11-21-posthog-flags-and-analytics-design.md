# PostHog feature flags and analytics in the admin panel

Date: 2026-11-21. Status: draft, for approval.

## Intent

RealStay staff must control the PostHog feature flags of the mobile app and see the important product numbers without a PostHog account. Today only the owner can do this, in PostHog. The panel already has roles, so the owner can give this work to staff and limit who can change a flag.

## Goals

1. A **Feature flags** page: full control of the flags of the PostHog project "Realstay" (ID 339639, EU Cloud).
   - List the flags with the key, the name, on/off, the rollout summary, and the last call.
   - Make a flag, edit all of it, and delete it.
2. An **Analytics** page with the important numbers that PostHog tracks for the app.
3. Each flag change writes a record in the backend audit log, with the staff member who made it.
4. The PostHog personal API key never goes to the browser.

## Non-goals

- Experiments, surveys, session replays, and PostHog dashboards. Staff open PostHog for these.
- Make or edit cohorts. A release condition can use a cohort that exists.
- Analytics that the owner can change from the panel (custom charts). The set of numbers is fixed in code.
- Old flags of other projects. The panel works on one project.

## Anti-goals (a failure even if it works)

- The personal API key reaches the browser, the logs, or an error message.
- A flag changes and the audit log has no record, with no warning to the staff member.
- A staff member deletes a flag that the app reads, or changes its key, with no warning. The app then uses its default value for all users.
- The Analytics page sends a heavy query to PostHog on each page view and makes the PostHog bill grow.

## Constraints

- Next.js 15 App Router, HeroUI v3, RTK Query, and the rules in `CLAUDE.md` (session cookies, proxy, `PAGE_PERMISSIONS`, `useGuardedAction`, `@/components/admin` parts, `waitsForData`, prefetch).
- `src/app/configs/rbac.perms.ts` is a copy of the backend list. A new permission changes both repos.
- The owner said: do not hide a page or a button for a permission. `PagePermissionGate` and `useGuardedAction` handle this.
- The app reads the flags in `realstay-prod/src/features/analytics/feature-flags.ts` (`FEATURE_FLAGS`). At this date PostHog has `hotel-rooms`, `listing-verification`, and `typesense-search`.
- PostHog asks that code does not call `/api/projects/:id/query/` for fixed numbers. Fixed queries go in PostHog **endpoints** (saved queries with a run URL).
- Minimal animations (owner rule). Charts use Chart.js, which the panel uses now.

## Approaches

| | How | Trade-offs |
|---|---|---|
| **A (picked)** | Next.js server routes in the panel call PostHog with the personal API key from the Vercel environment. A flag change also writes a record to the backend audit log. | One main repo, fast to build, the pages look like the rest of the panel. PostHog records the change as the owner of the key, so the backend audit log is the record of who did it. |
| B | The backend calls PostHog; the panel calls the backend. | The backend checks permissions and writes the audit log as for other actions. But two repos and a backend deploy for each new chart. |
| C | Embed shared PostHog dashboards (iframe). | Public links, no roles, no flag control. Rejected. |

The owner picked A. The owner picked **full control** of the flags (make, edit all fields, delete) over on/off with rollout only.

## Design

### Environment (Vercel, server only)

- `POSTHOG_PERSONAL_API_KEY`: a personal API key with the scopes `feature_flag:read`, `feature_flag:write`, `cohort:read`, `endpoint:read`, `query:read`, `error_tracking:read`. No `NEXT_PUBLIC_` prefix.
- `POSTHOG_HOST=https://eu.posthog.com`, `POSTHOG_PROJECT_ID=339639`.
- Add the names (no values) to `.env.example`.

### Server code

- `src/server/posthog.ts` (`server-only`): one `posthogFetch(path, init)` that adds the key and the host. It never returns the key or the raw PostHog error body to the client; it maps errors to `{ status, code, message }`.
- `src/server/require-permission.ts`: reads the session cookies, calls backend `GET /rbac/me` (with the same refresh rules as the proxy), and answers 401 or `403 MISSING_PERMISSION` with the same body as the backend. On a backend without `/rbac/me` (404), nothing is blocked, as in the panel. A route that is not GET also checks the `Origin` header, as the proxy does.
- Routes under `src/app/api/posthog/`:
  - `GET flags` (`feature-flags:view`): the list. `GET flags/[id]` (`feature-flags:details`): one flag with its full `filters`.
  - `POST flags`, `PATCH flags/[id]`, `DELETE flags/[id]` (`feature-flags:actions`). Delete is the soft delete of PostHog (`deleted: true`), so the owner can restore it in PostHog.
  - `GET cohorts` (`feature-flags:details`): id and name, for the condition form.
  - `GET analytics/[metric]` (`product-analytics:view`): runs one PostHog endpoint with the date range. The route only accepts metric names from a fixed list.
- After each flag write that succeeds, the route sends `POST /audit-logs/feature-flag` to the backend with the token of the staff member: the action (`created`, `updated`, `deleted`), the flag id and key, and a text that describes the change ("Turned on hotel-rooms; rollout 20% → 50%"). The audit log schema has no field for the full flag, so the text is the record. If the audit write fails, the change stays and the response has `auditFailed: true`; the page shows a warning toast "The change is saved, but the audit log has no record of it."

### Backend change (real-stay-backend)

- Add to `src/constants/rbac.perms.ts`: `feature-flags:view|details|actions` and `product-analytics:view|details|actions`. Copy the list to the panel.
- Add `POST /audit-logs/feature-flag`, guarded by `feature-flags:actions`. It writes one audit log with the user from the token: `action` `feature_flag.<action>`, the `description` from the body, and `tags` `[flagId, key]`. The body is checked (`action` in the three values, `flagId` a positive number, `key` 1 to 400 characters, `description` 1 to 2000 characters).
- Add a test of the guard to `admin-user.guard.spec.ts`, and the routes to the backend `CLAUDE.md`.
- Deploy the backend before the panel. On an old backend the audit write fails, and the page shows the warning above.

### Feature flags page (`/feature-flags`, menu "Feature flags", shortcut "g f")

- Table (`AdminTable`): key, name, a status chip (On / Off), the rollout summary ("20% of all users", "2 conditions", "3 variants"), "Used by the app" for a key in `APP_FLAG_KEYS`, last called, updated. A search box (key or name) and a filter (On / Off / All).
- `APP_FLAG_KEYS` (`src/lib/app-flags.ts`) is a copy of the keys of `FEATURE_FLAGS` in the app, as `glyphs.ts` is a copy. Change both together.
- "New flag" opens `/feature-flags/new`. A row opens `/feature-flags/[id]`.

### Flag form (`/feature-flags/new` and `/feature-flags/[id]`)

- **Key**: required, lowercase letters, digits, `-` and `_`. On an existing flag the key can change only after a confirm; the confirm says "The app reads this key" when it is in `APP_FLAG_KEYS`.
- **Name** (the description): optional text.
- **On / off** switch.
- **Type**: boolean or multivariate.
  - Multivariate: a list of variants (key, name, rollout %). The sum must be 100. "Split evenly" sets equal parts.
- **Payload** (optional JSON): one for `true`, or one for each variant. The form checks that it is valid JSON.
- **Release conditions**: a list of condition sets. Each set has:
  - zero or more filters: a person property (key from a text box with suggestions of `role`, `email`, `$app_version`, `$os`), an operator (equals, not equals, contains, is set, is not set, greater than, less than, regex), and the value; or a cohort (from `GET cohorts`);
  - a rollout % (0 to 100);
  - for a multivariate flag, an optional variant override.
  - A flag with no condition set is on for nobody; the form says so.
- **Save** sends the whole flag. If PostHog refuses because another person changed the flag first, the page shows "This flag changed since you opened it" and a "Reload" button.
- **Delete** (`/feature-flags/[id]` only): a dialog. For a key in `APP_FLAG_KEYS` the staff member must type the key to confirm, and the dialog says that the app then uses its default value.
- A flag that PostHog marks as owned by an experiment or a survey opens read-only, with "Edit this flag in PostHog" (a link).
- All buttons that change things use `useGuardedAction("feature-flags:actions", ...)`.

### Analytics page (`/analytics`, menu "Analytics", shortcut "g y")

- A range picker: 7, 30, or 90 days (30 by default).
- Numbers and charts, each from one PostHog endpoint:
  1. **Active users**: DAU, WAU, MAU as stat cards, and a DAU line chart with guests and hosts apart (person property `role`).
  2. **Sign-ups**: `signed_up` each day, guests and hosts apart.
  3. **Booking funnel**: `search_performed` → `listing_viewed` → `booking_started` → `booking_requested` → `payment_succeeded`, with the count and the drop at each step.
  4. **Payments**: `payment_started`, `payment_succeeded`, `payment_failed`, `payment_cancelled` counts, and the naira total of `payment_succeeded` (`formatNaira`).
  5. **Hosts**: `listing_published`, and `host_booking_decided` by `decision`.
  6. **Errors**: the count of new error tracking issues in the range, and the top 5 by occurrences (name and count only).
- Development builds send nothing to PostHog, so the numbers are of preview and production builds only. The page says so in a short line.
- The route keeps each result for 5 minutes (`revalidate: 300`, keyed by metric and range). The page loads each metric apart, so one slow query does not block the others.

### PostHog endpoints

- `tools/posthog-endpoints.mjs` makes or updates the endpoints in PostHog from query definitions in the repo (`tools/posthog-endpoints/*.json`), so the queries are in git. Endpoint names start with `admin-` (for example `admin-active-users`). The range is an endpoint variable.
- Run it once before the deploy, and again after a change of a query.

### Permissions and navigation

- `PAGE_PERMISSIONS`: `/feature-flags` `feature-flags:view`, `/feature-flags/new` `feature-flags:actions`, `/feature-flags/[id]` `feature-flags:details`, `/analytics` `product-analytics:view`.
- Add both pages to `menuItems`, to `PREFETCH` (`src/lib/page-queries.ts`), and to the command palette.
- RTK Query slice `src/app/endpoints/posthog/posthog-api-slice.ts`. Its base URL is `/api/posthog`, not `/api/backend`, so it needs its own base query or a full URL.

### Tests (vitest)

- Pure rules in `src/lib/feature-flag-rules.ts`: form → PostHog `filters` and back, variant sum, key check, JSON payload check, the rollout summary text, "used by the app".
- `require-permission` and the error mapping of `posthog.ts` (no key in an error).
- The metric-name allow list of the analytics route.

## Left to the builder

- The exact PostHog request shapes (flag `filters`, endpoint run). Read the PostHog API docs; do not guess.
- The chart layout and the empty and error states, from the parts in `@/components/admin`.
- The exact copy of the dialogs and the toasts, within the meaning above.

## Calls I made (not decided by the owner)

- The permission areas `feature-flags` and `product-analytics`, with the usual three levels.
- Soft delete, so a deleted flag can come back in PostHog.
- The "Used by the app" mark from a copy of the app keys.
- Fixed queries as PostHog endpoints, made from files in the repo by a script.
- The set of numbers on the Analytics page, and a cache of 5 minutes.
- A failed audit write does not undo the flag change; the page warns.
- Analytics is a new page beside the Dashboard; the Dashboard keeps its backend numbers.
- Only `superadmin` gets the new permissions at first. The owner gives them to other roles on the Roles tab.
- The owner makes the personal API key in PostHog and puts it in Vercel. The builder does not make keys.
- If PostHog endpoints are not available on the plan of the project, the analytics route sends the same fixed queries to the query API, from the same files. The builder checks this first.
