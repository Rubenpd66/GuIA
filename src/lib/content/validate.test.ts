import { describe, expect, it } from "vitest";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import {
  formatReport,
  validateContentSet,
  type ContentSource,
} from "./validate";

const file = (path: string, kind: string, items: unknown[]): ContentSource => ({
  path,
  raw: JSON.stringify({ kind, items }),
});

/** Copies of the fixture grammar question for the "inversion" lesson, with fresh ids. */
const grammarQuestions = (count: number, lesson = "inversion") =>
  Array.from({ length: count }, (_, i) => ({
    ...(structuredClone(validExercises["core-grammar"]) as object),
    id: `cg-${lesson}-extra-${i + 1}`,
    grammarPoint: lesson,
  }));

function validSet(): ContentSource[] {
  return [
    file("exercises/all.json", "exercises", [
      ...Object.values(structuredClone(validExercises)),
      // The lesson needs MIN_QUESTIONS_PER_LESSON questions to avoid a warning.
      ...grammarQuestions(4),
    ]),
    file("lessons/grammar.json", "grammar-lessons", [
      structuredClone(validLessons.grammar),
    ]),
    file("vocabulary/general.json", "vocabulary", [
      structuredClone(validLessons.vocabulary),
    ]),
    file("vocabulary/groups.json", "vocabulary-groups", [
      structuredClone(validLessons.vocabularyGroup),
    ]),
    file("can-do/c1.json", "can-do", [structuredClone(validLessons.canDo)]),
    file("functional/hedging.json", "functional-language", [
      structuredClone(validLessons.functional),
    ]),
  ];
}

describe("validateContentSet", () => {
  it("accepts a valid content set and counts its items", () => {
    const report = validateContentSet(validSet());
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.files).toBe(6);
    expect(report.items).toEqual({
      exercises: 22,
      "grammar-lessons": 1,
      vocabulary: 1,
      "vocabulary-groups": 1,
      "can-do": 1,
      "functional-language": 1,
    });
  });

  it("reports schema errors with a pointer to the item", () => {
    const grammar = structuredClone(validExercises["core-grammar"]) as {
      options: string[];
    };
    grammar.options = grammar.options.slice(0, 2);
    const report = validateContentSet([
      file("exercises/bad.json", "exercises", [grammar]),
    ]);
    expect(report.errors).toContainEqual(
      expect.objectContaining({
        path: "exercises/bad.json",
        pointer: "items/0/options",
      }),
    );
  });

  it("reports an id used in two files, naming both", () => {
    const set = validSet();
    set.push(
      file("exercises/copy.json", "exercises", [
        structuredClone(validExercises["core-grammar"]),
      ]),
    );
    const report = validateContentSet(set);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]?.path).toBe("exercises/copy.json");
    expect(report.errors[0]?.message).toContain("cg-inversion-hardly-01");
    expect(report.errors[0]?.message).toContain("exercises/all.json");
  });

  it("reports a grammar point with no lesson", () => {
    const set = validSet();
    const grammar = structuredClone(validExercises["core-grammar"]) as Record<
      string,
      unknown
    >;
    grammar.id = "cg-mixed-01";
    grammar.grammarPoint = "mixed-conditionals";
    set.push(file("exercises/extra.json", "exercises", [grammar]));
    const report = validateContentSet(set);
    expect(report.errors).toEqual([
      expect.objectContaining({
        path: "exercises/extra.json",
        pointer: "items/0/grammarPoint",
      }),
    ]);
  });

  it("reports broken JSON", () => {
    const report = validateContentSet([
      { path: "broken.json", raw: '{"kind": ' },
    ]);
    expect(report.errors).toEqual([
      expect.objectContaining({ path: "broken.json", pointer: "/" }),
    ]);
  });

  it("warns about American spellings in English text only", () => {
    const set = validSet();
    const reading = (
      JSON.parse(set[0]!.raw) as {
        items: { examPart: string; people?: { text: string }[] }[];
      }
    ).items;
    const opinions = reading.find((item) => item.examPart === "reading-3");
    opinions!.people![0]!.text += " Even the color of the books matters.";
    set[0] = file("exercises/all.json", "exercises", reading);

    const lesson = structuredClone(validLessons.grammar);
    lesson.summary = {
      en: lesson.summary.en,
      es: "Da color y énfasis a la frase.",
    } as typeof lesson.summary;
    set[1] = file("lessons/grammar.json", "grammar-lessons", [lesson]);

    const report = validateContentSet(set);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]?.message).toContain("colour");
  });
});

