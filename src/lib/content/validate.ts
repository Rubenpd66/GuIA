import { BOOKS, BOOK_IDS, type BookId } from "@/config/books";
import { coveredUnits } from "./coverage";
import {
  CONTENT_KINDS,
  ContentFile,
  type ContentKind,
} from "./schemas/content-file";
import { VOCAB_TYPES, type VocabType } from "./schemas/core";
import type { Script } from "./schemas/listening";
import { countWords, findAmericanSpellings, stripBom } from "./text";
import { modelWordRange } from "@/lib/trainer/speaking";
import { MOCK_NEEDS } from "@/lib/trainer/config";
import { placementGaps } from "@/components/assessment/placement";
import { BANKS } from "./banks";
import { buildContentIndex } from "./index";
import { EXAM_PARTS, type ExamPart } from "@/lib/exam/format";
import { CEFR_LEVELS, type CefrLevel } from "./schemas/common";

/** Words per recording in each Listening part (app decision; the exam does not publish them). */
const LISTENING_WORDS = {
  "listening-1": { min: 15, max: 70 },
  "listening-2": { min: 25, max: 60 },
  "listening-3": { min: 120, max: 220 },
  "listening-4": { min: 180, max: 280 },
} as const;
const LISTENING_PARTS = Object.keys(
  LISTENING_WORDS,
) as (keyof typeof LISTENING_WORDS)[];
const WRITING_PARTS = [
  "writing-1",
  "writing-2",
  "writing-3",
  "writing-4",
] as const;
const SPEAKING_PARTS = [
  "speaking-1",
  "speaking-2",
  "speaking-3",
  "speaking-4",
] as const;

/** Below this, "Practise this point" gives a session too short to be useful. */
export const MIN_QUESTIONS_PER_LESSON = 5;

export type ContentSource = { path: string; raw: string };
export type ContentIssue = { path: string; pointer: string; message: string };
export type ValidationReport = {
  errors: ContentIssue[];
  warnings: ContentIssue[];
  files: number;
  items: Record<ContentKind, number>;
  /** Reference-book units that at least one lesson or vocabulary group points to. */
  coverage: Record<BookId, { covered: number; total: number }>;
  /** What the placement test's flagged pool lacks for one full test (see `placementGaps`). */
  placementGaps: string[];
  /** Size of the Core question bank: questions per grammar lesson and vocabulary items per type. */
  bank: {
    grammarByLesson: Record<string, number>;
    vocabularyByType: Record<VocabType, number>;
    /** Listening tasks per part. */
    listeningByPart: Record<keyof typeof LISTENING_WORDS, number>;
    /** Writing tasks per part. */
    writingByPart: Record<(typeof WRITING_PARTS)[number], number>;
    /** Speaking tasks per part. */
    speakingByPart: Record<(typeof SPEAKING_PARTS)[number], number>;
    /** Per part and level: questions for Core Grammar, items for Core Vocabulary, else tasks. */
    byLevel: Record<ExamPart, Record<CefrLevel, number>>;
  };
};

export type MockGap = {
  level: CefrLevel;
  part: ExamPart;
  have: number;
  need: number;
};

/**
 * Parts a level's mock exam cannot fill. A tier's mock draws from every level it unlocks, so
 * a level counts its own material and everything easier.
 */
export function mockGaps(
  byLevel: ValidationReport["bank"]["byLevel"],
): MockGap[] {
  return CEFR_LEVELS.flatMap((level, i) =>
    EXAM_PARTS.flatMap((part) => {
      const have = CEFR_LEVELS.slice(0, i + 1).reduce(
        (sum, l) => sum + byLevel[part][l],
        0,
      );
      const need = MOCK_NEEDS[part];
      return have < need ? [{ level, part, have, need }] : [];
    }),
  );
}

type ParsedFile = { path: string; file: ContentFile };
type Location = { path: string; pointer: string };

const pointerOf = (path: readonly PropertyKey[]) =>
  path.length === 0 ? "/" : path.map(String).join("/");

/**
 * Validates a whole content set: JSON syntax, the schema of each file, ids that must be
 * unique across files, references between files, and British spelling (as warnings).
 */
