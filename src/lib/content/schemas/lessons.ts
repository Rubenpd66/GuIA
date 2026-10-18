import { z } from "zod";
import {
  CefrLevel,
  ExamPartId,
  LocalizedText,
  NonEmptyText,
  Slug,
  Topic,
  choiceItem,
} from "./common";

const Register = z.enum(["formal", "informal", "neutral"]);

export const GrammarLesson = z.strictObject({
  slug: Slug,
  level: CefrLevel,
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

export const CanDo = z.strictObject({
  id: Slug,
  level: z.enum(["B1", "B2", "C1"]),
  skill: z.enum([
    "spoken-interaction",
    "spoken-production",
    "listening",
    "reading",
    "writing",
    "strategies",
  ]),
  text: LocalizedText,
  links: z.strictObject({ lessons: z.array(Slug), parts: z.array(ExamPartId) }),
});
export type CanDo = z.infer<typeof CanDo>;

export const FunctionalPhrase = z.strictObject({
  id: Slug,
  function: z.enum([
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
  ]),
  register: Register,
  phrase: NonEmptyText,
  example: NonEmptyText,
});
export type FunctionalPhrase = z.infer<typeof FunctionalPhrase>;
