import { z } from "zod";
import { BOOKS, type BookId } from "@/config/books";
import {
  CefrLevel,
  ExamPartId,
  LocalizedText,
  NonEmptyText,
  Slug,
  TOPICS,
  Topic,
  choiceItem,
} from "./common";

const Register = z.enum(["formal", "informal", "neutral"]);

/** A "Further study" pointer: book and unit number only, never the book's content. */
export const Reference = z
  .strictObject({
    book: z.enum(Object.keys(BOOKS) as [BookId, ...BookId[]]),
    unit: z.int().min(1),
  })
  .superRefine((reference, ctx) => {
    const { units } = BOOKS[reference.book];
    if (reference.unit > units) {
      ctx.addIssue({
        code: "custom",
        path: ["unit"],
        message: `${BOOKS[reference.book].title} has ${units} units`,
        input: reference.unit,
      });
    }
  });
export type Reference = z.infer<typeof Reference>;

export const GRAMMAR_CATEGORIES = [
  "tenses",
  "future",
  "modals",
  "conditionals",
  "passive",
  "reported-speech",
  "questions",
  "verb-patterns",
  "nouns-articles",
  "pronouns-determiners",
  "relative-clauses",
  "adjectives-adverbs",
  "linking",
  "prepositions",
  "phrasal-verbs",
  "emphasis",
] as const;
export const GrammarCategory = z.enum(GRAMMAR_CATEGORIES);
export type GrammarCategory = z.infer<typeof GrammarCategory>;

/** Vocabulary sets that cut across topics (mostly B2–C1). */
export const VOCAB_SETS = [
  "collocations",
  "vague-language",
  "false-friends",
  "formal-informal",
  "idioms",
  "nuance",
  "phrasal-verbs",
  "word-formation",
  "linking-words",
] as const;
export const VocabSet = z.enum(VOCAB_SETS);
export type VocabSet = z.infer<typeof VocabSet>;

/** A vocabulary page: an exam topic (except "general") or a set. */
export type VocabGroup = Exclude<Topic, "general"> | VocabSet;
export const VOCAB_GROUPS: readonly VocabGroup[] = [
  ...TOPICS.filter(
    (topic): topic is Exclude<Topic, "general"> => topic !== "general",
  ),
  ...VOCAB_SETS,
];
export const VocabGroupSlug = z.enum(
  VOCAB_GROUPS as [VocabGroup, ...VocabGroup[]],
);

export const GrammarLesson = z.strictObject({
  slug: Slug,
  level: CefrLevel,
  category: GrammarCategory,
  /** Position within its level on the grammar index. */
  order: z.int().min(1),
  references: z.array(Reference).default([]),
  title: LocalizedText,
  summary: LocalizedText,
  form: z.array(NonEmptyText).min(1),
  uses: z
    .array(
      z.strictObject({ text: NonEmptyText, note: LocalizedText.optional() }),
    )
    .min(1),
  /** Typical mistakes of Spanish speakers. */
  mistakes: z
    .array(
      z.strictObject({
        wrong: NonEmptyText,
        right: NonEmptyText,
        why: LocalizedText,
      }),
    )
    .min(1),
  examples: z
    .array(z.strictObject({ en: NonEmptyText, es: NonEmptyText.optional() }))
    .min(8)
    .max(12),
  practice: z.array(choiceItem(3)).min(3),
  canDo: z.array(Slug),
});
export type GrammarLesson = z.infer<typeof GrammarLesson>;

export const VocabularyEntry = z.strictObject({
  id: Slug,
  headword: NonEmptyText,
  pos: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "phrasal-verb",
    "phrase",
    "idiom",
    "preposition",
    "conjunction",
  ]),
  level: CefrLevel,
  topics: z.array(Topic).min(1),
  sets: z.array(VocabSet).optional(),
  definition: NonEmptyText,
  examples: z.array(NonEmptyText).min(1),
  collocations: z.array(NonEmptyText).optional(),
  synonyms: z.array(NonEmptyText).optional(),
  register: Register.optional(),
  falseFriend: z
    .strictObject({ spanish: NonEmptyText, trap: LocalizedText })
    .optional(),
});
export type VocabularyEntry = z.infer<typeof VocabularyEntry>;

export const VocabularyGroup = z.strictObject({
  slug: VocabGroupSlug,
  title: LocalizedText,
  summary: LocalizedText,
  references: z.array(Reference).default([]),
});
export type VocabularyGroup = z.infer<typeof VocabularyGroup>;

/** Levels that can-do statements and functional phrases target. */
export const TARGET_LEVELS = ["B1", "B2", "C1"] as const;
export type TargetLevel = (typeof TARGET_LEVELS)[number];

export const CAN_DO_SKILLS = [
  "spoken-interaction",
  "spoken-production",
  "listening",
  "reading",
  "writing",
  "strategies",
] as const;

export const CanDo = z.strictObject({
  id: Slug,
  level: z.enum(TARGET_LEVELS),
  skill: z.enum(CAN_DO_SKILLS),
  text: LocalizedText,
  links: z.strictObject({ lessons: z.array(Slug), parts: z.array(ExamPartId) }),
});
export type CanDo = z.infer<typeof CanDo>;

export const PHRASE_FUNCTIONS = [
  "opinion",
  "hedging",
  "contrast",
  "addition",
  "conclusion",
  "speculation",
  "comparison",
  "buying-time",
  "interrupting",
  "returning",
] as const;

export const FunctionalPhrase = z.strictObject({
  id: Slug,
  function: z.enum(PHRASE_FUNCTIONS),
  level: z.enum(TARGET_LEVELS),
  register: Register,
  phrase: NonEmptyText,
  example: NonEmptyText,
  /** When to use it, if that is not obvious from the example. */
  note: LocalizedText.optional(),
});
export type FunctionalPhrase = z.infer<typeof FunctionalPhrase>;
