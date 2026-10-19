import { describe, expect, it } from "vitest";
import { countWords } from "./text";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import { EXAM_PARTS } from "@/lib/exam/format";
import {
  mockGaps,
  type ValidationReport,
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

/** The fixture scripts are short; pad them into each part's word range so the set has no warnings. */
function paddedExercises() {
  type Lines = { text: string }[];
  type Loose = {
    examPart: string;
    speakers?: { script: Lines }[];
    script?: Lines;
  };
  const pad = (script: Lines, min: number) => {
    while (countWords(script.map((l) => l.text).join(" ")) < min)
      script[0]!.text += " And that is really all there is to say about it.";
  };
  const exercises = Object.values(structuredClone(validExercises)) as Loose[];
  for (const e of exercises) {
    if (e.examPart === "listening-2")
      e.speakers!.forEach((s) => pad(s.script, 25));
    if (e.examPart === "listening-3") pad(e.script!, 120);
    if (e.examPart === "listening-4") pad(e.script!, 180);
  }
  return exercises;
}

function validSet(): ContentSource[] {
  return [
    file("exercises/all.json", "exercises", [
      ...paddedExercises(),
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

  it("rejects a placement flag on a part the placement test never uses", () => {
    const set = validSet();
    set.push(
      file("exercises/flagged.json", "exercises", [
        {
          ...(structuredClone(validExercises["writing-2"]) as object),
          id: "w2-flagged",
          placement: true,
        },
      ]),
    );
    // An error, not a warning: the flag would hand a paid task to every visitor.
    const { errors } = validateContentSet(set);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain("writing-2");
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
      ...paddedExercises(),
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

describe("Listening checks", () => {
  type L4 = { examPart: string; questions: { cues: string[] }[] };
  const setWith = (edit: (l4: L4) => void) => {
    const set = validSet();
    const exercises = Object.values(structuredClone(validExercises)) as L4[];
    edit(exercises.find((e) => e.examPart === "listening-4")!);
    set[0] = file("exercises/all.json", "exercises", [
      ...exercises,
      ...grammarQuestions(4),
    ]);
    return validateContentSet(set);
  };

  it("rejects a clue that is not in the script", () => {
    const report = setWith((l4) => {
      l4.questions[0]!.cues[0] = "never said";
    });
    expect(report.errors).toEqual([
      {
        path: "exercises/all.json",
        pointer:
          "items/" +
          Object.keys(validExercises).indexOf("listening-4") +
          "/questions/0/cues/0",
        message: 'The clue "never said" does not occur in the script',
      },
    ]);
  });

  it("warns about a script outside the word range and counts tasks per part", () => {
    const report = setWith(() => {});
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((w) => w.message)).toContain(
      "The script has 55 words; listening-4 aims for 180–280",
    );
    expect(report.bank.listeningByPart).toEqual({
      "listening-1": 1,
      "listening-2": 1,
      "listening-3": 1,
      "listening-4": 1,
    });
    expect(report.bank.writingByPart).toEqual({
      "writing-1": 1,
      "writing-2": 1,
      "writing-3": 1,
      "writing-4": 1,
    });
  });
});

describe("speaking models", () => {
  it("warns when a model answer would not fit the time", () => {
    const set = validSet();
    const exercises = JSON.parse(set[0]!.raw) as {
      items: {
        examPart: string;
        questions?: { models: { b2: { segments: { text: string }[] } } }[];
      }[];
    };
    const s1 = exercises.items.find((e) => e.examPart === "speaking-1")!;
    s1.questions![0]!.models.b2.segments[0]!.text = "Yes, I do.";
    set[0] = { ...set[0]!, raw: JSON.stringify(exercises) };
    const report = validateContentSet(set);
    expect(report.errors).toEqual([]);
    expect(report.warnings.map((w) => w.message)).toEqual([
      "The model has 3 words; speaking-1 aims for 40–73",
    ]);
    expect(report.bank.speakingByPart["speaking-4"]).toBe(1);
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

  it("prints the level table and the mock gaps", () => {
    const text = formatReport(validateContentSet(validSet()));
    expect(text).toMatch(/^By level \(A2 B1 B2 C1\): core-grammar 0\/0\/0\/5/m);
    expect(text).toMatch(/^Mock gaps: A2 core-grammar 0\/25/m);
    expect(text).toMatch(/^Placement gaps: core-grammar A2 0\/3/m);
    const full = Object.fromEntries(
      EXAM_PARTS.map((part) => [part, { A2: 99, B1: 0, B2: 0, C1: 0 }]),
    ) as ValidationReport["bank"]["byLevel"];
    expect(mockGaps(full)).toEqual([]);
  });
});

describe("level counts", () => {
  it("counts each exam part per level", () => {
    const { byLevel } = validateContentSet(validSet()).bank;
    expect(byLevel["core-grammar"]).toEqual({ A2: 0, B1: 0, B2: 0, C1: 5 });
    expect(byLevel["core-vocabulary"].B2 + byLevel["core-vocabulary"].C1).toBe(
      3,
    );
  });

  it("finds the parts a level's mock exam cannot fill, counting lower levels too", () => {
    const byLevel = Object.fromEntries(
      EXAM_PARTS.map((part) => [part, { A2: 99, B1: 0, B2: 0, C1: 0 }]),
    ) as ValidationReport["bank"]["byLevel"];
    byLevel["reading-4"] = { A2: 0, B1: 1, B2: 0, C1: 0 };
    expect(mockGaps(byLevel)).toEqual([
      { level: "A2", part: "reading-4", have: 0, need: 1 },
    ]);
  });
});
