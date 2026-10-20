/** Plain constants shared by the browser and the content schemas (no Zod, so pages stay light). */
export const CEFR_LEVELS = ["A2", "B1", "B2", "C1"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const TOPICS = [
  "work",
  "education",
  "technology",
  "environment",
  "health-sport",
  "travel",
  "city",
  "culture-leisure",
  "relationships",
  "shopping-consumption",
  "media",
  "general",
] as const;
export type Topic = (typeof TOPICS)[number];

/** The four Core Vocabulary task types, in the order the trainer presents them. */
export const VOCAB_TYPES = [
  "synonym",
  "definition",
  "usage",
  "collocation",
] as const;
export type VocabType = (typeof VOCAB_TYPES)[number];
