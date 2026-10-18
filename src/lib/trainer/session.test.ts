import { describe, expect, it } from "vitest";
import type {
  CoreGrammarExercise,
  CoreVocabularyExercise,
} from "@/lib/content/schemas/core";
import { createRng } from "./random";
import {
  buildGrammarSession,
  buildVocabularySession,
  shuffleChoice,
} from "./session";

function grammar(
  id: string,
  overrides: Partial<CoreGrammarExercise> = {},
): CoreGrammarExercise {
  return {
    id,
    examPart: "core-grammar",
    cefrLevel: "B1",
    topic: "general",
    difficulty: 2,
    register: "written",
    grammarPoint: "tenses",
    prompt: `Question ${id} ___ here.`,
    options: [`${id}-right`, `${id}-wrong-1`, `${id}-wrong-2`],
    answer: 0,
    explanation: { en: "Because." },
    optionNotes: [
      { en: "right note" },
      { en: "wrong note 1" },
      { en: "wrong note 2" },
    ],
    ...overrides,
  };
}

function vocabTask(
  id: string,
  vocabType: CoreVocabularyExercise["vocabType"],
  itemCount = 5,
): CoreVocabularyExercise {
  return {
    id,
    examPart: "core-vocabulary",
    cefrLevel: "B2",
    topic: "work",
    difficulty: 2,
    vocabType,
    options: Array.from({ length: 10 }, (_, i) => `${id}-word-${i}`),
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `${id}-${i}`,
      prompt: vocabType === "usage" ? `Sentence ${i} ___.` : `prompt ${i}`,
      answer: i,
      explanation: { en: "Because." },
    })),
  };
}

describe("shuffleChoice", () => {
  it("keeps the right answer and the notes aligned with their options", () => {
    const choice = grammar("q1");
    for (let seed = 1; seed <= 25; seed++) {
      const shuffled = shuffleChoice(choice, createRng(seed));
      expect(shuffled.options[shuffled.answer]).toBe("q1-right");
      shuffled.options.forEach((option, i) => {
        const original = choice.options.indexOf(option);
        expect(shuffled.optionNotes[i]).toEqual(choice.optionNotes[original]);
      });
    }
  });
});

describe("buildGrammarSession", () => {
  const bank = Array.from({ length: 30 }, (_, i) =>
    grammar(`q${i}`, {
      cefrLevel: i < 20 ? "B1" : "C1",
      grammarPoint: i % 2 ? "odd" : "even",
    }),
  );

  it("draws the requested number of distinct questions", () => {
    const session = buildGrammarSession({
      exercises: bank,
      count: 25,
      rng: createRng(3),
    });
    expect(session).toHaveLength(25);
    expect(new Set(session.map((q) => q.key)).size).toBe(25);
  });

  it("returns a shorter session when the bank is smaller than requested", () => {
    const session = buildGrammarSession({
      exercises: bank.slice(0, 12),
      count: 25,
      rng: createRng(3),
    });
    expect(session).toHaveLength(12);
  });

  it("filters by level, grammar point and a list of keys", () => {
    const c1 = buildGrammarSession({
      exercises: bank,
      count: 25,
      rng: createRng(1),
      levels: ["C1"],
    });
    expect(c1.every((q) => q.level === "C1")).toBe(true);
    expect(c1).toHaveLength(10);

    const odd = buildGrammarSession({
      exercises: bank,
      count: 25,
      rng: createRng(1),
      grammarPoint: "odd",
    });
    expect(odd.every((q) => q.grammarPoint === "odd")).toBe(true);

    const only = buildGrammarSession({
      exercises: bank,
      count: 25,
      rng: createRng(1),
      onlyKeys: ["q3", "q7"],
    });
    expect(only.map((q) => q.key).sort()).toEqual(["q3", "q7"]);
  });

  it("keeps the correct option after shuffling", () => {
    const session = buildGrammarSession({
      exercises: bank,
      count: 25,
      rng: createRng(9),
    });
    for (const q of session) expect(q.options[q.answer]).toBe(`${q.key}-right`);
  });
});

describe("buildVocabularySession", () => {
  const tasks = [
    vocabTask("syn", "synonym"),
    vocabTask("def", "definition"),
    vocabTask("use", "usage"),
    vocabTask("col", "collocation"),
    vocabTask("syn2", "synonym"),
    vocabTask("def2", "definition"),
  ];

  it("fills exactly the requested number of items, trimming the last task", () => {
    const session = buildVocabularySession({
      tasks,
      count: 22,
      rng: createRng(5),
    });
    expect(session.reduce((sum, task) => sum + task.items.length, 0)).toBe(22);
  });

  it("includes all four question types when the bank has them", () => {
    const session = buildVocabularySession({
      tasks,
      count: 20,
      rng: createRng(5),
    });
    expect(new Set(session.map((t) => t.vocabType))).toEqual(
      new Set(["synonym", "definition", "usage", "collocation"]),
    );
  });

  it("keeps each item's answer pointing at the same word after shuffling the bank", () => {
    const session = buildVocabularySession({
      tasks,
      count: 25,
      rng: createRng(8),
    });
    for (const task of session) {
      const original = tasks.find((t) => t.id === task.exerciseId)!;
      for (const item of task.items) {
        const source = original.items.find((i) => i.id === item.itemId)!;
        expect(task.options[item.answer]).toBe(original.options[source.answer]);
      }
    }
  });

  it("can practise only some items, keeping the whole word bank", () => {
    const session = buildVocabularySession({
      tasks,
      count: 25,
      rng: createRng(2),
      onlyKeys: ["use#use-1", "use#use-3"],
    });
    expect(session).toHaveLength(1);
    expect(session[0]!.items.map((i) => i.key).sort()).toEqual([
      "use#use-1",
      "use#use-3",
    ]);
    expect(session[0]!.options).toHaveLength(10);
  });
});
