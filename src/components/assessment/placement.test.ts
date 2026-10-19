import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import {
  CoreGrammarExercise,
  CoreVocabularyExercise,
} from "@/lib/content/schemas/core";
import {
  Listening1Exercise,
  Listening2Exercise,
} from "@/lib/content/schemas/listening";
import { Reading1Exercise } from "@/lib/content/schemas/reading";
import { createRng } from "@/lib/trainer/random";
import {
  buildPlacementSteps,
  placementLevels,
  placementPlan,
  type PlacementBank,
} from "./placement";
import { startStep, stepItems } from "./steps";

const grammar = CoreGrammarExercise.parse(validExercises["core-grammar"]);
const many = <T extends { id: string }>(item: T, count: number, patch = {}) =>
  Array.from({ length: count }, (_, i) => ({
    ...structuredClone(item),
    ...patch,
    id: `${item.id}-${i}`,
  }));

const bank: PlacementBank = {
  grammar: (["A2", "B1", "B2", "C1"] as const).flatMap((level) =>
    many(grammar, 6, { cefrLevel: level }).map((q, i) => ({
      ...q,
      id: `${level}-${i}`,
    })),
  ),
  vocabulary: many(
    CoreVocabularyExercise.parse(validExercises["core-vocabulary"]),
    6,
  ),
  reading: many(Reading1Exercise.parse(validExercises["reading-1"]), 3),
  listening1: many(Listening1Exercise.parse(validExercises["listening-1"]), 5),
  listening2: many(Listening2Exercise.parse(validExercises["listening-2"]), 2),
};

describe("buildPlacementSteps", () => {
  const steps = buildPlacementSteps(bank, createRng(7));

  it("runs G&V, one Reading task and part 1 then part 2 of Listening", () => {
    expect(steps.map((step) => step.part)).toEqual([
      "core-grammar",
      "core-vocabulary",
      "reading-1",
      "listening-1",
      "listening-2",
    ]);
    expect(stepItems(steps[0]!)).toHaveLength(15);
    expect(stepItems(steps[1]!).length).toBeLessThanOrEqual(10);
    expect(steps[3]!.session).toMatchObject({ mode: "exam" });
    expect(
      steps[3]!.kind === "listening" && steps[3]!.session.tasks,
    ).toHaveLength(3);
  });

  it("orders grammar from A2 to C1", () => {
    const step = steps[0]!;
    const levels =
      step.kind === "grammar" ? step.session.questions.map((q) => q.level) : [];
    expect(levels).toEqual([...levels].sort());
    expect(new Set(levels)).toEqual(new Set(["A2", "B1", "B2", "C1"]));
  });

  it("starts a section's clock only when it begins", () => {
    const started = startStep(steps[0]!, 5000, 60);
    expect(started.session).toMatchObject({
      id: 5000,
      startedAt: 5000,
      deadline: 65_000,
    });
    expect(startStep(steps[0]!, 5000, null).session).toMatchObject({
      deadline: null,
    });
  });
});

describe("placement result", () => {
  const results = [
    { part: "core-grammar" as const, correct: 12, total: 15 },
    { part: "core-vocabulary" as const, correct: 9, total: 10 },
    { part: "reading-3" as const, correct: 3, total: 7 },
    { part: "listening-1" as const, correct: 2, total: 3 },
    { part: "listening-2" as const, correct: 4, total: 4 },
  ];

  it("pools the sections of each skill", () => {
    expect(placementLevels(results)).toEqual([
      { skill: "core", ratio: 21 / 25, level: "B2" },
      { skill: "reading", ratio: 3 / 7, level: "A2" },
      { skill: "listening", ratio: 6 / 7, level: "C" },
    ]);
  });

  it("plans the three weakest parts first", () => {
    expect(placementPlan(results)).toEqual([
      "reading-3",
      "listening-1",
      "core-grammar",
    ]);
  });
});
