/*
 * Time rules for opportunities. Everything is Philippine time (UTC+8, no
 * daylight saving), whatever the server's own time zone is.
 */

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const MANILA_TIME_ZONE = "Asia/Manila";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const WITH_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

function manila(y: number, mo: number, d: number, h = 0, mi = 0, s = 0, ms = 0): Date | null {
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s, ms) - MANILA_OFFSET_MS);
  // Reject impossible dates such as Feb 30, which Date.UTC would roll over.
  const check = new Date(date.getTime() + MANILA_OFFSET_MS);
  return check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d
    ? date
    : null;
}

/**
 * Reads a date from a form or an API.
 * - "2026-10-30": the end of that day in Philippine time, 11:59:59.999 pm.
 * - "2026-10-30T14:00": that time in Philippine time, as a datetime-local input sends it.
 * - "2026-10-30T06:00:00Z" or with an offset: that exact instant.
 * Returns undefined for empty input and null for anything unreadable.
 */
export function parseManilaDateTime(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  const text = value.trim();
  let m = text.match(DATE_ONLY);
  if (m) return manila(+m[1]!, +m[2]!, +m[3]!, 23, 59, 59, 999);
  m = text.match(LOCAL_DATE_TIME);
  if (m) {
    const [h, mi, s] = [+m[4]!, +m[5]!, m[6] ? +m[6] : 0];
    if (h > 23 || mi > 59 || s > 59) return null;
    return manila(+m[1]!, +m[2]!, +m[3]!, h, mi, s);
  }
  if (WITH_ZONE.test(text) && /^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const t = Date.parse(text);
    return Number.isNaN(t) ? null : new Date(t);
  }
  return null;
}

/** 11:59:59.999 pm, Philippine time, on the day of the given instant. */
export function endOfManilaDay(date: Date): Date {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_MS);
  return manila(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), 23, 59, 59, 999)!;
}

/**
 * When a post leaves the list: its deadline, else its end time, else the end
 * of its start day. Null when it has none of these.
 */
export function closesAtFor(dates: {
  deadline?: Date | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}): Date | null {
  if (dates.deadline) return dates.deadline;
  if (dates.endsAt) return dates.endsAt;
  if (dates.startsAt) return endOfManilaDay(dates.startsAt);
  return null;
}

function manilaDayNumber(date: Date): number {
  return Math.floor((date.getTime() + MANILA_OFFSET_MS) / DAY_MS);
}

/** "Oct 30", or "Oct 30, 2027" when the year differs from `now`. */
export function formatManilaDate(date: Date, now: Date = new Date()): string {
  const sameYear =
    new Date(date.getTime() + MANILA_OFFSET_MS).getUTCFullYear() ===
    new Date(now.getTime() + MANILA_OFFSET_MS).getUTCFullYear();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** "2:00 PM", Philippine time. */
export function formatManilaTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Badge text: "Closes today", "Closes tomorrow", "Closes in 3 days", "Closes Nov 20", or "Closed". */
export function closingLabel(closesAt: Date, now: Date = new Date()): string {
  if (closesAt.getTime() <= now.getTime()) return "Closed";
  const days = manilaDayNumber(closesAt) - manilaDayNumber(now);
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days <= 7) return `Closes in ${days} days`;
  return `Closes ${formatManilaDate(closesAt, now)}`;
}