export function validateContentSet(sources: ContentSource[]): ValidationReport {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const items = Object.fromEntries(
    CONTENT_KINDS.map((kind) => [kind, 0]),
  ) as Record<ContentKind, number>;
  const parsed: ParsedFile[] = [];

  for (const source of sources) {
    let json: unknown;
    try {
      json = JSON.parse(stripBom(source.raw));
    } catch (error) {
      errors.push({
        path: source.path,
        pointer: "/",
        message: `Invalid JSON: ${(error as Error).message}`,
      });
      continue;
    }

    const result = ContentFile.safeParse(json);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          path: source.path,
          pointer: pointerOf(issue.path),
          message: issue.message,
        });
      }
      continue;
    }

    parsed.push({ path: source.path, file: result.data });
    items[result.data.kind] += result.data.items.length;
    collectSpellingWarnings(result.data, [], source.path, warnings);
  }

  const listening = checkListening(parsed);
  errors.push(
    ...findDuplicateIds(parsed),
    ...findBrokenReferences(parsed),
    ...listening.errors,
  );
  const bank = questionBank(parsed);
  warnings.push(
    ...findThinLessons(parsed, bank.grammarByLesson),
    ...listening.warnings,
    ...speakingModelWarnings(parsed),
  );
  return {
    errors,
    warnings,
    files: sources.length,
    items,
    coverage: bookCoverage(parsed),
    placementGaps: placementGaps(
      BANKS.placement(buildContentIndex(parsed.map(({ file }) => file))),
    ),
    bank,
  };
}

function questionBank(parsed: ParsedFile[]): ValidationReport["bank"] {
  const grammarByLesson: Record<string, number> = {};
  const vocabularyByType = Object.fromEntries(
    VOCAB_TYPES.map((type) => [type, 0]),
  ) as Record<VocabType, number>;
  for (const { file } of parsed) {
    if (file.kind === "grammar-lessons")
      file.items.forEach((lesson) => (grammarByLesson[lesson.slug] ??= 0));
  }
  for (const { file } of parsed) {
    if (file.kind !== "exercises") continue;
    for (const exercise of file.items) {
      if (
        exercise.examPart === "core-grammar" &&
        exercise.grammarPoint in grammarByLesson
      )
        grammarByLesson[exercise.grammarPoint]! += 1;
      if (exercise.examPart === "core-vocabulary")
        vocabularyByType[exercise.vocabType] += exercise.items.length;
    }
  }
  const listeningByPart = Object.fromEntries(
    LISTENING_PARTS.map((part) => [part, 0]),
  ) as ValidationReport["bank"]["listeningByPart"];
  const writingByPart = Object.fromEntries(
    WRITING_PARTS.map((part) => [part, 0]),
  ) as ValidationReport["bank"]["writingByPart"];
  const speakingByPart = Object.fromEntries(
    SPEAKING_PARTS.map((part) => [part, 0]),
  ) as ValidationReport["bank"]["speakingByPart"];
  for (const { file } of parsed) {
    if (file.kind !== "exercises") continue;
    for (const exercise of file.items) {
      if (exercise.examPart in listeningByPart)
        listeningByPart[exercise.examPart as keyof typeof listeningByPart] += 1;
      if (exercise.examPart in writingByPart)
        writingByPart[exercise.examPart as keyof typeof writingByPart] += 1;
      if (exercise.examPart in speakingByPart)
        speakingByPart[exercise.examPart as keyof typeof speakingByPart] += 1;
    }
  }
  const byLevel = Object.fromEntries(
    EXAM_PARTS.map((part) => [
      part,
      Object.fromEntries(CEFR_LEVELS.map((level) => [level, 0])),
    ]),
  ) as ValidationReport["bank"]["byLevel"];
  for (const { file } of parsed) {
    if (file.kind !== "exercises") continue;
    for (const exercise of file.items)
      byLevel[exercise.examPart][exercise.cefrLevel] +=
        exercise.examPart === "core-vocabulary" ? exercise.items.length : 1;
  }
  return {
    grammarByLesson,
    vocabularyByType,
    listeningByPart,
    writingByPart,
    speakingByPart,
    byLevel,
  };
}

