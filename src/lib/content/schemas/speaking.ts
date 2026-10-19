import { z } from "zod";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { SCENE_IDS } from "@/lib/speaking/scenes";
import { LocalizedText, NonEmptyText, exerciseBase } from "./common";

const { part1, part2, part3, part4 } = EXAM_FORMAT.speaking;

/** An original SVG scene, referenced by id (see `SCENES`), with its alternative text. */
export const SceneImage = z.strictObject({
  sceneId: z.enum(SCENE_IDS),
  alt: LocalizedText,
});
export type SceneImage = z.infer<typeof SceneImage>;

export const StructuredAnswer = z.strictObject({
  segments: z
    .array(
      z.strictObject({
        role: z.enum([
          "intro",
          "development",
          "example",
          "speculation",
          "conclusion",
        ]),
        text: NonEmptyText,
      }),
    )
    .min(1),
});
export type StructuredAnswer = z.infer<typeof StructuredAnswer>;

export const SpeakingQuestion = z.strictObject({
  prompt: NonEmptyText,
  models: z.strictObject({ b2: StructuredAnswer, c: StructuredAnswer }),
});
export type SpeakingQuestion = z.infer<typeof SpeakingQuestion>;

const questions = (count: number) => z.array(SpeakingQuestion).length(count);

export const Speaking1Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("speaking-1"),
  questions: questions(part1.questions),
});
export type Speaking1Exercise = z.infer<typeof Speaking1Exercise>;

export const Speaking2Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("speaking-2"),
  image: SceneImage,
  questions: questions(part2.questions),
});
export type Speaking2Exercise = z.infer<typeof Speaking2Exercise>;

export const Speaking3Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("speaking-3"),
  images: z.array(SceneImage).length(part3.images),
  questions: questions(part3.questions),
});
export type Speaking3Exercise = z.infer<typeof Speaking3Exercise>;

export const Speaking4Exercise = z.strictObject({
  ...exerciseBase,
  examPart: z.literal("speaking-4"),
  image: SceneImage,
  questions: questions(part4.questions),
});
export type Speaking4Exercise = z.infer<typeof Speaking4Exercise>;
