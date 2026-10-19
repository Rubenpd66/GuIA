import type { Attempt } from "@/lib/progress/schema";

/** A calendar day in the learner's own time zone, as YYYY-MM-DD. */
export function localDay(time: number): string {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The same local day `days` later (negative for earlier), safe across daylight saving changes. */
export function shiftDay(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  // Noon keeps a one-hour clock change from moving the date.
  return localDay(new Date(y, m - 1, d + days, 12).getTime());
}

/** Whole local days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  const noon = (day: string) => {
    const [y, m, d] = day.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((noon(to) - noon(from)) / 86_400_000);
}

/**
 * Days in a row with at least one attempt, counting back from today. A streak still counts
 * on a day the learner has not practised yet, as long as they practised yesterday.
 */
export function streak(attempts: readonly Attempt[], now: number): number {
  const days = new Set(attempts.map((a) => localDay(a.finishedAt)));
  let day = localDay(now);
  if (!days.has(day)) day = shiftDay(day, -1);
  let count = 0;
  while (days.has(day)) {
    count++;
    day = shiftDay(day, -1);
  }
  return count;
}

// shortcut: one attempt counts for at most an hour, so a tab left open does not inflate the total.
const MAX_ATTEMPT_MS = 60 * 60_000;

/** Minutes practised since Monday (local time). */
export function minutesThisWeek(
  attempts: readonly Attempt[],
  now: number,
): number {
  const today = new Date(now);
  const sinceMonday = (today.getDay() + 6) % 7;
  const monday = shiftDay(localDay(now), -sinceMonday);
  const ms = attempts
    .filter((a) => localDay(a.finishedAt) >= monday)
    .reduce(
      (sum, a) =>
        sum + Math.min(Math.max(0, a.finishedAt - a.startedAt), MAX_ATTEMPT_MS),
      0,
    );
  return Math.round(ms / 60_000);
}