const scriptText = (script: Script) => script.map((l) => l.text).join(" ");

/** Listening: clue phrases must occur in the script (error); script length is a warning. */
function checkListening(parsed: ParsedFile[]) {
  const errors: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  for (const { path, file } of parsed) {
    if (file.kind !== "exercises") continue;
    file.items.forEach((exercise, i) => {
      if (!(exercise.examPart in LISTENING_WORDS)) return;
      const part = exercise.examPart as keyof typeof LISTENING_WORDS;
      const scripts: { pointer: string; script: Script }[] =
        exercise.examPart === "listening-2"
          ? exercise.speakers.map((s, j) => ({
              pointer: `items/${i}/speakers/${j}/script`,
              script: s.script,
            }))
          : exercise.examPart === "listening-1" ||
              exercise.examPart === "listening-3" ||
              exercise.examPart === "listening-4"
            ? [{ pointer: `items/${i}/script`, script: exercise.script }]
            : [];
      for (const { pointer, script } of scripts) {
        const words = countWords(scriptText(script));
        const { min, max } = LISTENING_WORDS[part];
        if (words < min || words > max)
          warnings.push({
            path,
            pointer,
            message: `The script has ${words} words; ${part} aims for ${min}–${max}`,
          });
      }
      if (exercise.examPart === "listening-4") {
        const text = scriptText(exercise.script).toLowerCase();
        exercise.questions.forEach((question, j) =>
          question.cues.forEach((cue, k) => {
            if (!text.includes(cue.toLowerCase()))
              errors.push({
                path,
                pointer: `items/${i}/questions/${j}/cues/${k}`,
                message: `The clue "${cue}" does not occur in the script`,
              });
          }),
        );
      }
    });
  }
  return { errors, warnings };
}

/** Speaking: model answers that would not fit the time (a warning; the pace is an app decision). */
function speakingModelWarnings(parsed: ParsedFile[]): ContentIssue[] {
  const warnings: ContentIssue[] = [];
  for (const { path, file } of parsed) {
    if (file.kind !== "exercises") continue;
    file.items.forEach((exercise, i) => {
      if (
        !exercise.examPart.startsWith("speaking-") ||
        !("questions" in exercise)
      )
        return;
      const part = exercise.examPart as (typeof SPEAKING_PARTS)[number];
      const [min, max] = modelWordRange(part);
      (
        exercise as {
          questions: {
            models: Record<"b2" | "c", { segments: { text: string }[] }>;
          }[];
        }
      ).questions.forEach((question, j) => {
        for (const level of ["b2", "c"] as const) {
          const words = countWords(
            question.models[level].segments.map((s) => s.text).join(" "),
          );
          if (words < min || words > max)
            warnings.push({
              path,
              pointer: `items/${i}/questions/${j}/models/${level}`,
              message: `The model has ${words} words; ${part} aims for ${min}–${max}`,
            });
        }
      });
    });
  }
  return warnings;
}

function findThinLessons(
  parsed: ParsedFile[],
  grammarByLesson: Record<string, number>,
): ContentIssue[] {
  return parsed.flatMap(({ path, file }) =>
    file.kind === "grammar-lessons"
      ? file.items.flatMap((lesson, i) => {
          const count = grammarByLesson[lesson.slug] ?? 0;
          return count < MIN_QUESTIONS_PER_LESSON
            ? [
                {
                  path,
                  pointer: `items/${i}`,
                  message: `Lesson "${lesson.slug}" has ${count} Core Grammar questions; aim for at least ${MIN_QUESTIONS_PER_LESSON}`,
                },
              ]
            : [];
        })
      : [],
  );
}

function bookCoverage(parsed: ParsedFile[]): ValidationReport["coverage"] {
  const references = parsed.flatMap(({ file }) =>
    file.kind === "grammar-lessons" || file.kind === "vocabulary-groups"
      ? file.items.flatMap((item) => item.references)
      : [],
  );
  return Object.fromEntries(
    BOOK_IDS.map((book) => [
      book,
      {
        covered: coveredUnits(references, book).length,
        total: BOOKS[book].units,
      },
    ]),
  ) as ValidationReport["coverage"];
}

