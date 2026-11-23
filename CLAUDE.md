# real-stay-admin

The admin panel of RealStay, for RealStay staff (Next.js 15 App Router, React 19, HeroUI v3, Tailwind v4, Redux Toolkit Query).

GitHub: https://github.com/fvnju/real-stay-admin (`origin`). It is a fork of https://github.com/chijiooke/real-stay-admin (`upstream`). Deployed at https://real-stay-admin.vercel.app.

## Related folders

| Folder | GitHub | What it is |
| --- | --- | --- |
| `~/DEV/real-stay-admin` (this repo) | https://github.com/fvnju/real-stay-admin | The admin panel. |
| `~/DEV/realstay-prod` | https://github.com/fvnju/realstay-prod | The Expo mobile app. |
| `~/DEV/real-stay-backend` | https://github.com/fvnju/real-stay-backend | The NestJS backend on Heroku, https://real-stay-backend-3c90072b0570.herokuapp.com. This panel calls it. Its `CLAUDE.md` has the deploy steps and the admin routes. |
| `~/DEV/real-stay` | https://github.com/chijiooke/real-stay | Upstream repo of the backend. |
| `~/DEV/real-stay-proxies` | (not a repo) | Three old Cloudflare Workers. Turned off on 2026-11-18. This panel does not use them. |

## Why the fork

Upstream keeps the access token and the refresh token in `localStorage`, so an XSS attack can read them. This fork keeps them in httpOnly cookies. Do not add `localStorage` or `sessionStorage` for a token, a user ID, or other session data. When you take code from upstream, remove its `localStorage` code.

## Session

- Better Auth client SDK (`src/lib/auth-client.ts`, `createAuthClient` from `better-auth/react` with `emailOTPClient` and `inferAdditionalFields`) points to this app's same-origin proxy at `/api/auth/*` (`src/app/api/auth/[...all]/route.ts`, allowlist & helpers in `src/server/better-auth-proxy.ts`).
- `src/server/session.ts` (server only) manages the httpOnly cookies (`ba_session_token` 7 days for Better Auth sessions, `user` `{ id, email, user_type }`, plus legacy `access_token` / `refresh_token` fallback for existing sessions and `/api/auth/accept-invite`). All session cookies are httpOnly, `SameSite=Lax`, and `Secure` in production. The proxy strips `token` / `session.token` and never forwards `set-auth-token` to the browser.
- Sign-in (`/sign-in`) calls `authClient.signIn.email`; the proxy checks `userType === "admin"` (non-admins have their session revoked immediately and receive 403). Sign-out (`logout()` in `src/lib/dashboardMenu.ts`) calls `authClient.signOut()`, revoking the Postgres session and clearing all cookies.
- `access_expires` (not httpOnly) holds only a timestamp so `src/app/store/refresh-gate.ts` serializes parallel requests only when a legacy 15-minute access token may have expired (for Better Auth sessions it is set 7 days ahead so parallel requests never wait).
- `src/middleware.ts`: a page needs `ba_session_token` or `refresh_token`, else it goes to `/sign-in`. The public pages are `/`, `/sign-in`, `/forgot-password`, `/accept-invite`, and `/request-access`. `/logout` clears the cookies.
- The dashboard layout (a server component) reads the `user` cookie and gives it to the pages with `useSessionUser()` (`src/app/providers/session-user.tsx`).
- Deploy order: deploy `real-stay-backend` with Better Auth (`/api/auth/*`) before deploying this panel.

## Backend calls

- The pages call the backend through the proxy route `src/app/api/backend/[...path]/route.ts`: `/api/backend/users` goes to `<NEXT_PUBLIC_BASE_URL>/users`. The proxy adds `Authorization: Bearer <access_token>` from the cookie.
- When the access cookie is missing, or the backend answers 401, the proxy refreshes once (`POST /auth/refresh`) and tries again. The backend rotates the refresh token and keeps only the newest one, so `refreshTokens` shares one refresh for each refresh token in the server process. If the refresh fails, the proxy clears the cookies and answers 401. The axios instance (`src/app/store/httpConfig.ts`) then opens `/sign-in`.
- The proxy refuses a request that is not GET when the `Origin` header is not the origin of the panel.
- The endpoints are RTK Query slices in `src/app/endpoints/*/*-api-slice.ts`. Their `url` is the backend path without a base URL (`url: "/users"`). The axios base URL is `/api/backend`.
- Env: `NEXT_PUBLIC_BASE_URL` is the backend URL (`.env.example`).
- The backend response interceptor puts `pagination` at the top of the body: `{ data, success, pagination }`, not in `data`. Read the total of a list with `totalItems(res)` (`@/components/admin`).

