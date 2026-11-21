import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** "20 Nov 2026". */
export function formatDate(value?: string | Date | null) {
  return value ? dayjs(value).format("D MMM YYYY") : "–";
}

/** "20 Nov 2026, 14:05". */
export function formatDateTime(value?: string | Date | null) {
  return value ? dayjs(value).format("D MMM YYYY, HH:mm") : "–";
}

/** Naira, "₦12,500.00". */
/** The format of an amount in naira, for `formatNaira` and the stat cards. */
export const NAIRA_FORMAT = { style: "currency", currency: "NGN" } as const;

/** A number from the backend (a number or a string), or 0. */
export function toAmount(value?: number | string | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatNaira(value?: number | string | null) {
  return new Intl.NumberFormat("en-NG", NAIRA_FORMAT).format(toAmount(value));
}

export function fullName(user?: { first_name?: string; last_name?: string } | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "–";
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((part) => part && part !== "–")
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("") || "?"
  );
}

/**
 * A stay date (check-in or checkout). The backend stores it as UTC midnight
 * of the date, so format it in UTC, else a time zone west of UTC shows the
 * day before.
 */
export function formatStayDate(value?: string | null) {
  return value ? dayjs.utc(value).format("D MMM YYYY") : "–";
}

/** The number of nights between two stay dates. */
export function nightsBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  return Math.max(0, dayjs.utc(end).startOf("day").diff(dayjs.utc(start).startOf("day"), "day"));
}

type PageInfo = { total_items?: number | null } | null | undefined;

/**
 * The number of items of a list response. The response interceptor of the
 * backend moves `pagination` to the top of the body (`{ data, pagination }`);
 * an older reply had it in `data`, so read both.
 */
export function totalItems(
  res: { pagination?: PageInfo; data?: { pagination?: PageInfo } | null } | null | undefined,
) {
  return res?.pagination?.total_items ?? res?.data?.pagination?.total_items ?? 0;
}

/**
 * The national number of a Nigerian phone number (10 digits, without the 0
 * or 234), or null. It reads "2349139220241", "+234 913 922 0241",
 * "09139220241", "9139220241", and "23409139220241" (a 0 kept after 234).
 */
function nigerianNationalNumber(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  const match = /^(?:\+?2340?|0)?([1-9]\d{9})$/.exec(digits);
  return match ? match[1]! : null;
}

/**
 * The digits after 234 of a number that starts with 234 but is not a valid
 * Nigerian number (a wrong length), or null.
 */
function digitsAfter234(value: string) {
  if (/[^\d+\s().-]/.test(value)) return null;
  const match = /^\+?234(\d+)$/.exec(value.replace(/[^\d+]/g, ""));
  return match ? match[1]! : null;
}

/** "+234" and the digits in groups: 3, 3, then the rest. */
function group234(rest: string) {
  return ["+234", rest.slice(0, 3), rest.slice(3, 6), rest.slice(6)].filter(Boolean).join(" ");
}

/**
 * A phone number to show: "+234 913 922 0241". A number that starts with
 * 234 but has the wrong length shows in the same groups ("+234 909 000 009"),
 * so that the column stays easy to read. Other numbers stay as they are.
 */
export function formatPhone(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "–";
  const national = nigerianNationalNumber(raw);
  if (national) return group234(national);
  const rest = digitsAfter234(raw);
  return rest ? group234(rest) : raw;
}

/** A phone number to copy, without spaces: "+2349139220241". */
export function phoneToCopy(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const national = nigerianNationalNumber(raw);
  if (national) return `+234${national}`;
  const rest = digitsAfter234(raw);
  return rest ? `+234${rest}` : raw;
}