function idsOf({
  file,
}: ParsedFile): { namespace: string; id: string; pointer: string }[] {
  switch (file.kind) {
    case "exercises":
      return file.items.flatMap((exercise, i) => [
        { namespace: "exercise", id: exercise.id, pointer: `items/${i}/id` },
        ...(exercise.examPart === "core-vocabulary"
          ? exercise.items.map((item, j) => ({
              namespace: "exercise",
              id: item.id,
              pointer: `items/${i}/items/${j}/id`,
            }))
          : []),
      ]);
    case "grammar-lessons":
      return file.items.map((lesson, i) => ({
        namespace: "grammar lesson",
        id: lesson.slug,
        pointer: `items/${i}/slug`,
      }));
    case "vocabulary-groups":
      return file.items.map((group, i) => ({
        namespace: "vocabulary group",
        id: group.slug,
        pointer: `items/${i}/slug`,
      }));
    case "vocabulary":
    case "can-do":
    case "functional-language":
      return file.items.map((item, i) => ({
        namespace: file.kind,
        id: item.id,
        pointer: `items/${i}/id`,
      }));
  }
}

function findDuplicateIds(parsed: ParsedFile[]): ContentIssue[] {
  const seen = new Map<string, Location>();
  const issues: ContentIssue[] = [];
  for (const entry of parsed) {
    for (const { namespace, id, pointer } of idsOf(entry)) {
      const key = `${namespace}:${id}`;
      const first = seen.get(key);
      if (first) {
        issues.push({
          path: entry.path,
          pointer,
          message: `Duplicate ${namespace} id "${id}"; already used in ${first.path} at ${first.pointer}`,
        });
      } else {
        seen.set(key, { path: entry.path, pointer });
      }
    }
  }
  return issues;
}

function findBrokenReferences(parsed: ParsedFile[]): ContentIssue[] {
  const grammarSlugs = new Set<string>();
  const canDoIds = new Set<string>();
  const vocabularyGroups = new Set<string>();
  for (const { file } of parsed) {
    if (file.kind === "grammar-lessons")
      file.items.forEach((l) => grammarSlugs.add(l.slug));
    if (file.kind === "can-do") file.items.forEach((c) => canDoIds.add(c.id));
    if (file.kind === "vocabulary-groups")
      file.items.forEach((g) => vocabularyGroups.add(g.slug));
  }

  const issues: ContentIssue[] = [];
  for (const { path, file } of parsed) {
    if (file.kind === "exercises") {
      file.items.forEach((exercise, i) => {
        if (
          exercise.examPart === "core-grammar" &&
          !grammarSlugs.has(exercise.grammarPoint)
        ) {
          issues.push({
            path,
            pointer: `items/${i}/grammarPoint`,
            message: `No grammar lesson with slug "${exercise.grammarPoint}"`,
          });
        }
      });
    }
    if (file.kind === "vocabulary") {
      file.items.forEach((entry, i) => {
        const groups = [
          ...entry.topics.map((slug, j) => ({ slug, pointer: `topics/${j}` })),
          ...(entry.sets ?? []).map((slug, j) => ({
            slug,
            pointer: `sets/${j}`,
          })),
        ];
        for (const { slug, pointer } of groups) {
          if (slug !== "general" && !vocabularyGroups.has(slug)) {
            issues.push({
              path,
              pointer: `items/${i}/${pointer}`,
              message: `No vocabulary group with slug "${slug}"`,
            });
          }
        }
      });
    }
    if (file.kind === "can-do") {
      file.items.forEach((canDo, i) => {
        canDo.links.lessons.forEach((slug, j) => {
          if (!grammarSlugs.has(slug)) {
            issues.push({
              path,
              pointer: `items/${i}/links/lessons/${j}`,
              message: `No grammar lesson with slug "${slug}"`,
            });
          }
        });
      });
    }
    if (file.kind === "grammar-lessons") {
      file.items.forEach((lesson, i) => {
        lesson.canDo.forEach((id, j) => {
          if (!canDoIds.has(id)) {
            issues.push({
              path,
              pointer: `items/${i}/canDo/${j}`,
              message: `No can-do statement with id "${id}"`,
            });
          }
        });
      });
    }
  }
  return issues;
}

