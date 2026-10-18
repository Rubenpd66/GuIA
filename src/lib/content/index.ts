import { CEFR_LEVELS } from "./schemas/common";
import type { ContentFile } from "./schemas/content-file";
import type { Exercise } from "./schemas/exercise";
import {
  VOCAB_GROUPS,
  type CanDo,
  type FunctionalPhrase,
  type GrammarLesson,
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
