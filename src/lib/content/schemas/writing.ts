import { z } from "zod";
import { EXAM_FORMAT, type WordRange } from "@/lib/exam/format";
import { countWords } from "@/lib/content/text";
import {
  LocalizedText,
  NonEmptyText,
  exerciseBase,
  wordRangeProblem,
} from "./common";

const { part1, part2, part3, part4 } = EXAM_FORMAT.writing;

export const AnnotatedText = z
  .strictObject({
    text: NonEmptyText,
    annotations: z.array(
      z.strictObject({
        quote: NonEmptyText,
        kind: z.enum([
          "connector",
          "advanced-structure",
          "register",
          "vocabulary",
        ]),
        note: LocalizedText,
      }),
    ),
  })
  .superRefine((model, ctx) => {
    model.annotations.forEach((annotation, i) => {
      if (!model.text.includes(annotation.quote)) {
        ctx.addIssue({
          code: "custom",
          path: ["annotations", i, "quote"],
          message: `"${annotation.quote}" does not appear in the text`,
          input: annotation.quote,
        });
      }
    });
  });
export type AnnotatedText = z.infer<typeof AnnotatedText>;

/** A B2 and a C model answer, both within the part's word range. */
function modelPair(range: WordRange) {
  return z
    .strictObject({ b2: AnnotatedText, c: AnnotatedText })
    .superRefine((models, ctx) => {
      for (const level of ["b2", "c"] as const) {
        const problem = wordRangeProblem(models[level].text, range);
        if (problem) {
          ctx.addIssue({
            code: "custom",
            path: [level, "text"],
            message: problem,
            input: models[level].text,
          });
        }
      }
    });
}

export const Writing1Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("writing-1"),
  context: NonEmptyText,
  messages: z
    .array(
      z.strictObject({
        prompt: NonEmptyText,
        sampleAnswers: z
          .array(
            NonEmptyText.refine(
              (answer) => countWords(answer) <= part1.maxWords,
              `Word-level answers use at most ${part1.maxWords} words`,
            ),
          )
          .min(1),
      }),
    )
    .length(part1.messages),
});
export type Writing1Exercise = z.infer<typeof Writing1Exercise>;

export const Writing2Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("writing-2"),
  context: NonEmptyText,
  prompt: NonEmptyText,
  models: modelPair(part2.words),
});
export type Writing2Exercise = z.infer<typeof Writing2Exercise>;

export const Writing3Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("writing-3"),
  context: NonEmptyText,
  questions: z
    .array(
      z.strictObject({ prompt: NonEmptyText, models: modelPair(part3.words) }),
    )
    .length(part3.questions),
});
export type Writing3Exercise = z.infer<typeof Writing3Exercise>;

export const Writing4Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("writing-4"),
  context: NonEmptyText,
  /** The announced change both emails react to. */
  situation: NonEmptyText,
  informal: z.strictObject({
    prompt: NonEmptyText,
    models: modelPair(part4.informalWords),
  }),
  formal: z.strictObject({
    prompt: NonEmptyText,
    recipient: NonEmptyText,
    models: modelPair(part4.formalWords),
  }),
});
export type Writing4Exercise = z.infer<typeof Writing4Exercise>;
