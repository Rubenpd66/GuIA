import { EXAM_FORMAT } from "@/lib/exam/format";

/**
 * Exam mode for a single Core part: the real number of questions and half of the
 * Core time, because the exam gives 25 minutes for both parts together (app decision).
 */
export const CORE_PART_EXAM = {
  grammar: {
    count: EXAM_FORMAT.core.grammarQuestions,
    seconds: (EXAM_FORMAT.core.minutes * 60) / 2,
  },
  vocabulary: {
    count: EXAM_FORMAT.core.vocabularyQuestions,
    seconds: (EXAM_FORMAT.core.minutes * 60) / 2,
  },
} as const;

/**
 * Exam mode for a single Reading part: the real number of tasks, and a share of the
 * 35 minutes of the Reading paper (app decision; the exam does not time parts).
 */
export const READING_PART_EXAM = {
  "reading-1": { tasks: 1, seconds: 4 * 60 },
  "reading-2": { tasks: EXAM_FORMAT.reading.part2.tasks, seconds: 8 * 60 },
  "reading-3": { tasks: 1, seconds: 8 * 60 },
  "reading-4": { tasks: 1, seconds: 15 * 60 },
} as const;

/** Study sessions are shorter so they fit in a break. */
export const STUDY_SESSION_SIZE = 10;

export function formatClock(milliseconds: number): string {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Exam mode for a single Listening part: how many tasks one session has. The exam fixes no
 * count for part 1, so five is an app decision. Parts are not timed: the audio sets the pace.
 */
export const LISTENING_PART_EXAM = {
  "listening-1": { tasks: 5 },
  "listening-2": { tasks: 1 },
  "listening-3": { tasks: 1 },
  "listening-4": { tasks: 1 },
} as const;