/** Keys whose text is Spanish, so British spelling does not apply. */
const SPANISH_KEYS = new Set(["es", "spanish"]);

function collectSpellingWarnings(
  value: unknown,
  path: PropertyKey[],
  file: string,
  warnings: ContentIssue[],
): void {
  if (typeof value === "string") {
    for (const { word, british } of findAmericanSpellings(value)) {
      warnings.push({
        path: file,
        pointer: pointerOf(path),
        message: `"${word}" is American spelling; use "${british}"`,
      });
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) =>
      collectSpellingWarnings(item, [...path, i], file, warnings),
    );
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (!SPANISH_KEYS.has(key))
        collectSpellingWarnings(child, [...path, key], file, warnings);
    }
  }
}

export function formatReport(report: ValidationReport): string {
  const lines = [
    ...report.errors.map(
      (e) => `error    ${e.path} at ${e.pointer}: ${e.message}`,
    ),
    ...report.warnings.map(
      (w) => `warning  ${w.path} at ${w.pointer}: ${w.message}`,
    ),
  ];
  const itemCount = Object.values(report.items).reduce((sum, n) => sum + n, 0);
  for (const book of BOOK_IDS) {
    const { covered, total } = report.coverage[book];
    lines.push(`${BOOKS[book].title}: ${covered}/${total} units covered`);
  }
  lines.push(...bankLines(report.bank));
  lines.push(
    `By level (${CEFR_LEVELS.join(" ")}): ` +
      EXAM_PARTS.map(
        (part) =>
          `${part} ${CEFR_LEVELS.map((l) => report.bank.byLevel[part][l]).join("/")}`,
      ).join(" · "),
  );
  lines.push(
    `Placement gaps: ${report.placementGaps.length ? report.placementGaps.join(", ") : "none"}`,
  );
  const gaps = mockGaps(report.bank.byLevel);
  lines.push(
    `Mock gaps: ${gaps.length ? gaps.map((g) => `${g.level} ${g.part} ${g.have}/${g.need}`).join(", ") : "none"}`,
  );
  lines.push(
    `${report.files} files, ${itemCount} items, ${report.errors.length} errors, ${report.warnings.length} warnings`,
  );
  return lines.join("\n");
}

function bankLines({
  grammarByLesson,
  vocabularyByType,
  listeningByPart,
  writingByPart,
  speakingByPart,
}: ValidationReport["bank"]): string[] {
  const lessons = Object.entries(grammarByLesson);
  const questions = lessons.reduce((sum, [, n]) => sum + n, 0);
  const fewest = lessons.reduce<[string, number] | undefined>(
    (min, entry) => (min === undefined || entry[1] < min[1] ? entry : min),
    undefined,
  );
  const items = VOCAB_TYPES.reduce(
    (sum, type) => sum + vocabularyByType[type],
    0,
  );
  return [
    `Core Grammar: ${questions} questions in ${lessons.length} ${lessons.length === 1 ? "lesson" : "lessons"}` +
      (fewest ? ` (fewest: ${fewest[0]} ${fewest[1]})` : ""),
    `Core Vocabulary: ${items} items (${VOCAB_TYPES.map((type) => `${type} ${vocabularyByType[type]}`).join(", ")})`,
    `Listening: ${LISTENING_PARTS.map((part) => `${part.slice(-1)}: ${listeningByPart[part]}`).join(", ")} tasks`,
    `Writing: ${WRITING_PARTS.map((part) => `${part.slice(-1)}: ${writingByPart[part]}`).join(", ")} tasks`,
    `Speaking: ${SPEAKING_PARTS.map((part) => `${part.slice(-1)}: ${speakingByPart[part]}`).join(", ")} tasks`,
  ];
}
