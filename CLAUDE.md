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

## UI, theme, and icons

- New UI uses HeroUI v3 (`@heroui/react`, `@heroui/styles`), the web version of `heroui-native` in the mobile app. The theme is the HeroUI default theme, the same as the app: the same colors (`bg-background`, `bg-surface`, `text-muted`, `bg-accent`, ...), radius, and font (Inter, `src/app/layout.tsx`). `src/app/globals.css` has the Tailwind v4 setup and the old breakpoints (`sm` 900, `md` 1150, `lg` 1458).
- A HeroUI component runs only in a client component (`"use client"`).
- Light and dark mode: `next-themes` sets the `light` or `dark` class on `<html>` (`src/app/providers/theme-provider.tsx`). `ThemeSwitcher` (`src/components/theme-switcher.tsx`) is in the header and on the sign-in pages. Do not add a color that is right in one mode only (`text-white`, `bg-[#181818]`); use the HeroUI colors.
- Icons: `Icon` (`src/components/icon`) draws the icons of the mobile app, with the same names (`name="people"`, `"calendar-outline"`). `glyphs.ts` is a copy of realstay-prod `components/icon/glyphs.ts`; copy it again after a change there. Icons that the app does not have are in `admin-glyphs.ts`, made by `node tools/make-icons.mjs` from MingCute.
- Shared page parts are in `src/components/admin` (import from `@/components/admin`): `PageHeader`, `StatCards`, `AdminTable` (a HeroUI table with loading rows, an empty state and row clicks), `TablePagination`, `SearchInput` (waits 400 ms), `FilterMenu`, `SegmentTabs`, `RowActions`, `StatusChip`, `DetailSection`, `CopyButton`, `UserCell`, `PhotoGallery`, `ReviewList`, and the formats (`formatNaira`, `formatDate`, `formatStayDate`). Build a new page from these.
- A stay date (check-in, checkout) is UTC midnight of the date: show it with `formatStayDate`, not `formatDate`.
- A HeroUI dialog or drawer that opens from state (no trigger inside it): put `isOpen` on `Modal.Backdrop` / `Drawer.Backdrop`, without the `Modal` / `Drawer` root, which expects a trigger.
- The frame of the dashboard is `src/components/dashboard/` (sidebar, header, account menu, mobile drawer, Cmd+K palette). The sign-in pages use `src/app/(auth)/components/`.

## Profile photo

- `UserAvatar` (`src/components/admin`) draws every avatar with the rule of the mobile app (`src/lib/avatar-url.ts`, a copy of realstay-prod `src/features/profile/avatar-url.ts`; change them together): the photo from Cloudinary at the size of the avatar, cropped to the face; else the DiceBear "line-face" of the user id; else the initials.
- "My profile" (`src/components/profile/profile-photo.tsx`) changes or removes the photo of the signed-in admin, as the app does: the admin crops a square (react-easy-crop), the browser makes a JPEG of at most 1200 px (`crop-image.ts`), then `setProfilePhoto` (`user-api-slice.ts`) sends `POST /utility/file-upload` and `PATCH /users/:id` with `image_url` (`null` removes it). The small file stays under the request limit of Vercel (about 4.5 MB).
- `getUser` has the tag `User`; `setProfilePhoto` invalidates it, so the profile and the account menu load the new photo.

## Password reset

`/forgot-password` has three steps: the email, the 5-digit code, and the new password. The page calls `POST /api/auth/password-reset` with `step` `request`, `verify` or `change`. The route sends only the fields of the step to the backend (`/auth/forgot-password`, `/auth/forgot-password/verify`, `PATCH /auth/change-password`), with no cookies, and checks the `Origin`. The new password must pass the backend rule; `src/lib/password-rules.ts` has a copy (change both together). The backend lets one email ask for a code every 30 seconds.

## Pages

`src/app/(dashboard)/`: `dashboard` (analytics and charts), `users`, `properties` (approve or reject a listing), `bookings`, `transactions`, `admin-management` (invite an admin), `audit-logs`, `profile`, and `notifications` (not built). The menu is `src/lib/dashboardMenu.ts`. The command palette (Cmd+K) is `src/ui/components/command-dashboard.tsx`. In Next 15, `params` of a page is a Promise: a client page reads it with `useParams()`. The upstream pages were ported on 2026-11-20 from upstream `0d76bbc`.

## Checks

- `yarn typecheck`: [tsrs](https://github.com/oxc-project/tsrs) (TypeScript 7 in Rust), the same checker as the backend and the app. It takes about 0.5 s. 0 errors on 2026-11-20. tsrs only checks types; `next build` still builds the app with the `typescript` package.
- TypeScript 7 checks side-effect imports, so `src/types/css.d.ts` declares `*.css`.
- `npx next build` (it also runs ESLint).
- Yarn 1: `package.json` has `"packageManager": "yarn@1.22.22"`, so `yarn` in this repo is Yarn 1. The lockfile is a Yarn 1 lockfile. Do not use Yarn 4 here: it changes the format of the lockfile.
