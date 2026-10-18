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

/** Study sessions are shorter so they fit in a break. */
export const STUDY_SESSION_SIZE = 10;

export function formatClock(milliseconds: number): string {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
