import * as z from "zod/mini";
import { EXAM_PARTS } from "@/lib/exam/format";

// zod/mini: these schemas run in the browser on every page that reads progress.
const ExamPart = z.enum(EXAM_PARTS);
const Count = z.int().check(z.minimum(0));

export const Attempt = z.object({
  id: z.string().check(z.minLength(1)),
  part: ExamPart,
  mode: z.enum(["study", "exam"]),
  startedAt: z.number(),
  finishedAt: z.number(),
  correct: Count,
  total: Count,
});
export type Attempt = z.infer<typeof Attempt>;

export const MistakeEntry = z.object({
  part: ExamPart,
  count: z.int().check(z.minimum(1)),
  /** Correct answers in a row since the last mistake. */
  streak: Count,
  lastSeen: z.number(),
});
export type MistakeEntry = z.infer<typeof MistakeEntry>;

/** Everything GuIA remembers about the learner. Stored only in their browser. */
export const Progress = z.object({
  version: z.literal(1),
  attempts: z.array(Attempt),
  /** Keyed by exercise id, or exercise id # item id for tasks with several items. */
  mistakes: z.record(z.string(), MistakeEntry),
});
export type Progress = z.infer<typeof Progress>;

/** A calendar day, YYYY-MM-DD, in the learner's own time zone (exam date, card due dates). */
export const LocalDay = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));
