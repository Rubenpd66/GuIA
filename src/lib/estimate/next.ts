import { EXAM_PARTS, type ExamPart } from "@/lib/exam/format";
import type { Progress } from "@/lib/progress/schema";
import { daysBetween, localDay } from "./activity";
import type { Estimates } from "./level";

export type Suggestion =
  | { kind: "mock"; daysLeft: number }
  | { kind: "start"; part: ExamPart }
  | { kind: "weakest"; part: ExamPart }
  | { kind: "mistakes"; part: ExamPart; count: number };

/** app decision: from this many days before the exam, a mock exam comes first. */
export const MOCK_WINDOW_DAYS = 14;

/**
 * What to practise next, best first: a mock exam when the exam is close, then a part with no
 * data, then the weakest part, then the part with the most mistakes waiting.
 */
export function suggestions(
  progress: Progress,
  estimates: Estimates,
  now: number,
  examDate?: string | null,
): Suggestion[] {
  const list: Suggestion[] = [];
  if (examDate) {
    const daysLeft = daysBetween(localDay(now), examDate);
    if (daysLeft >= 0 && daysLeft <= MOCK_WINDOW_DAYS)
      list.push({ kind: "mock", daysLeft });
  }
  const untried = EXAM_PARTS.find((part) => !estimates.parts[part]);
  if (untried) list.push({ kind: "start", part: untried });
  const [weakest] = weakestParts(estimates, 1);
  if (weakest) list.push({ kind: "weakest", part: weakest });
  const counts = new Map<ExamPart, number>();
  for (const entry of Object.values(progress.mistakes))
    counts.set(entry.part, (counts.get(entry.part) ?? 0) + 1);
  const most = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (most) list.push({ kind: "mistakes", part: most[0], count: most[1] });
  return list;
}

/** The parts with the lowest estimates, for "weak points". */
export function weakestParts(estimates: Estimates, count = 3): ExamPart[] {
  return EXAM_PARTS.filter((part) => estimates.parts[part])
    .sort((a, b) => estimates.parts[a]!.ratio - estimates.parts[b]!.ratio)
    .slice(0, count);
}
