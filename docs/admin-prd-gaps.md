# Admin Control Panel — Remaining PRD Gaps

**Date:** 2026-11-23  
**Repos:** `real-stay-admin` (Next.js) + `real-stay-backend` (NestJS + PostgreSQL/Drizzle)  
**Source:** Product Requirements Document (PRD) v2.0 + Addendum §4.6 (Property Physical Verification & Verified Badge)

---

## Completed

### 4.1 User Management ✅
Implemented across `real-stay-backend` (`a4f56a0`) and `real-stay-admin` (`4019bce`):
- Admin-created **host** accounts (`status: active`, `is_password_set: false`, wallet created, welcome email with app password-setup instructions, audited).
- Admin profile edit (`PATCH /users/:id`, audited).
- Soft delete & restore (`POST /users/:id/delete`, `POST /users/:id/restore`) with immediate session/JWT/socket lockout, automatic listing deactivation, `Deleted` filter, and analytics exclusion.
- Dojah KYC filter (`kyc=verified|unverified`), selfie + ID photo display, and KYC revoke (`POST /kyc/admin/:id/revoke`).
- Fraud/abuse flags, escalations, internal compliance notes timeline (`user_notes`), `Flagged`/`Escalated` filters, and per-user report history (`GET /v1/admin/reports?userId=`).

---

## Remaining Gaps

### 4.2 Property Management
**Current state:** Grid/list views with search & active/inactive filters, detail view (photos, reviews, text address, extras), and activate/deactivate toggle (`PATCH /listing/review/:id/:action`).

- [ ] **Admin CRUD for listings**
  - Create, edit (title, description, pricing, house rules, photos), and soft-delete listings on behalf of hosts (`properties:actions`, audit-logged).
- [ ] **Approval pipeline (`Pending → Approved / Rejected`)**
  - Currently `listings.status` only has `active | inactive` and defaults to `active` on creation.
  - Decision needed: should *all* new listings start in `pending` (requiring admin approval before appearing in guest search), or stay live by default and rely on the Verified Badge + deactivation?
  - If adding `pending` / `rejected`: add rejection reason, host notification, and a Pending queue tab (plus header bell item).
- [ ] **Availability calendar with manual override**
  - Calendar view on `/properties/[id]` showing booked/held dates (and hotel room-type inventory) with admin date-block / unblock override.
- [ ] **Amenity configuration & mapping**
  - Manage canonical amenities/extras rather than free-text `extra_offerings` strings.
- [ ] **Geo-tagging / Map view**
  - Embedded map on `/properties/[id]` showing the exact pin (`lat`, `lng`) and public `approx_location` circle, with optional pin correction.

---

### 4.3 Booking Management
**Current state:** Read-only list (search + status filter) and detail page (`bookings-api-slice.ts` has `GET` only). Backend already has `PATCH /bookings/:id/:status` gated by `bookings:actions`.

- [ ] **Booking request controls (Accept / Reject / Cancel / Modify)**
  - Wire `PATCH /bookings/:id/:status` into `/bookings/[id]` (confirm, decline, cancel) with confirmation modals and audit logs.
  - Add booking modification flow (dates, room count, or notes) if required by operations.
- [ ] **Cancellation & refund logic**
  - Allow admins to cancel a paid (`BOOKED`) booking and trigger a full or partial refund according to cancellation policy (right now guests get `409` on paid cancel and are told to contact support, so support needs this tool).
- [ ] **Export bookings**
  - CSV export of filtered booking lists (with date range, status, GTV, margin, host share, payment reference).
- [ ] **Cross-property booking calendar**
  - Multi-property timeline/calendar view across listings (useful for ops and hotel/multi-unit hosts).

---

### 4.4 Payment Management
**Current state:** Read-only `/transactions` list (search by reference, filter by type/status/date range) and detail page. Backend uses Paystack (NGN only) with an automatic 10% platform split (`PLATFORM_SHARE = 0.1`) and automated late-payment refunds only (`LatePaymentService`). Backend exposes `GET /wallets/company-wallet` (`transactions:view`), not wired in the panel.

- [ ] **Admin refund management (full & partial)**
  - Trigger full or partial Paystack refunds from `/transactions/[id]` or `/bookings/[id]` (`transactions:actions`), record `booking_refunds` + `REFUND` transaction rows, adjust host wallet if already credited, notify guest/host, and audit-log.
- [ ] **Payout scheduling & large-payout approval queue**
  - PRD Open Question #2: automate small host payouts, require manual admin approval for large payouts (above a configurable threshold).
  - Currently hosts withdraw on demand (`POST /wallets/withdraw`). Add a Payouts / Withdrawals review tab, threshold setting, and optional weekly/monthly scheduled payouts.
- [ ] **Company wallet & financial overview**
  - Wire `GET /wallets/company-wallet` into `/transactions` (or a Finance summary card) showing platform revenue, fees, pending payouts, and reconciliation totals.
- [ ] **Dispute & chargeback handling**
  - Track Paystack disputes/chargebacks (`charge.dispute.*` webhooks), allow escalation, evidence notes, wallet holds, and resolution status.
- [ ] **Configurable revenue-sharing / commission rules** *(optional)*
  - Currently hardcoded at 10% (`src/features/bookings/pricing/payment-split.ts`; PRD mentions 15% as an example). Decide if commission rate should be editable in admin settings or per-listing.
- [ ] **Multi-gateway & multi-currency support** *(confirm scope)*
  - PRD lists Stripe, Flutterwave, and `USD` / `GBP` / `EUR` alongside Paystack `NGN`. Confirm whether Paystack-only NGN is intentional for current launch.

