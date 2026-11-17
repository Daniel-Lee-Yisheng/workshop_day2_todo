/**
 * Single source of truth for dates and times.
 *
 * The whole app runs on Singapore time (Asia/Singapore, UTC+08:00, no DST).
 * Do NOT call `new Date()` anywhere else in the codebase — use these helpers.
 *
 * Storage format: due dates and timestamps are stored as Singapore-local ISO
 * strings without an offset, e.g. "2026-11-17T14:30:00".
 */

export const APP_TIMEZONE = 'Asia/Singapore';
const SG_OFFSET = '+08:00';

type DateParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

/** The current instant. The only sanctioned way to get "now". */
export function getSingaporeNow(): Date {
  return new Date();
}

/** Calendar/clock parts of an instant as seen in Singapore. */
export function getSingaporeParts(date: Date = getSingaporeNow()): DateParts {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Instant -> Singapore-local ISO string ("YYYY-MM-DDTHH:mm:ss"), used for storage. */
export function toSingaporeISO(date: Date = getSingaporeNow()): string {
  const p = getSingaporeParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** Instant -> Singapore calendar date key ("YYYY-MM-DD"). */
export function toSingaporeDateKey(date: Date = getSingaporeNow()): string {
  const p = getSingaporeParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * Parse a stored/user-entered date string into an instant.
 * Strings without an offset ("2026-11-17T14:30" or "2026-11-17") are treated
 * as Singapore-local time. Returns null for invalid input.
 */
export function parseSingaporeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  let s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s += ':00';
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const date = new Date(hasOffset ? s : `${s}${SG_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Build an instant from Singapore-local calendar parts (month is 1-12). */
export function fromSingaporeParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  // Singapore has a fixed +08:00 offset, so this is exact.
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
}

/** Add minutes to an instant. */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Human-readable formatting in Singapore time. */
export function formatSingaporeDate(
  value: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
): string {
  const date = typeof value === 'string' ? parseSingaporeDate(value) : value;
  if (!date) return '';
  return new Intl.DateTimeFormat('en-SG', { timeZone: APP_TIMEZONE, ...options }).format(date);
}

/** Value for an <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") in Singapore time. */
export function toDateTimeLocalValue(value: Date | string | null | undefined): string {
  const date = typeof value === 'string' ? parseSingaporeDate(value) : value;
  if (!date) return '';
  return toSingaporeISO(date).slice(0, 16);
}
