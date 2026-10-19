import { z } from "zod";
import { EXAM_PARTS, type WordRange } from "@/lib/exam/format";
import { countGaps, countWords } from "@/lib/content/text";

export const NonEmptyText = z.string().trim().min(1, "Must not be empty");

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words joined by hyphens");

export const CEFR_LEVELS = ["A2", "B1", "B2", "C1"] as const;
export const CefrLevel = z.enum(CEFR_LEVELS);
export type CefrLevel = z.infer<typeof CefrLevel>;

export const TOPICS = [
  "work",
  "education",
  "technology",
  "environment",
  "health-sport",
  "travel",
  "city",
  "culture-leisure",
  "relationships",
  "shopping-consumption",
  "media",
  "general",
] as const;
export const Topic = z.enum(TOPICS);
export type Topic = z.infer<typeof Topic>;

export const Difficulty = z.int().min(1).max(5);

export const ExamPartId = z.enum(EXAM_PARTS);

export const LocalizedText = z.strictObject({
  en: NonEmptyText,
  es: NonEmptyText.optional(),
});
export type LocalizedText = z.infer<typeof LocalizedText>;

export const GapText = NonEmptyText.refine(
  (text) => countGaps(text) === 1,
  "Must contain exactly one gap written as ___",
);

export function isUnique(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

export function uniqueTexts(min: number, max: number = min) {
  return z
    .array(NonEmptyText)
    .min(min)
    .max(max)
    .refine(isUnique, "Items must be unique");
}

export function answerIndex(count: number) {
  return z
    .int()
    .min(0)
    .max(count - 1);
}

/** A gapped sentence with a fixed number of options, as in Core Grammar or Reading part 1. */
export function choiceItem(options: number) {
  return z.strictObject({
    prompt: GapText,
    options: uniqueTexts(options),
    answer: answerIndex(options),
    explanation: LocalizedText,
  });
}

/** Fields every exercise shares, whatever its exam part. */
export const exerciseBase = {
  id: Slug,
  cefrLevel: CefrLevel,
  topic: Topic,
  difficulty: Difficulty,
  /** In the placement test's fixed pool, which is open to everyone whatever their plan. */
  placement: z.literal(true).optional(),
};

/** Returns a message when the text falls outside the word range, or undefined when it fits. */
export function wordRangeProblem(
  text: string,
  [min, max]: WordRange,
): string | undefined {
  const count = countWords(text);
  return count < min || count > max
    ? `Has ${count} words; expected ${min}–${max}`
    : undefined;
}
