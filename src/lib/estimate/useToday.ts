"use client";

import { useSyncExternalStore } from "react";
import { localDay } from "./activity";

const noop = () => () => {};
const today = () => localDay(Date.now());

/** Today's local date (YYYY-MM-DD) on the client; null while rendering on the server. */
export function useToday(): string | null {
  return useSyncExternalStore(noop, today, () => null);
}

/** Midday of a local date, a safe "now" for day-based counts. */
export function middayOf(day: string): number {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12).getTime();
}
