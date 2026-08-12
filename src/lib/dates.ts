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