## UI, theme, and icons

- New UI uses HeroUI v3 (`@heroui/react`, `@heroui/styles`), the web version of `heroui-native` in the mobile app. The theme is the HeroUI default theme, the same as the app: the same colors (`bg-background`, `bg-surface`, `text-muted`, `bg-accent`, ...), radius, and font (Inter, `src/app/layout.tsx`). `src/app/globals.css` has the Tailwind v4 setup and the old breakpoints (`sm` 900, `md` 1150, `lg` 1458).
- A HeroUI component runs only in a client component (`"use client"`).
- Light and dark mode: `next-themes` sets the `light` or `dark` class on `<html>` (`src/app/providers/theme-provider.tsx`). Light mode is the default; an admin can pick System or Dark. `ThemeSwitcher` (`src/components/theme-switcher.tsx`) is in the header and on the sign-in pages. Do not add a color that is right in one mode only (`text-white`, `bg-[#181818]`); use the HeroUI colors.
- Icons: `Icon` (`src/components/icon`) draws the icons of the mobile app, with the same names (`name="people"`, `"calendar-outline"`). `glyphs.ts` is a copy of realstay-prod `components/icon/glyphs.ts`; copy it again after a change there. Icons that the app does not have are in `admin-glyphs.ts`, made by `node tools/make-icons.mjs` from MingCute.
- Shared page parts are in `src/components/admin` (import from `@/components/admin`): `PageHeader`, `StatCards` (a number value rolls in with NumberFlow, `@number-flow/react`; give `format: NAIRA_FORMAT` and `toAmount(x)` for naira), `AdminTable` (a HeroUI table with loading rows, an empty state and row clicks), `TablePagination`, `SearchInput` (waits 400 ms), `FilterMenu`, `SegmentTabs`, `RowActions`, `StatusChip`, `DetailSection`, `CopyButton`, `UserCell`, `PhotoGallery`, `ReviewList`, and the formats (`formatNaira`, `formatDate`, `formatStayDate`). Build a new page from these.
- A stay date (check-in, checkout) is UTC midnight of the date: show it with `formatStayDate`, not `formatDate`.
- A HeroUI dialog or drawer that opens from state (no trigger inside it): put `isOpen` on `Modal.Backdrop` / `Drawer.Backdrop`, without the `Modal` / `Drawer` root, which expects a trigger.
- The frame of the dashboard is `src/components/dashboard/` (sidebar, header, account menu, mobile drawer, Cmd+K palette). The sign-in pages use `src/app/(auth)/components/`.

## Fast navigation

- The sidebar (`src/components/dashboard/nav-list.tsx`) loads each page in advance (`prefetch`), loads the data of a page when the pointer goes over its link (`prefetchPage`, `src/lib/page-queries.ts`), opens the page when the mouse button goes down, and marks the link as current at once (`useShownPath`).
- `src/components/dashboard/instant-nav.ts`: `useGo()` opens a page and loads its data; use it for a move to a page of the menu. `useGoShortcuts()` (in the shell): "g" then the `shortcut` of a menu item (`src/lib/dashboardMenu.ts`) opens the page, for example "g u" Users. The command palette shows the keys.
- `src/lib/page-queries.ts` builds the query arguments of the first view of each page (`usersArgs`, `PAGE_SIZE`, ...). The page and the prefetch must use the same function, else the prefetch fills a different cache entry. When you add a page to the menu, add its queries to `PREFETCH`.
- Show skeletons with `waitsForData(query)`, not `isFetching`: data from the cache shows at once, and a reload in the background does not hide it.
- RTK Query keeps data 5 minutes (`keepUnusedDataFor: 300`) and loads data older than 10 seconds again when a page opens (`storeConfigQuery.ts`). The router keeps a page 5 minutes (`staleTimes`, `next.config.mjs`).
- In `next dev`, a page compiles on its first visit and Next.js does not prefetch. Measure the speed with `next build` and `next start`.

## The bell (Needs attention)

- Admins get no push or in-app notifications. The bell of the header (`src/components/dashboard/attention-center.tsx`) opens a popover under it with the admin queues of the backend: open reports (`GET /v1/admin/reports?status=open`), papers to check (`/v1/admin/listing-verifications?status=submitted`), visits to do (`status=documents_approved`), verified listings to check again (`recheck=true`), open access requests (`/v1/admin/access-requests?status=open`), open join requests (`/v1/admin/join-requests?status=open`), and admin invites with no answer (`/analytics/admins`).
- A queue shows only when the role has its permission (`reports:view`, `verifications:view`, `admin-management:actions` for the access and join requests, `admin-management:view` for the invites), and only the queues shown count in the badge. It loads again each minute while the tab is in front, and when the popover opens. Each list shows the 5 oldest items; an item opens its page.
- The bell polls each minute only while the tab is visible (`skipPollingIfUnfocused`), and loads the counts at once when the tab shows again (`refetchOnFocus`). Both need `setupListeners(store.dispatch)` in `src/app/store/store.ts`.
- The calls are in `src/app/endpoints/attention/`. A v1 list answers `{ data: { data, total, page, limit } }`.
- A verification item opens `/verifications/[id]`.

