import { BOOKS, BOOK_IDS, type BookId } from "@/config/books";
import { coveredUnits } from "./coverage";
import {
  CONTENT_KINDS,
  ContentFile,
  type ContentKind,
} from "./schemas/content-file";
import { findAmericanSpellings, stripBom } from "./text";

export type ContentSource = { path: string; raw: string };
export type ContentIssue = { path: string; pointer: string; message: string };
export type ValidationReport = {
  errors: ContentIssue[];
  warnings: ContentIssue[];
  files: number;
  items: Record<ContentKind, number>;
  /** Reference-book units that at least one lesson or vocabulary group points to. */
  coverage: Record<BookId, { covered: number; total: number }>;
};

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

  errors.push(...findDuplicateIds(parsed), ...findBrokenReferences(parsed));
  return {
    errors,
    warnings,
    files: sources.length,
    items,
    coverage: bookCoverage(parsed),
  };
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
  lines.push(
    `${report.files} files, ${itemCount} items, ${report.errors.length} errors, ${report.warnings.length} warnings`,
  );
  return lines.join("\n");
}
