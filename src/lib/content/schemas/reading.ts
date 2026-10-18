import { z } from "zod";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { countWords } from "@/lib/content/text";
import {
  LocalizedText,
  NonEmptyText,
  answerIndex,
  choiceItem,
  exerciseBase,
  isUnique,
  uniqueTexts,
} from "./common";

const { part1, part2, part3, part4 } = EXAM_FORMAT.reading;

export const Reading1Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("reading-1"),
  context: NonEmptyText.optional(),
  items: z.array(choiceItem(part1.options)).length(part1.sentences),
});
export type Reading1Exercise = z.infer<typeof Reading1Exercise>;

const lastSentence = part2.sentences - 1;

/** One text cohesion task. `sentences` is stored in the correct order; the first stays fixed. */
export const Reading2Exercise = z
  .strictObject({
    ...exerciseBase,
    examPart: z.literal("reading-2"),
    title: NonEmptyText.optional(),
    sentences: uniqueTexts(part2.sentences),
    explanation: LocalizedText,
    cohesionHints: z
      .array(
        z.strictObject({
          sentence: z.int().min(1).max(lastSentence),
          phrase: NonEmptyText,
          refersTo: z.int().min(0).max(lastSentence),
          note: LocalizedText.optional(),
        }),
      )
      .optional(),
  })
  .superRefine((task, ctx) => {
    task.cohesionHints?.forEach((hint, i) => {
      if (!task.sentences[hint.sentence]?.includes(hint.phrase)) {
        ctx.addIssue({
          code: "custom",
          path: ["cohesionHints", i, "phrase"],
          message: `"${hint.phrase}" does not appear in sentence ${hint.sentence}`,
          input: hint.phrase,
        });
      }
      if (hint.refersTo === hint.sentence) {
        ctx.addIssue({
          code: "custom",
          path: ["cohesionHints", i, "refersTo"],
          message: "A hint must point to a different sentence",
          input: hint.refersTo,
        });
      }
    });
  });
export type Reading2Exercise = z.infer<typeof Reading2Exercise>;

export const Reading3Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("reading-3"),
  question: NonEmptyText,
  people: z
    .array(z.strictObject({ name: NonEmptyText, text: NonEmptyText }))
    .length(part3.people),
  statements: z
    .array(
      z.strictObject({
        text: NonEmptyText,
        answer: answerIndex(part3.people),
        explanation: LocalizedText,
      }),
    )
    .length(part3.statements),
});
export type Reading3Exercise = z.infer<typeof Reading3Exercise>;

export const Reading4Exercise = z
  .strictObject({
    ...exerciseBase,
    examPart: z.literal("reading-4"),
    title: NonEmptyText,
    paragraphs: z.array(NonEmptyText).length(part4.paragraphs),
    headings: uniqueTexts(part4.headings),
    /** `answers[i]` is the index of the heading that matches paragraph `i`. */
    answers: z
      .array(answerIndex(part4.headings))
      .length(part4.paragraphs)
      .refine(isUnique, "Each heading can match only one paragraph"),
    explanations: z.array(LocalizedText).length(part4.paragraphs),
  })
  .superRefine((task, ctx) => {
    const total = task.paragraphs.reduce((sum, p) => sum + countWords(p), 0);
    const { min, max } = part4.words;
    if (total < min || total > max) {
      ctx.addIssue({
        code: "custom",
        path: ["paragraphs"],
        message: `The text has ${total} words; expected ${min}–${max}`,
        input: total,
      });
    }
  });
export type Reading4Exercise = z.infer<typeof Reading4Exercise>;
