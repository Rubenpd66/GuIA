import { CEFR_LEVELS } from "./schemas/common";
import type { ContentFile } from "./schemas/content-file";
import type { Exercise } from "./schemas/exercise";
import {
  CAN_DO_SKILLS,
  PHRASE_FUNCTIONS,
  TARGET_LEVELS,
  VOCAB_GROUPS,
  type CanDo,
  type FunctionalPhrase,
  type GrammarLesson,
  type TargetLevel,
  type VocabGroup,
  type VocabularyEntry,
  type VocabularyGroup,
} from "./schemas/lessons";
import type { ExamPart } from "@/lib/exam/format";

/** All content, indexed and sorted for the pages and trainers. */
export type ContentIndex = {
  grammarLessons: GrammarLesson[];
  vocabularyGroups: VocabularyGroup[];
  vocabulary: VocabularyEntry[];
  canDo: CanDo[];
  functional: FunctionalPhrase[];
  exercises: Exercise[];
};

const levelRank = (level: string) =>
  CEFR_LEVELS.indexOf(level as (typeof CEFR_LEVELS)[number]);

export function buildContentIndex(files: ContentFile[]): ContentIndex {
  const index: ContentIndex = {
    grammarLessons: [],
    vocabularyGroups: [],
    vocabulary: [],
    canDo: [],
    functional: [],
    exercises: [],
  };
  for (const file of files) {
    switch (file.kind) {
      case "grammar-lessons":
        index.grammarLessons.push(...file.items);
        break;
      case "vocabulary-groups":
        index.vocabularyGroups.push(...file.items);
        break;
      case "vocabulary":
        index.vocabulary.push(...file.items);
        break;
      case "can-do":
        index.canDo.push(...file.items);
        break;
      case "functional-language":
        index.functional.push(...file.items);
        break;
      case "exercises":
        index.exercises.push(...file.items);
        break;
    }
  }
  index.grammarLessons.sort(
    (a, b) => levelRank(a.level) - levelRank(b.level) || a.order - b.order,
  );
  index.vocabularyGroups.sort(
    (a, b) =>
      VOCAB_GROUPS.indexOf(a.slug as VocabGroup) -
      VOCAB_GROUPS.indexOf(b.slug as VocabGroup),
  );
  index.vocabulary.sort((a, b) => a.headword.localeCompare(b.headword, "en"));
  return index;
}

export function lessonBySlug(
  index: ContentIndex,
  slug: string,
): GrammarLesson | undefined {
  return index.grammarLessons.find((lesson) => lesson.slug === slug);
}

export function exercisesOfPart<P extends ExamPart>(
  index: ContentIndex,
  part: P,
): Extract<Exercise, { examPart: P }>[] {
  return index.exercises.filter(
    (exercise): exercise is Extract<Exercise, { examPart: P }> =>
      exercise.examPart === part,
  );
}

export function questionsForLesson(index: ContentIndex, slug: string) {
  return exercisesOfPart(index, "core-grammar").filter(
    (q) => q.grammarPoint === slug,
  );
}

export function groupBySlug(
  index: ContentIndex,
  slug: string,
): VocabularyGroup | undefined {
  return index.vocabularyGroups.find((group) => group.slug === slug);
}

/** Entries filed under a topic or set, alphabetically. */
export function entriesOfGroup(
  index: ContentIndex,
  slug: string,
): VocabularyEntry[] {
  return index.vocabulary.filter(
    (entry) =>
      (entry.topics as string[]).includes(slug) ||
      (entry.sets as string[] | undefined)?.includes(slug),
  );
}

const skillRank = (canDo: CanDo) => CAN_DO_SKILLS.indexOf(canDo.skill);

/** Can-do statements that link a lesson, ordered by skill. */
export function canDoOfLesson(index: ContentIndex, slug: string): CanDo[] {
  return index.canDo
    .filter((canDo) => canDo.links.lessons.includes(slug))
    .sort((a, b) => skillRank(a) - skillRank(b));
}

/** Can-do statements of each target level, ordered by skill. */
export function canDoByLevel(
  index: ContentIndex,
): Record<TargetLevel, CanDo[]> {
  return Object.fromEntries(
    TARGET_LEVELS.map((level) => [
      level,
      index.canDo
        .filter((canDo) => canDo.level === level)
        .sort((a, b) => skillRank(a) - skillRank(b)),
    ]),
  ) as Record<TargetLevel, CanDo[]>;
}

const REGISTER_ORDER = ["neutral", "informal", "formal"];

/** Functional phrases grouped by function (enum order), each by level and then register. */
export function phrasesByFunction(
  index: ContentIndex,
): { function: FunctionalPhrase["function"]; phrases: FunctionalPhrase[] }[] {
  return PHRASE_FUNCTIONS.map((fn) => ({
    function: fn,
    phrases: index.functional
      .filter((phrase) => phrase.function === fn)
      .sort(
        (a, b) =>
          TARGET_LEVELS.indexOf(a.level) - TARGET_LEVELS.indexOf(b.level) ||
          REGISTER_ORDER.indexOf(a.register) -
            REGISTER_ORDER.indexOf(b.register),
      ),
  })).filter((group) => group.phrases.length > 0);
}