describe("vocabulary groups and book coverage", () => {
  it("reports a vocabulary set with no group", () => {
    const set = validSet().filter((f) => f.path !== "vocabulary/groups.json");
    const report = validateContentSet(set);
    expect(report.errors).toEqual([
      expect.objectContaining({
        path: "vocabulary/general.json",
        pointer: "items/0/sets/0",
      }),
    ]);
  });

  it("does not need a group for the general topic", () => {
    const report = validateContentSet(validSet());
    expect(report.errors).toEqual([]);
  });

  it("counts the book units covered by lesson references", () => {
    const set = validSet();
    const lesson = structuredClone(validLessons.grammar);
    lesson.references = [
      { book: "egu", unit: 12 },
      { book: "egu", unit: 13 },
    ];
    set[1] = file("lessons/grammar.json", "grammar-lessons", [lesson]);
    const report = validateContentSet(set);
    expect(report.coverage.egu).toEqual({ covered: 2, total: 145 });
    expect(report.coverage.evu).toEqual({ covered: 0, total: 101 });
    expect(formatReport(report)).toContain("English Grammar in Use: 2/145");
  });
});

describe("question bank summary", () => {
  it("counts Core Grammar questions per lesson", () => {
    const set = validSet();
    const second = {
      ...structuredClone(validLessons.grammar),
      slug: "articles",
    };
    set[1] = file("lessons/grammar.json", "grammar-lessons", [
      structuredClone(validLessons.grammar),
      second,
    ]);
    const report = validateContentSet(set);
    expect(report.bank.grammarByLesson).toEqual({ inversion: 5, articles: 0 });
  });

  it("counts Core Vocabulary items by type", () => {
    const usage = structuredClone(validExercises["core-vocabulary"]) as {
      id: string;
      vocabType: string;
      items: { id: string; prompt: string }[];
    };
    usage.id = "cv-usages-work-01";
    usage.vocabType = "usage";
    usage.items.forEach((item, i) => {
      item.id = `cv-usages-work-01-${i}`;
      item.prompt = "She decided to ___ after ten years.";
    });
    const set = validSet();
    set.push(file("exercises/usage.json", "exercises", [usage]));
    const report = validateContentSet(set);
    expect(report.errors).toEqual([]);
    expect(report.bank.vocabularyByType).toEqual({
      synonym: 3,
      definition: 0,
      usage: 3,
      collocation: 0,
    });
  });

  it("warns about lessons with fewer than 5 questions", () => {
    const set = validSet();
    set[0] = file("exercises/all.json", "exercises", [
      ...Object.values(structuredClone(validExercises)),
      ...grammarQuestions(2),
    ]);
    const report = validateContentSet(set);
    expect(report.warnings).toEqual([
      {
        path: "lessons/grammar.json",
        pointer: "items/0",
        message:
          'Lesson "inversion" has 3 Core Grammar questions; aim for at least 5',
      },
    ]);
    expect(validateContentSet(validSet()).warnings).toEqual([]);
  });
});

describe("formatReport", () => {
  it("summarises files, items, errors and warnings", () => {
    const text = formatReport(validateContentSet(validSet()));
    expect(text).toContain("6 files");
    expect(text).toContain("0 errors");
    expect(text).toContain(
      "Core Grammar: 5 questions in 1 lesson (fewest: inversion 5)",
    );
    expect(text).toContain(
      "Core Vocabulary: 3 items (synonym 3, definition 0, usage 0, collocation 0)",
    );
  });
});
