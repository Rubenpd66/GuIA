import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import { Exercise } from "@/lib/content/schemas/exercise";
import { EXAM_FORMAT, SKILLS } from "@/lib/exam/format";
import { buildMockSteps, mockSeconds, type MockBank } from "./mock";
import { levelsBySkill } from "./steps";

const of = (part: keyof typeof validExercises, copies = 6) =>
  Array.from({ length: copies }, (_, i) => ({
    ...(Exercise.parse(validExercises[part]) as object),
    id: `${part}-${i}`,
  }));

const bank = {
  grammar: of("core-grammar", 30),
  vocabulary: of("core-vocabulary", 10),
  reading: ["reading-1", "reading-2", "reading-3", "reading-4"].flatMap((p) =>
    of(p as "reading-1"),
  ),
  listening: [
    "listening-1",
    "listening-2",
    "listening-3",
    "listening-4",
  ].flatMap((p) => of(p as "listening-1")),
  writing: ["writing-1", "writing-2", "writing-3", "writing-4"].flatMap((p) =>
    of(p as "writing-1"),
  ),
  speaking: ["speaking-1", "speaking-2", "speaking-3", "speaking-4"].flatMap(
    (p) => of(p as "speaking-1"),
  ),
} as unknown as MockBank;

describe("buildMockSteps", () => {
  it("runs every part in exam order", () => {
    const steps = buildMockSteps(bank, SKILLS, 42);
    expect(steps.map((step) => step.part)).toEqual([
      "core-grammar",
      "core-vocabulary",
      "reading-1",
      "reading-2",
      "reading-3",
      "reading-4",
      "listening-1",
      "listening-2",
      "listening-3",
      "listening-4",
      "writing-1",
      "writing-2",
      "writing-3",
      "writing-4",
      "speaking-1",
      "speaking-2",
      "speaking-3",
      "speaking-4",
    ]);
  });

  it("rebuilds the same tasks from the same seed, for resuming", () => {
    const ids = (seed: number) =>
      JSON.stringify(buildMockSteps(bank, SKILLS, seed));
    expect(ids(7)).toBe(ids(7));
    expect(ids(7)).not.toBe(ids(8));
  });

  it("keeps only the chosen components", () => {
    expect(
      buildMockSteps(bank, ["writing"], 1).map((step) => step.kind),
    ).toEqual(["writing", "writing", "writing", "writing"]);
  });

  it("uses the exam's minutes: 25 for Core, 35 for Reading and 50 for Writing", () => {
    const steps = buildMockSteps(bank, SKILLS, 3);
    const minutes = (kinds: string[]) =>
      steps
        .filter((step) => kinds.includes(step.kind))
        .reduce((sum, step) => sum + (mockSeconds(step) ?? 0), 0) / 60;
    expect(minutes(["grammar", "vocabulary"])).toBe(EXAM_FORMAT.core.minutes);
    expect(minutes(["reading"])).toBe(EXAM_FORMAT.reading.minutes);
    expect(minutes(["writing"])).toBe(EXAM_FORMAT.writing.minutes);
    expect(
      steps.filter((s) => s.kind === "listening").map(mockSeconds),
    ).toEqual([null, null, null, null]);
  });
});

describe("levelsBySkill", () => {
  it("pools self-assessed parts like marked ones", () => {
    expect(
      levelsBySkill([
        { part: "writing-1", correct: 4, total: 4 },
        { part: "writing-2", correct: 2, total: 4 },
      ]),
    ).toEqual([{ skill: "writing", ratio: 0.75, level: "B2" }]);
  });
});
