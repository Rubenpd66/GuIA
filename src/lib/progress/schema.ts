import { z } from "zod";
import { ExamPartId } from "@/lib/content/schemas/common";

export const Attempt = z.object({
  id: z.string().min(1),
  part: ExamPartId,
  mode: z.enum(["study", "exam"]),
  startedAt: z.number(),
  finishedAt: z.number(),
  correct: z.int().min(0),
  total: z.int().min(0),
});
export type Attempt = z.infer<typeof Attempt>;

export const MistakeEntry = z.object({
  part: ExamPartId,
  count: z.int().min(1),
  /** Correct answers in a row since the last mistake. */
  streak: z.int().min(0),
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
export const LocalDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
