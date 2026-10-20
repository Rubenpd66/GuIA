import { z } from "zod";
import { VOCAB_TYPES } from "@/lib/content/levels";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { countGaps } from "@/lib/content/text";
import {
  GapText,
  LocalizedText,
  NonEmptyText,
  Slug,
  answerIndex,
  exerciseBase,
  uniqueTexts,
} from "./common";

const { grammarOptions, vocabularyBank } = EXAM_FORMAT.core;

export const CoreGrammarExercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("core-grammar"),
  register: z.enum(["written", "spoken"]),
  grammarPoint: Slug,
  prompt: GapText,
  options: uniqueTexts(grammarOptions),
  answer: answerIndex(grammarOptions),
  explanation: LocalizedText,
  /** Why each option is right or wrong, in the same order as `options`. */
  optionNotes: z.array(LocalizedText).length(grammarOptions),
});
export type CoreGrammarExercise = z.infer<typeof CoreGrammarExercise>;

export { VOCAB_TYPES, type VocabType } from "@/lib/content/levels";

export const CoreVocabularyExercise = z
  .strictObject({
    ...exerciseBase,
    examPart: z.literal("core-vocabulary"),
    vocabType: z.enum(VOCAB_TYPES),
    instructions: NonEmptyText.optional(),
    /** Word bank shared by every item of the task. */
    options: uniqueTexts(vocabularyBank.min, vocabularyBank.max),
    items: z
      .array(
        z.strictObject({
          id: Slug,
          prompt: NonEmptyText,
          answer: z.int().min(0),
          explanation: LocalizedText,
        }),
      )
      .min(1)
      .max(10),
  })
  .superRefine((task, ctx) => {
    const usedBy = new Map<number, number>();
    task.items.forEach((item, i) => {
      if (item.answer >= task.options.length) {
        ctx.addIssue({
          code: "custom",
          path: ["items", i, "answer"],
          message: `Answer ${item.answer} is outside the word bank (0–${task.options.length - 1})`,
          input: item.answer,
        });
      }
      const first = usedBy.get(item.answer);
      if (first !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["items", i, "answer"],
          message: `Same answer as item ${first}; each word in the bank answers one item`,
          input: item.answer,
        });
      } else {
        usedBy.set(item.answer, i);
      }
      if (task.vocabType === "usage" && countGaps(item.prompt) !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["items", i, "prompt"],
          message: "Usage items need exactly one gap written as ___",
          input: item.prompt,
        });
      }
    });
  });
export type CoreVocabularyExercise = z.infer<typeof CoreVocabularyExercise>;
