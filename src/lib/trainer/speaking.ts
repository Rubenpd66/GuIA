import { EXAM_FORMAT } from "@/lib/exam/format";
import { SPEAKING_PART_EXAM } from "./config";

export type SpeakingPart = keyof typeof SPEAKING_PART_EXAM;

/** app decision: a comfortable speaking pace, used only to size the model answers. */
export const WORDS_PER_SECOND = 2.2;

/** Seconds of speech one question gets; part 4 shares its single turn between three questions. */
export function secondsPerQuestion(part: SpeakingPart): number {
  return part === "speaking-4"
    ? EXAM_FORMAT.speaking.part4.answerSeconds /
        EXAM_FORMAT.speaking.part4.questions
    : SPEAKING_PART_EXAM[part].answerSeconds;
}

/** Word range a model answer should fall in (a warning in the validator, not an error). */
export function modelWordRange(part: SpeakingPart): [number, number] {
  const target = secondsPerQuestion(part) * WORDS_PER_SECOND;
  return [Math.round(target * 0.6), Math.round(target * 1.1)];
}
