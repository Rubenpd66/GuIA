import { entriesOfGroup, type ContentIndex } from "@/lib/content/index";
import { localized } from "@/lib/content/localize";
import type { CefrLevel } from "@/lib/content/schemas/common";
import type { ExamPart } from "@/lib/exam/format";
import { levelsFor, TIER_LEVEL, type Tier } from "./tiers";

export type PlanFigures = {
  lessons: number;
  words: number;
  phrases: number;
  tasks: number;
  /** The mock exam of a plan goes up to its own level. */
  mockLevel: CefrLevel;
};

/**
 * What a plan opens, counted from the content. Placement flags are ignored on purpose: they
 * make a task free for everyone, not part of what a plan adds.
 */
export function planFigures(index: ContentIndex, tier: Tier): PlanFigures {
  const levels = levelsFor(tier);
  const open = (level: CefrLevel) => levels.includes(level);
  return {
    lessons: index.grammarLessons.filter((l) => open(l.level)).length,
    words: index.vocabulary.filter((w) => open(w.level)).length,
    phrases: index.functional.filter((p) => open(p.level)).length,
    tasks: index.exercises.filter((e) => open(e.cefrLevel)).length,
    mockLevel: TIER_LEVEL[tier],
  };
}

/** The shop window for one level: titles and counts only, never the paid text. */
export function levelCatalogue(
  index: ContentIndex,
  level: CefrLevel,
  locale: "es" | "en",
) {
  const tasksByPart: Partial<Record<ExamPart, number>> = {};
  for (const exercise of index.exercises)
    if (exercise.cefrLevel === level)
      tasksByPart[exercise.examPart] =
        (tasksByPart[exercise.examPart] ?? 0) + 1;
  return {
    lessons: index.grammarLessons
      .filter((l) => l.level === level)
      .map((l) => ({ slug: l.slug, title: localized(l.title, locale) })),
    groups: index.vocabularyGroups
      .filter((g) =>
        entriesOfGroup(index, g.slug).some((entry) => entry.level === level),
      )
      .map((g) => ({ slug: g.slug, title: localized(g.title, locale) })),
    tasksByPart,
  };
}