---

### 4.5 Content Management System (CMS)
**Current state:** Not implemented.

- [ ] **Dynamic content editor**
  - CRUD for FAQs, About Us, Terms of Service, Privacy Policy, and Cancellation Policies, served via public API to the mobile app and website.
- [ ] **Scheduled publishing & visibility rules**
  - Draft / Scheduled (`publish_at`) / Published / Archived states and audience/platform visibility toggles.
- [ ] **External CMS connector** *(optional / low priority)*
  - PRD mentions optional WordPress/Drupal connector; likely unnecessary if built natively in Postgres.

---

### 4.6 Analytics & Reporting
**Current state:** `/dashboard` shows user/listing/booking totals, GTV, margin, and daily/monthly new listings chart. `/analytics` shows PostHog product metrics (DAU/WAU/MAU, sign-ups, booking funnel, Paystack payments, host activity, app errors, test accounts).

- [ ] **Cancellations KPI** on `/dashboard` (count & cancellation rate).
- [ ] **Occupancy & listing performance reports**
  - Occupancy rate, revenue per listing, top/bottom performing listings, and nights booked over a date range.
- [ ] **KYC & compliance reports**
  - Dedicated report showing KYC verification rate, pending/unverified hosts, flagged & escalated accounts, and open/resolved abuse reports.
- [ ] **Payment gateway breakdown**
  - Expand payment insights if additional gateways (Stripe/Flutterwave) are added; include refund/payout reconciliation accuracy.
- [ ] **Report exports** (CSV / PDF download).

---

### 4.7 Customer Support Tools
**Current state:** Not implemented. `/notifications` is a placeholder ("This page is not built yet").

- [ ] **Notification & broadcast engine (`/notifications`)**
  - Admin UI to send targeted or broadcast push notifications (FCM) and emails to users (by segment: all users, hosts, guests, city/state, or specific users), with delivery logs and templates.
  - Add SMS provider (e.g. Twilio / Termii) if SMS alerts are still required.
- [ ] **Integrated ticketing system**
  - Decision needed (PRD SAD Open Question #2): build in-house support tickets (create, assign, status, SLA tracking `< 1 hr`, link to user/booking) or integrate Zendesk/Freshdesk.
- [ ] **1:1 admin-to-user messaging**
  - Allow support staff to message a guest or host directly from `/users/[id]` or `/bookings/[id]`.
- [ ] **Knowledge Base / Help Centre management**
  - Categorized help articles and search (can share infrastructure with 4.5 CMS).

---

### 4.8 Security & Compliance
**Current state:** JWT with `httpOnly` cookie session handling + Origin check, granular custom RBAC, and admin Audit Logs (`/audit-logs`).

- [ ] **Admin Multi-Factor Authentication (MFA)**
  - TOTP authenticator app (and/or email OTP) enrollment & enforcement for admin sign-in, with recovery codes and Super Admin reset.
- [ ] **OAuth2 sign-in for admins** *(optional)*
  - Google Workspace / SSO login for staff accounts.
- [ ] **Close shared-route backend RBAC gap**
  - Documented in `real-stay-backend/CLAUDE.md`: shared guest/host read routes (`/listing`, `/bookings`, `/transactions`, `GET /users/:id`) currently rely on the admin panel UI gate rather than checking admin permissions server-side when called by an admin.
- [ ] **GDPR & NDPR compliance workflows**
  - Data export (user data portability download) and formal deletion/anonymization request queue (scrubbing PII while keeping anonymized financial ledger records) + configurable data retention policy.
- [ ] **AML / anomaly monitoring** *(as volume scales)*
  - Automated alerts for suspicious booking/withdrawal patterns, IP/rate-limit monitoring, and audit log filtering by actor, action, and date range (currently `/audit-logs` only has free-text search).

---

### 4.6 (Addendum) Property Physical Verification & Verified Badge
**Current state:** Strong baseline implemented — host document upload, `/verifications` queue (`submitted` → `documents_approved` → `verified`, `rejected`, `cancelled`, `revoked`), 10-min signed Cloudinary document links, visit date & staff notes, instant badge revoke, recheck flag on address/photo edits, host push notifications, and audit logs.

- [ ] **Inspection officer assignment & visit scheduling**
  - Assign an admin/inspection officer to a verification request and record/reschedule an appointment date & time with the host (with host notification).
- [ ] **Inspection report & inspection photo uploads**
  - Allow inspection officers to upload field photos and structured checklist/report attachments during or after the physical visit (currently only a date picker + text notes).
- [ ] **Distinct `Suspended` verification status**
  - PRD §4.6.4 differentiates temporary `Suspended` from permanent `Revoked` (currently only `revoked` exists, removing the badge until the host reapplies).
- [ ] **Inspection turnaround & SLA tracking**
  - Track the 5-working-day SLA from scheduled inspection and surface overdue visits in `/verifications` and the header bell.
- [ ] **Storage alignment** *(low priority / confirm)*
  - PRD §6 specifies AWS S3; current implementation uses private authenticated Cloudinary uploads. Confirm whether Cloudinary stays.

---

### Technical & Cross-Cutting Gaps
- [ ] **Internationalization (`i18n`)** — PRD §6 lists multilingual support; panel is currently English-only.
- [ ] **Audit log filters & export** — Add actor, action type, and date-range filters on `/audit-logs`.
- [ ] **Booking/product types from Master PRD** — Rental viewing reservations (₦500 / ₦10,000 package), tenancy agreements, and property purchase workflows are not yet reflected in the admin panel (only shortlet/hotel booking flows are currently active).
