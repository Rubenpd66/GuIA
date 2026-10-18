import { describe, expect, it } from "vitest";
import { validLessons } from "../../../../tests/fixtures/content";
import {
  CanDo,
  FunctionalPhrase,
  GrammarLesson,
  VocabularyEntry,
} from "./lessons";

describe("lesson schemas", () => {
  it("accept the valid fixtures", () => {
    expect(GrammarLesson.safeParse(validLessons.grammar).success).toBe(true);
    expect(VocabularyEntry.safeParse(validLessons.vocabulary).success).toBe(
      true,
    );
    expect(CanDo.safeParse(validLessons.canDo).success).toBe(true);
    expect(FunctionalPhrase.safeParse(validLessons.functional).success).toBe(
      true,
    );
  });

  it("require 8 to 12 examples in a grammar lesson", () => {
    const seven = structuredClone(validLessons.grammar);
    seven.examples = seven.examples.slice(0, 7);
    expect(GrammarLesson.safeParse(seven).success).toBe(false);

    const thirteen = structuredClone(validLessons.grammar);
    thirteen.examples = [
      ...thirteen.examples,
      ...thirteen.examples.slice(0, 5),
    ];
    expect(GrammarLesson.safeParse(thirteen).success).toBe(false);
  });

  it("rejects slugs with spaces", () => {
    const lesson = {
      ...structuredClone(validLessons.grammar),
      slug: "present perfect",
    };
    expect(GrammarLesson.safeParse(lesson).success).toBe(false);
  });

  it("rejects can-do links to unknown exam parts", () => {
    const canDo = structuredClone(validLessons.canDo);
    canDo.links.parts = ["reading-9"];
    expect(CanDo.safeParse(canDo).success).toBe(false);
  });
});
