import { describe, expect, it } from "vitest";
import { AI_CAPS } from "@/config/ai";
import { TIERS } from "@/lib/access/tiers";
import { writingItems, type WritingExercise } from "@/lib/trainer/writing";
import { buildPrompt, capFor, costUsd, tidy, type Feedback } from "./feedback";

const task = {
  id: "w4-test",
  examPart: "writing-4",
  cefrLevel: "B2",
  context: "You are a member of a language club.",
  situation: "The club plans to cut its weekly meetings.",
  informal: { prompt: "Write to a friend.", models: undefined },
  formal: { prompt: "Write to the manager.", recipient: "the manager" },
} as unknown as WritingExercise;

const [first, second] = writingItems(task).map((i) => i.key) as [string, string];

describe("capFor", () => {
  it("follows the configured caps and gives the free plan none", () => {
    for (const tier of TIERS) expect(capFor(tier)).toBe(AI_CAPS[tier]);
    expect(capFor("free")).toBe(0);
  });
});

describe("costUsd", () => {
  it("prices a million tokens each way", () => {
    expect(costUsd({ input: 1_000_000, output: 1_000_000 })).toBeCloseTo(0.6);
    expect(costUsd({ input: 0, output: 0 })).toBe(0);
  });
});

describe("tidy", () => {
  const base: Feedback = {
    criteria: [
      { criterion: "task", comment: "a" },
      { criterion: "task", comment: "duplicate" },
      { criterion: "register", comment: "b" },
    ],
    corrections: Array.from({ length: 12 }, (_, i) => ({
      original: `o${i}`,
      corrected: `c${i}`,
      explanation: "e",
    })),
    improved: [
      { key: first, text: "one" },
      { key: first, text: "again" },
      { key: "w4-other#0", text: "foreign" },
    ],
  };

  it("caps corrections, keeps one comment per criterion and drops foreign or repeated keys", () => {
    const out = tidy(base, task);
    expect(out.corrections).toHaveLength(8);
    expect(out.criteria.map((c) => c.criterion)).toEqual(["task", "register"]);
    expect(out.improved).toEqual([{ key: first, text: "one" }]);
  });
});

describe("buildPrompt", () => {
  it("sends the task and the texts, and keeps an empty text", () => {
    const { system, user } = buildPrompt(task, { [first]: "Hi Sam" }, "es");
    expect(user).toContain("The club plans to cut");
    expect(user).toContain(`<text key="${first}">\nHi Sam\n</text>`);
    expect(user).toContain(`<text key="${second}">\n\n</text>`);
    expect(system).toContain("CEFR level B2");
    expect(system).toContain("in Spanish");
    expect(system).toContain("never give a mark");
  });

  it("asks for explanations in British English when the interface is English", () => {
    expect(buildPrompt(task, {}, "en").system).toContain("in British English");
  });
});
