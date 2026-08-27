import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const TIME_ZONE = "Asia/Jakarta";

export function todayJakartaKey(): string {
  return formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
}

export function toJakartaKey(date: Date): string {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
}

export function toJakartaTime(date: Date): string {
  return formatInTimeZone(date, TIME_ZONE, "HH:mm");
}

/**
 * Returns the UTC instants bounding the given Jakarta calendar day.
 * Filters records with `recordedAt >= start AND recordedAt <= end`.
 */
export function jakartaDayRange(dateKey: string): {
  start: Date;
  end: Date;
} {
  const start = fromZonedTime(`${dateKey} 00:00:00`, TIME_ZONE);
  const end = fromZonedTime(`${dateKey} 23:59:59.999`, TIME_ZONE);
  return { start, end };
}

/**
 * Returns the UTC instants bounding a Jakarta calendar date range.
 * Covers from `dari 00:00:00 WIB` to `sampai 23:59:59.999 WIB`.
 */
export function jakartaRangeBoundary(
  dari: string,
  sampai: string
): { start: Date; end: Date } {
  const start = fromZonedTime(`${dari} 00:00:00`, TIME_ZONE);
  const end = fromZonedTime(`${sampai} 23:59:59.999`, TIME_ZONE);
  return { start, end };
}

/**
 * Returns today's Jakarta date key as both dari and sampai — safe default
 * when no range params are present in the URL.
 */
export function defaultRange(): { dari: string; sampai: string } {
  const today = todayJakartaKey();
  return { dari: today, sampai: today };
}

/**
 * Returns an array of all Jakarta date keys (YYYY-MM-DD) from dari to sampai,
 * inclusive. Both strings must be valid date keys with dari <= sampai.
 */
export function jakartaDateRange(dari: string, sampai: string): string[] {
  const days: string[] = [];
  // Walk day-by-day in Jakarta time by using the UTC start of each Jakarta day
  const startUtc = fromZonedTime(`${dari} 00:00:00`, TIME_ZONE);
  const endUtc = fromZonedTime(`${sampai} 00:00:00`, TIME_ZONE);
  const cursor = new Date(startUtc);
  while (cursor <= endUtc) {
    days.push(formatInTimeZone(cursor, TIME_ZONE, "yyyy-MM-dd"));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
