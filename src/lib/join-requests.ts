/** The rules of the "Request admin access" form. A copy of the limits of backend `join-requests.schemas.ts`. */
export const MAX_JOIN_REASON = 500;
export const MAX_NAME = 100;

export type JoinForm = { firstName: string; lastName: string; email: string; phone: string; reason: string };
export type JoinFormErrors = Partial<Record<keyof JoinForm, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9 ]+$/;

/** The errors of each field. An empty object means that the form can go. */
export function joinFormErrors(f: JoinForm): JoinFormErrors {
  const e: JoinFormErrors = {};
  const name = (v: string, label: string) =>
    !v.trim() ? `Enter your ${label}.` : v.trim().length > MAX_NAME ? `Write ${MAX_NAME} characters or less.` : undefined;
  e.firstName = name(f.firstName, "first name");
  e.lastName = name(f.lastName, "last name");
  const email = f.email.trim();
  e.email = !email ? "Enter your email." : !EMAIL.test(email) || email.length > 254 ? "Enter a valid email." : undefined;
  const phone = f.phone.trim();
  e.phone = !phone
    ? "Enter your phone number."
    : !PHONE.test(phone) || phone.length < 10 || phone.length > 15
      ? "Enter a phone number of 10 to 15 digits, for example +2348012345678."
      : undefined;
  const reason = f.reason.trim();
  e.reason = !reason
    ? "Tell the team why you need access."
    : reason.length > MAX_JOIN_REASON
      ? `Write ${MAX_JOIN_REASON} characters or less.`
      : undefined;
  for (const k of Object.keys(e) as (keyof JoinForm)[]) if (!e[k]) delete e[k];
  return e;
}

/** The body of `POST /v1/admin-join-requests`: trimmed values, the email in lower case. */
export function joinRequestBody(f: JoinForm): JoinForm {
  return {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    email: f.email.trim().toLowerCase(),
    phone: f.phone.trim(),
    reason: f.reason.trim(),
  };
}
