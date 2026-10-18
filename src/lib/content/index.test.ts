import { describe, expect, it } from "vitest";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import {
  buildContentIndex,
  entriesOfGroup,
  exercisesOfPart,
  lessonBySlug,
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