## Roles and permissions

Design: `docs/superpowers/specs/2026-11-21-reports-and-roles-design.md`. The backend side is in the backend `CLAUDE.md` ("Roles and permissions").

- A role has permissions `<area>:<level>` (`view` opens the list page, `details` a detail page, `actions` changes things). `src/app/configs/rbac.perms.ts` is a copy of the backend list; change both together. The role `superadmin` has every permission.
- The permissions of the signed-in admin: `GET /rbac/me` (`rbacApi.useGetMyPermissionsQuery`, `useMyPermissions()`, `usePermission(p)` in `src/lib/use-permission.ts`). The pure rules are in `src/lib/permissions.ts` (`permissionStateOf`, `canGrant`, `withImpliedView`, `missingPermissionOf`, `PAGE_PERMISSIONS`). On a backend without `/rbac/me` (404) nothing is blocked.
- Do not hide a page or a button for a permission (the owner asked for this). `PagePermissionGate` in the shell shows `BlockedState` (a picture, "You do not have permission", the role and the missing permission, "Ask for access") in place of a page that the role cannot open, from the URL and `PAGE_PERMISSIONS`. A blocked page does not render, so it sends no requests. When you add a page, add it to `PAGE_PERMISSIONS`.
- An action: wrap its handler with `useGuardedAction()` (`guard("users:actions", handler)`). Without the permission, a click opens the "no permission" dialog; the button stays visible.
- A request that the backend refuses with `403 MISSING_PERMISSION` loads `/rbac/me` again (a listener in `src/app/store/store.ts`), so a role change shows at once.
- No admin gives a role above their own role: `RoleSelect` marks such a role "Above your role", and `PermissionGrid` does not let the admin check a permission that they do not have. The backend checks again (`ABOVE_OWN_ROLE`). Error texts: `roleErrorMessage` (`src/lib/role-text.ts`).
- Roles: the Roles tab of the Admins page, `/admin-management/roles/new` and `/admin-management/roles/[id]` (form `role-form.tsx`, grid `permission-grid.tsx`). An admin cannot edit the role that they have, a role above them, or `superadmin` (read-only grid with the reason). "Change role" is on the admin page (`PATCH /users/:id/role`); an admin cannot change their own role.
- Access requests: "Ask for access" (blocked state) and "My profile" → "My access" (`src/components/profile/my-access.tsx`) send a request (permissions, a role, or both, and a reason). The Requests tab of the Admins page lists them; the decide dialog approves with a role that has the asked permissions ("Make a role with the current and the asked permissions" opens the role form and comes back; an approval replaces the role, so the dialog shows the permissions that the admin loses), or declines with a note. Nobody decides their own request.

## Join requests

The backend side is in the backend `CLAUDE.md` ("Roles and permissions", "Join requests").

- A person without an admin account asks for access on `/request-access` (public; the sign-in page links to it with "Request access"). The form has the name, the email, the phone and a reason (rules `src/lib/join-requests.ts`, a copy of the backend limits). The page calls the backend from the browser (`POST <NEXT_PUBLIC_BASE_URL>/v1/admin-join-requests`, no cookies), so the backend limit of 5 an hour counts the IP address of the person, not of the panel server. The backend answers the same for each email, so the page always shows "Request sent".
- The "Join requests" tab of the Admins page (`?view=join`, `join-requests-tab.tsx`, `admin-management:actions`) lists them and has the "Allow existing RealStay accounts" switch (`GET`/`PATCH /v1/admin/join-requests/settings`, on by default). The dialog (`decide-join-dialog.tsx`) approves with a role — granting admin access directly if the email already has an active RealStay guest/host account and the switch is on, or sending the normal admin invite otherwise — or declines with a note that the person does not see. The calls are in `src/app/endpoints/join-requests/`. The bell has the open join requests.

## Remove admins

Design: `docs/superpowers/specs/2026-11-21-remove-admins-design.md`. The backend side is in the backend `CLAUDE.md` ("Roles and permissions").

