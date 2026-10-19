/**
 * Content bundles the client loads on demand (`/banks/<name>`), so pages that need a whole
 * bank do not carry it in their HTML or in every link prefetch.
 */
import type { FlashcardData } from "@/components/flashcards/FlashcardTrainer";
import type { MockBank } from "@/components/assessment/mock";
import type { PlacementBank } from "@/components/assessment/placement";
import type { ExamPart } from "@/lib/exam/format";
import { exercisesOfPart, type ContentIndex } from "./index";

const parts = <P extends ExamPart>(content: ContentIndex, list: P[]) =>
  list.flatMap((part) => exercisesOfPart(content, part));

/** Only the placement test's fixed pool, so the open test never hands out paid material. */
const placementOf = <P extends ExamPart>(content: ContentIndex, part: P) =>
  exercisesOfPart(content, part).filter((exercise) => exercise.placement);

export type Banks = {
  placement: PlacementBank;
  mock: MockBank;
  flashcards: FlashcardData[];
};

export const BANKS: {
  [K in keyof Banks]: (content: ContentIndex) => Banks[K];
} = {
  placement: (content) => ({
    grammar: placementOf(content, "core-grammar"),
    vocabulary: placementOf(content, "core-vocabulary"),
    reading: [
      ...placementOf(content, "reading-1"),
      ...placementOf(content, "reading-3"),
    ],
    listening1: placementOf(content, "listening-1"),
    listening2: placementOf(content, "listening-2"),
  }),
  mock: (content) => ({
    grammar: exercisesOfPart(content, "core-grammar"),
    vocabulary: exercisesOfPart(content, "core-vocabulary"),
    reading: parts(content, [
      "reading-1",
      "reading-2",
      "reading-3",
      "reading-4",
    ]),
    listening: parts(content, [
      "listening-1",
      "listening-2",
      "listening-3",
      "listening-4",
    ]),
    writing: parts(content, [
      "writing-1",
      "writing-2",
      "writing-3",
      "writing-4",
    ]),
    speaking: parts(content, [
      "speaking-1",
      "speaking-2",
      "speaking-3",
      "speaking-4",
    ]),
  }),
  flashcards: (content) => [
    ...content.vocabulary.map((entry) => ({
      id: `v:${entry.id}`,
      deck: "vocabulary" as const,
      level: entry.level,
      topics: entry.topics,
      headword: entry.headword,
      pos: entry.pos,
      definition: entry.definition,
      example: entry.examples[0]!,
      collocations: entry.collocations ?? [],
      ...(entry.falseFriend ? { falseFriend: entry.falseFriend } : {}),
    })),
    ...content.functional.map((phrase) => ({
      id: `f:${phrase.id}`,
      deck: "phrases" as const,
      level: phrase.level,
      topics: [],
      function: phrase.function,
      register: phrase.register,
      phrase: phrase.phrase,
      example: phrase.example,
      ...(phrase.note ? { note: phrase.note } : {}),
    })),
  ],
};

export const BANK_NAMES = Object.keys(BANKS) as (keyof Banks)[];
