import { z } from "zod";
import { EXAM_FORMAT } from "@/lib/exam/format";
import {
  LocalizedText,
  NonEmptyText,
  answerIndex,
  exerciseBase,
  isUnique,
  uniqueTexts,
} from "./common";

const { part1, part2, part3, part4 } = EXAM_FORMAT.listening;

export const Speaker = z.enum(["man", "woman", "narrator"]);
export type Speaker = z.infer<typeof Speaker>;

export const ScriptLine = z.strictObject({
  speaker: Speaker,
  text: NonEmptyText,
});
export type ScriptLine = z.infer<typeof ScriptLine>;

export const Script = z.array(ScriptLine).min(1);
export type Script = z.infer<typeof Script>;

/** A recorded file that replaces the synthetic voice when present. */
export const AudioSource = z.strictObject({ src: NonEmptyText });

const listeningBase = { ...exerciseBase, audio: AudioSource.optional() };

export const Listening1Exercise = z.strictObject({
  ...listeningBase,
  examPart: z.literal("listening-1"),
  context: NonEmptyText,
  script: Script,
  question: NonEmptyText,
  options: uniqueTexts(part1.options),
  answer: answerIndex(part1.options),
  explanation: LocalizedText,
});
export type Listening1Exercise = z.infer<typeof Listening1Exercise>;

export const Listening2Exercise = z.strictObject({
  ...listeningBase,
  examPart: z.literal("listening-2"),
  question: NonEmptyText,
  options: uniqueTexts(part2.options),
  speakers: z
    .array(
      z.strictObject({
        script: Script,
        audio: AudioSource.optional(),
        answer: answerIndex(part2.options),
      }),
    )
    .length(part2.speakers)
    .refine(
      (speakers) => isUnique(speakers.map((s) => s.answer)),
      "Each option can match only one speaker",
    ),
  explanation: LocalizedText,
});
export type Listening2Exercise = z.infer<typeof Listening2Exercise>;

export const Listening3Exercise = z.strictObject({
  ...listeningBase,
  examPart: z.literal("listening-3"),
  question: NonEmptyText,
  script: Script.refine(
    (lines) =>
      lines.some((l) => l.speaker === "man") &&
      lines.some((l) => l.speaker === "woman"),
    "The dialogue needs both a man and a woman",
  ),
  statements: z
    .array(
      z.strictObject({
        text: NonEmptyText,
        answer: z.enum(["man", "woman", "both"]),
        explanation: LocalizedText,
      }),
    )
    .length(part3.statements),
});
export type Listening3Exercise = z.infer<typeof Listening3Exercise>;

export const Listening4Exercise = z.strictObject({
  ...listeningBase,
  examPart: z.literal("listening-4"),
  script: Script,
  questions: z
    .array(
      z.strictObject({
        prompt: NonEmptyText,
        options: uniqueTexts(part4.options),
        answer: answerIndex(part4.options),
        explanation: LocalizedText,
        /** Words or tone in the script that reveal the attitude or intention. */
        cues: z.array(NonEmptyText).min(1),
      }),
    )
    .length(part4.questions),
});
export type Listening4Exercise = z.infer<typeof Listening4Exercise>;
