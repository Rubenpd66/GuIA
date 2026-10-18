import { z } from "zod";
import { Exercise } from "./exercise";
import {
  CanDo,
  FunctionalPhrase,
  GrammarLesson,
  VocabularyEntry,
  VocabularyGroup,
} from "./lessons";

/** Every JSON file under `content/` has this shape: `{ "kind": ..., "items": [...] }`. */
export const ContentFile = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("exercises"), items: z.array(Exercise) }),
  z.strictObject({
    kind: z.literal("grammar-lessons"),
    items: z.array(GrammarLesson),
  }),
  z.strictObject({
    kind: z.literal("vocabulary"),
    items: z.array(VocabularyEntry),
  }),
  z.strictObject({
    kind: z.literal("vocabulary-groups"),
    items: z.array(VocabularyGroup),
  }),
  z.strictObject({ kind: z.literal("can-do"), items: z.array(CanDo) }),
  z.strictObject({
    kind: z.literal("functional-language"),
    items: z.array(FunctionalPhrase),
  }),
]);
export type ContentFile = z.infer<typeof ContentFile>;
export type ContentKind = ContentFile["kind"];

export const CONTENT_KINDS: readonly ContentKind[] = [
  "exercises",
  "grammar-lessons",
  "vocabulary",
  "vocabulary-groups",
  "can-do",
  "functional-language",
];
