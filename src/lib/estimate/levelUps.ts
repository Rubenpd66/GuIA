"use client";

import { useSyncExternalStore } from "react";
import type { ExamPart } from "@/lib/exam/format";
import type { Progress } from "@/lib/progress/schema";
import { EXAM_PARTS } from "@/lib/exam/format";
import { estimateAll, leveledUp, type Estimate } from "./level";

/** Parts whose level went up between two progress records. */
export function partsLeveledUp(before: Progress, after: Progress) {
  const was = estimateAll(before).parts;
  const now = estimateAll(after).parts;
  return EXAM_PARTS.flatMap((part) =>
    leveledUp(was[part], now[part])
      ? [{ part, estimate: now[part] as Estimate }]
      : [],
  );
}

export type LevelUp = { part: ExamPart; estimate: Estimate };

let pending: LevelUp[] = [];
let quiet = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** The placement test and the mock exam show their own levels, so they silence these. */
export function holdLevelUps() {
  quiet++;
  return () => {
    quiet--;
  };
}

export function announceLevelUps(levelUps: LevelUp[]) {
  if (quiet > 0 || levelUps.length === 0) return;
  pending = levelUps;
  emit();
}

export function dismissLevelUps() {
  pending = [];
  emit();
}

export const readLevelUps = () => pending;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const NONE: LevelUp[] = [];

export function useLevelUps(): LevelUp[] {
  return useSyncExternalStore(subscribe, readLevelUps, () => NONE);
}