- The admin page has "Panel access" (`admin-management/components/admin-access-section.tsx`) with "Remove admin" or "Restore admin" (`POST /users/:id/remove-admin`, `/restore-admin`). Only a Super Admin; a Super Admin only by `info@edgetechino.com`; not the own account.
- `src/lib/admin-removal.ts` is a copy of the backend rules (`admin-removal-rules.ts`); change both together. The button always shows; when the rules refuse, a dialog says why and no request goes out.
- A removed admin keeps the record and shows "Removed" in the Admins list (`isRemovedAdmin`, `admin_removed_at`). The status filter "Removed" sends `removed=true` (`adminsArgs`). The texts of the error codes are in `roleErrorMessage`.

## Reports

- `/reports` (menu "Reports", "g r"): Open / Dismissed / Actioned, a filter by listing or user, the oldest first. `/reports/[id]`: the reason, the text of the reporter, the reported listing or user, the reporter, the other open reports of the target, and for a closed report the outcome and the staff note.
- "Dismiss" and "Mark as actioned" (`reports:actions`) close a report with a note (1 to 1000 characters; the reporter never sees it). "Mark as actioned" does not do the action: take it first on the page of the target. A report that another admin closed first gives `409`; the page shows the message and loads the report again.
- The calls are in `src/app/endpoints/reports/`. The reason labels are a copy of the backend reasons (`src/lib/report-reasons.ts`).

## Listing verification

The backend side is in the backend `CLAUDE.md` ("Listing verification"). The app side is in realstay-prod `CLAUDE.md`.

- `/verifications` (menu "Verifications", "g v"): the tabs Papers to check (`submitted`), Visits to do (`documents_approved`), Check again (`recheck=true`), Verified, Rejected, All; the oldest first. `?queue=` keeps the tab.
- `/verifications/[id]`: the request, the listing (with the private address), the host (phone and email), the papers, and the visit, rejection or badge removal.
- Actions (`verifications:actions`): "Approve papers" (`submitted`), "Verify listing" with the day of the visit and staff notes (`documents_approved`), "Reject" with a reason (both open states), "Remove badge" with a reason and "Clear recheck flag" (`verified`). The host sees each reason. A request that another admin changed first gives `409 INVALID_STATE`; the page shows the message and loads the request again.
- Papers are signed links that are valid for 10 minutes. The page loads new links each 9 minutes and with "New links".
- `src/lib/verification-rules.ts` is a copy of the backend statuses, paper kinds, transitions and text limits; change them together.

## PostHog (feature flags and analytics)

Design: `docs/superpowers/specs/2026-11-21-posthog-flags-and-analytics-design.md`. Plan: `docs/superpowers/plans/2026-11-21-posthog-flags-and-analytics.md`.

- The panel calls PostHog (project "Realstay", 339639, EU Cloud) from its server routes under `src/app/api/posthog/`, with a personal API key. Env (server only, never `NEXT_PUBLIC_`): `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID` (`.env.example` lists the scopes). Without the key the routes answer `503 POSTHOG_NOT_CONFIGURED` and the pages say "PostHog is not set up".
- `src/server/posthog.ts` (`posthogFetch`) adds the key and maps errors (`posthog-errors.ts`); a response never has the key or a raw PostHog body. `src/server/require-permission.ts` checks the permission with backend `GET /rbac/me` (only a real answer allows; a 404 or another failure gives 502) and the `Origin` of a write. The proxy and these routes share `callBackendWithSession` (`src/server/session.ts`).
- Permissions: `feature-flags:view|details|actions` and `product-analytics:view|details|actions` (also in the backend list).
- Feature flags (`/feature-flags`, "g f"): the form rules are in `src/lib/feature-flag-rules.ts`. The form edits person and cohort filters, variants, payloads and rollouts, and keeps the `condition_id` of each condition. A flag with other rules (an experiment, a survey, group targeting, a flag dependency, date or version operators, rules version 2) is read-only, with a link to PostHog. A write refuses a flag that changed after the admin opened it (`409 FLAG_CHANGED`, from `updated_at` and `version`). Delete is the soft delete of PostHog.
- Writes to one flag run one after the other in a server process (`src/server/flag-lock.ts`). Another instance can still write between the check and the save; then the save answers `concurrentChange: true`, the page warns, and the audit text says so. The route checks the types of the body (`parseFlagForm`) before the rules. Variant rollouts are whole numbers that add up to 100. The list reads up to 1000 flags (`truncated`).
- Each flag write sends `POST /audit-logs/feature-flag` to the backend with the text of the change (`describeFlagChange`). If it fails, the change stays and the page warns.
- `src/lib/app-flags.ts` (`APP_FLAG_KEYS`) is a copy of the keys of `FEATURE_FLAGS` in realstay-prod `src/features/analytics/feature-flags.ts`. Change both together. A delete or key change of such a flag asks for a confirm.
- Analytics (`/analytics`, "g y"): one PostHog endpoint per metric and range, `admin-<metric>-<7|30|90>`, from the HogQL files in `tools/posthog-endpoints/`. After a change of a query, or of the test-account filters of the project, run `node --env-file=.env.local tools/posthog-endpoints.mjs` (scopes `endpoint:write` and `project:read`). Each scan of `events` has `{{test_accounts}}`: the script writes the test-account filters of the project there (`tools/test-account-sql.mjs`, cohort filters only; another filter type stops the script). Saved endpoints do not take the `{filters}` placeholder. The route `GET /api/posthog/analytics/:metric?days=` keeps rows 5 minutes per server process. The row conversions are in `src/lib/analytics-views.ts`. Days are Lagos days, in the queries (`toTimeZone(timestamp, 'Africa/Lagos')`) and on the page (`lastDays`). A run asks for 1000 rows (`ENDPOINT_RUN_BODY`; the default is 100).
- Test accounts: the user page has an "Analytics" section with "Leave out of analytics" (`product-analytics:actions`). It sends a `$set` event with `$internal_or_test_user` to PostHog (`posthogCapture`, the public `POSTHOG_PROJECT_TOKEN`; it works for a user who never signed in, PostHog joins the person at the first sign-in). The cohort "Internal / Test users" (316404), the test-account setting of the project, has the persons with that property. PostHog updates the cohort on a schedule, so the numbers change within some hours. The Analytics page lists the marked users (`GET /api/posthog/test-accounts`, scope `person:read`). Rules: `src/lib/test-accounts.ts`.
- Deploy order: the backend (permissions and the audit route), then the endpoints script, then the Vercel env and the panel.

