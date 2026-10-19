import type {
  CoreGrammarExercise,
  CoreVocabularyExercise,
} from "@/lib/content/schemas/core";
import type { CefrLevel } from "@/lib/content/schemas/common";
import type {
  Reading1Exercise,
  Reading3Exercise,
} from "@/lib/content/schemas/reading";
import type {
  Listening1Exercise,
  Listening2Exercise,
} from "@/lib/content/schemas/listening";
import { shuffle, type Rng } from "@/lib/trainer/random";
import {
  buildGrammarSession,
  buildVocabularySession,
} from "@/lib/trainer/session";
import { levelsBySkill, type Step, type StepResult } from "./steps";

export type PlacementBank = {
  grammar: CoreGrammarExercise[];
  vocabulary: CoreVocabularyExercise[];
  reading: (Reading1Exercise | Reading3Exercise)[];
  listening1: Listening1Exercise[];
  listening2: Listening2Exercise[];
};

/** app decision: grammar questions per level, easiest first, so the test gets harder as it goes. */
const GRAMMAR_BY_LEVEL: [CefrLevel, number][] = [
  ["A2", 3],
  ["B1", 4],
  ["B2", 4],
  ["C1", 4],
];
export const PLACEMENT = {
  vocabularyItems: 10,
  listening1Tasks: 3,
  listening2Tasks: 1,
} as const;

const empty = { id: 0, mode: "exam" as const, startedAt: 0 };

/** About 20 minutes: G&V, one Reading task (part 1 or 3) and four short Listening tasks. */
export function buildPlacementSteps(bank: PlacementBank, rng: Rng): Step[] {
  const questions = GRAMMAR_BY_LEVEL.flatMap(([level, count]) =>
    buildGrammarSession({
      exercises: bank.grammar,
      count,
      rng,
      levels: [level],
    }),
  );
  const vocabulary = buildVocabularySession({
    tasks: bank.vocabulary,
    count: PLACEMENT.vocabularyItems,
    rng,
  });
  const reading = shuffle(bank.reading, rng)[0];
  const steps: Step[] = [
    {
      kind: "grammar",
      part: "core-grammar",
      session: { ...empty, questions, deadline: null },
    },
    {
      kind: "vocabulary",
      part: "core-vocabulary",
      session: { ...empty, tasks: vocabulary, deadline: null },
    },
  ];
  if (reading)
    steps.push({
      kind: "reading",
      part: reading.examPart,
      session: { ...empty, tasks: [reading], orders: {}, deadline: null },
    });
  const l1 = shuffle(bank.listening1, rng).slice(0, PLACEMENT.listening1Tasks);
  if (l1.length)
    steps.push({
      kind: "listening",
      part: "listening-1",
      session: { ...empty, tasks: l1 },
    });
  const l2 = shuffle(bank.listening2, rng).slice(0, PLACEMENT.listening2Tasks);
  if (l2.length)
    steps.push({
      kind: "listening",
      part: "listening-2",
      session: { ...empty, tasks: l2 },
    });
  return steps;
}

/** The placement result per skill: the share of right answers across its sections. */
export const placementLevels = levelsBySkill;

/** The three tested parts with the lowest scores, to practise first. */
export function placementPlan(results: readonly StepResult[], count = 3) {
  return [...results]
    .sort((a, b) => a.correct / (a.total || 1) - b.correct / (b.total || 1))
    .slice(0, count)
    .map((result) => result.part);
}
