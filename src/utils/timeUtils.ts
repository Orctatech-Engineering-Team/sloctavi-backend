/**
 * Check if two time intervals overlap.
 * Times must be in ISO string or Date objects.
 */
export function timesOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date,
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  return s1 < e2 && s2 < e1;
}

/**
 * Convert a date to UTC ISO string.
 */
export function toUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Parse a date string in a given timezone to UTC Date.
 * (For deeper timezone support, consider libraries like `luxon` or `date-fns-tz`)
 */
export function parseInTimezone(dateStr: string, timeZone: string): Date {
  const date = new Date(dateStr);
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  // get locale
  return new Date(utcDate.toLocaleString("en-US", { timeZone }));
}
