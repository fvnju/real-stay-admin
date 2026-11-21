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

- `src/server/session.ts` (server only) has the cookie names, writes and clears the cookies, and refreshes the tokens.
- Cookies: `access_token` (15 minutes, as the backend token), `refresh_token` (7 days), `user` (`{ id, email, user_type }`). All are httpOnly, `SameSite=Lax`, and `Secure` in production.
- `POST /api/auth/login` and `POST /api/auth/accept-invite` call the backend and write the cookies. The login refuses a user whose `user_type` is not `admin`. `POST /api/auth/logout` clears the cookies.
- `src/middleware.ts`: a page needs the `refresh_token` cookie, else it goes to `/sign-in`. The public pages are `/`, `/sign-in`, `/forgot-password`, and `/accept-invite`. `/logout` clears the cookies.
- The dashboard layout (a server component) reads the `user` cookie and gives it to the pages with `useSessionUser()` (`src/app/providers/session-user.tsx`).

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

- Admins get no push or in-app notifications. The bell of the header (`src/components/dashboard/attention-center.tsx`) opens a popover under it with the admin queues of the backend: open reports (`GET /v1/admin/reports?status=open`), papers to check (`/v1/admin/listing-verifications?status=submitted`), visits to do (`status=documents_approved`), verified listings to check again (`recheck=true`), open access requests (`/v1/admin/access-requests?status=open`), and admin invites with no answer (`/analytics/admins`).
- A queue shows only when the role has its permission (`reports:view`, `verifications:view`, `admin-management:actions` for the requests, `admin-management:view` for the invites), and only the queues shown count in the badge. It loads again each minute while the tab is in front, and when the popover opens. Each list shows the 5 oldest items; an item opens its page.
- The calls are in `src/app/endpoints/attention/`. A v1 list answers `{ data: { data, total, page, limit } }`.
- The panel has no page to act on a verification yet.

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

## Reports

- `/reports` (menu "Reports", "g r"): Open / Dismissed / Actioned, a filter by listing or user, the oldest first. `/reports/[id]`: the reason, the text of the reporter, the reported listing or user, the reporter, the other open reports of the target, and for a closed report the outcome and the staff note.
- "Dismiss" and "Mark as actioned" (`reports:actions`) close a report with a note (1 to 1000 characters; the reporter never sees it). "Mark as actioned" does not do the action: take it first on the page of the target. A report that another admin closed first gives `409`; the page shows the message and loads the report again.
- The calls are in `src/app/endpoints/reports/`. The reason labels are a copy of the backend reasons (`src/lib/report-reasons.ts`).

## Profile photo

- `UserAvatar` (`src/components/admin`) draws every avatar with the rule of the mobile app (`src/lib/avatar-url.ts`, a copy of realstay-prod `src/features/profile/avatar-url.ts`; change them together): the photo from Cloudinary at the size of the avatar, cropped to the face; else the DiceBear "line-face" of the user id; else the initials.
- "My profile" (`src/components/profile/profile-photo.tsx`) changes or removes the photo of the signed-in admin, as the app does: the admin crops a square (react-easy-crop), the browser makes a JPEG of at most 1200 px (`crop-image.ts`), then `setProfilePhoto` (`user-api-slice.ts`) sends `POST /utility/file-upload` and `PATCH /users/:id` with `image_url` (`null` removes it). The small file stays under the request limit of Vercel (about 4.5 MB).
- `getUser` has the tag `User`; `setProfilePhoto` invalidates it, so the profile and the account menu load the new photo.

## Password reset

`/forgot-password` has three steps: the email, the 5-digit code, and the new password. The page calls `POST /api/auth/password-reset` with `step` `request`, `verify` or `change`. The route sends only the fields of the step to the backend (`/auth/forgot-password`, `/auth/forgot-password/verify`, `PATCH /auth/change-password`), with no cookies, and checks the `Origin`. The new password must pass the backend rule; `src/lib/password-rules.ts` has a copy (change both together). The backend lets one email ask for a code every 30 seconds.

## Pages

`src/app/(dashboard)/`: `dashboard` (analytics and charts), `users`, `properties` (approve or reject a listing), `bookings`, `transactions`, `reports`, `admin-management` (admins, roles, access requests), `audit-logs`, `profile`, and `notifications` (not built). The menu is `src/lib/dashboardMenu.ts`. The command palette (Cmd+K) is `src/ui/components/command-dashboard.tsx`. In Next 15, `params` of a page is a Promise: a client page reads it with `useParams()`. The upstream pages were ported on 2026-11-20 from upstream `0d76bbc`.

## Checks

- `yarn typecheck`: [tsrs](https://github.com/oxc-project/tsrs) (TypeScript 7 in Rust), the same checker as the backend and the app. It takes about 0.5 s. 0 errors on 2026-11-20. tsrs only checks types; `next build` still builds the app with the `typescript` package.
- TypeScript 7 checks side-effect imports, so `src/types/css.d.ts` declares `*.css`.
- `yarn test`: Vitest, for the pure rules in `src/**/*.test.ts` (no browser, no React).
- `npx next build` (it also runs ESLint).
- Yarn 1: `package.json` has `"packageManager": "yarn@1.22.22"`, so `yarn` in this repo is Yarn 1. The lockfile is a Yarn 1 lockfile. Do not use Yarn 4 here: it changes the format of the lockfile.
