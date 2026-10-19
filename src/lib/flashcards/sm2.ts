/**
 * Spaced repetition with the classic SM-2 algorithm. Days are local calendar days
 * (YYYY-MM-DD), so a card due "tomorrow" is due after midnight in the learner's time zone.
 */
import { z } from "zod";
import { shiftDay } from "@/lib/estimate/activity";
import { LocalDay } from "@/lib/progress/schema";

export const GRADES = { again: 1, hard: 3, good: 4, easy: 5 } as const;
export type Grade = keyof typeof GRADES;

export const CardState = z.object({
  ease: z.number().min(1.3),
  /** Days until the next review. */
  interval: z.int().min(0),
  /** Right answers in a row. */
  reps: z.int().min(0),
  due: LocalDay,
});
export type CardState = z.infer<typeof CardState>;

const START_EASE = 2.5;
const MIN_EASE = 1.3;

export function review(
  card: CardState | undefined,
  grade: Grade,
  today: string,
): CardState {
  const q = GRADES[grade];
  const previous = card ?? {
    ease: START_EASE,
    interval: 0,
    reps: 0,
    due: today,
  };
  const ease = Math.max(
    MIN_EASE,
    previous.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
  );
  if (q < 3) return { ease, interval: 1, reps: 0, due: shiftDay(today, 1) };
  const interval =
    previous.reps === 0
      ? 1
      : previous.reps === 1
        ? 6
        : Math.round(previous.interval * ease);
  return {
    ease,
    interval,
    reps: previous.reps + 1,
    due: shiftDay(today, interval),
  };
}

export const isDue = (card: CardState, today: string) => card.due <= today;