## Profile photo

- `UserAvatar` (`src/components/admin`) draws every avatar with the rule of the mobile app (`src/lib/avatar-url.ts`, a copy of realstay-prod `src/features/profile/avatar-url.ts`; change them together): the photo from Cloudinary at the size of the avatar, cropped to the face; else the DiceBear "line-face" of the user id; else the initials.
- "My profile" (`src/components/profile/profile-photo.tsx`) changes or removes the photo of the signed-in admin, as the app does: the admin crops a square (react-easy-crop), the browser makes a JPEG of at most 1200 px (`crop-image.ts`), then `setProfilePhoto` (`user-api-slice.ts`) sends `POST /utility/file-upload` and `PATCH /users/:id` with `image_url` (`null` removes it). The small file stays under the request limit of Vercel (about 4.5 MB).
- `getUser` has the tag `User`; `setProfilePhoto` invalidates it, so the profile and the account menu load the new photo.

## Password reset

`/forgot-password` has three steps: the email, the 6-digit code, and the new password. The page uses Better Auth's `emailOtp` client plugin (`authClient.emailOtp.requestPasswordReset`, `checkVerificationOtp`, `resetPassword`) through `/api/auth/[...all]/route.ts`, with `Origin` checking and no session cookies. The new password must pass the backend rule; `src/lib/password-rules.ts` has a copy (change both together). Resetting the password revokes all active Better Auth sessions and syncs the legacy password column on the backend.

## Pages

`src/app/(dashboard)/`: `dashboard` (analytics and charts), `users`, `properties` (approve or reject a listing), `bookings`, `transactions`, `reports`, `admin-management` (admins, roles, access requests), `audit-logs`, `profile`, and `notifications` (not built). The menu is `src/lib/dashboardMenu.ts`. The command palette (Cmd+K) is `src/ui/components/command-dashboard.tsx`. In Next 15, `params` of a page is a Promise: a client page reads it with `useParams()`. The upstream pages were ported on 2026-11-20 from upstream `0d76bbc`.

## Checks

- `yarn typecheck`: [tsrs](https://github.com/oxc-project/tsrs) (TypeScript 7 in Rust), the same checker as the backend and the app. It takes about 0.5 s. 0 errors on 2026-11-20. tsrs only checks types; `next build` still builds the app with the `typescript` package.
- TypeScript 7 checks side-effect imports, so `src/types/css.d.ts` declares `*.css`.
- `yarn test`: Vitest, for the pure rules in `src/**/*.test.ts` (no browser, no React).
- `npx next build` (it also runs ESLint).
- Yarn 1: `package.json` has `"packageManager": "yarn@1.22.22"`, so `yarn` in this repo is Yarn 1. The lockfile is a Yarn 1 lockfile. Do not use Yarn 4 here: it changes the format of the lockfile.
