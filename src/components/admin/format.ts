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
