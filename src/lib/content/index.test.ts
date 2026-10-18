import { describe, expect, it } from "vitest";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import {
  buildContentIndex,
  canDoByLevel,
  canDoOfLesson,
  entriesOfGroup,
  exercisesOfPart,
  lessonBySlug,
  phrasesByFunction,
  questionsForLesson,
} from "./index";
import { ContentFile } from "./schemas/content-file";

const parse = (kind: string, items: unknown[]) =>
  ContentFile.parse({ kind, items });

function lesson(slug: string, level: string, order: number) {
  return { ...structuredClone(validLessons.grammar), slug, level, order };
}

const files = [
  parse("grammar-lessons", [
    lesson("c1-late", "C1", 2),
    lesson("b1-second", "B1", 2),
    lesson("b1-first", "B1", 1),
    lesson("inversion", "C1", 1),
  ]),
  parse("exercises", Object.values(structuredClone(validExercises))),
  parse("vocabulary", [
    structuredClone(validLessons.vocabulary),
    {
      ...structuredClone(validLessons.vocabulary),
      id: "actually",
      headword: "actually",
    },
  ]),
  parse("vocabulary-groups", [structuredClone(validLessons.vocabularyGroup)]),
];

describe("buildContentIndex", () => {
  const index = buildContentIndex(files);

  it("orders grammar lessons by level, then by their order", () => {
    expect(index.grammarLessons.map((l) => l.slug)).toEqual([
      "b1-first",
      "b1-second",
      "inversion",
      "c1-late",
    ]);
  });

  it("finds a lesson by slug", () => {
    expect(lessonBySlug(index, "inversion")?.level).toBe("C1");
    expect(lessonBySlug(index, "missing")).toBeUndefined();
  });

  it("returns the exercises of one exam part with their narrowed type", () => {
    const grammar = exercisesOfPart(index, "core-grammar");
    expect(grammar).toHaveLength(1);
    expect(grammar[0]?.options).toHaveLength(3);
  });

  it("returns the Core Grammar questions of a lesson", () => {
    expect(questionsForLesson(index, "inversion").map((q) => q.id)).toEqual([
      "cg-inversion-hardly-01",
    ]);
  });

  it("lists the entries of a vocabulary group alphabetically", () => {
    expect(
      entriesOfGroup(index, "false-friends").map((e) => e.headword),
    ).toEqual(["actually", "eventually"]);
    expect(entriesOfGroup(index, "work")).toEqual([]);
  });
});

describe("can-do and functional language lookups", () => {
  const canDo = (
    id: string,
    level: string,
    skill: string,
    lessons: string[],
  ) => ({
    ...structuredClone(validLessons.canDo),
    id,
    level,
    skill,
    links: { lessons, parts: [] },
  });
  const phrase = (id: string, fn: string, level: string, register: string) => ({
    ...structuredClone(validLessons.functional),
    id,
    function: fn,
    level,
    register,
  });
  const index = buildContentIndex([
    parse("grammar-lessons", [lesson("inversion", "C1", 1)]),
    parse("can-do", [
      canDo("c1-writing", "C1", "writing", ["inversion"]),
      canDo("c1-reading", "C1", "reading", []),
      canDo("b1-listening", "B1", "listening", []),
      canDo("c1-spoken", "C1", "spoken-interaction", ["inversion"]),
    ]),
    parse("functional-language", [
      phrase("op-c1-formal", "opinion", "C1", "formal"),
      phrase("hedge-b1", "hedging", "B1", "neutral"),
      phrase("op-b1-informal", "opinion", "B1", "informal"),
      phrase("op-b1-neutral", "opinion", "B1", "neutral"),
    ]),
  ]);

  it("canDoOfLesson returns only statements linking the lesson", () => {
    expect(canDoOfLesson(index, "inversion").map((c) => c.id)).toEqual([
      "c1-spoken",
      "c1-writing",
    ]);
    expect(canDoOfLesson(index, "articles")).toEqual([]);
  });

  it("canDoByLevel groups by level and orders by skill", () => {
    const byLevel = canDoByLevel(index);
    expect(byLevel.C1.map((c) => c.id)).toEqual([
      "c1-spoken",
      "c1-reading",
      "c1-writing",
    ]);
    expect(byLevel.B1.map((c) => c.id)).toEqual(["b1-listening"]);
    expect(byLevel.B2).toEqual([]);
  });

  it("phrasesByFunction keeps enum order and drops empty functions", () => {
    expect(
      phrasesByFunction(index).map(({ function: fn, phrases }) => [
        fn,
        phrases.map((p) => p.id),
      ]),
    ).toEqual([
      ["opinion", ["op-b1-neutral", "op-b1-informal", "op-c1-formal"]],
      ["hedging", ["hedge-b1"]],
    ]);
  });
});
