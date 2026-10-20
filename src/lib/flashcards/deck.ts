import * as z from "zod/mini";
import type { CefrLevel, Topic } from "@/lib/content/levels";
import { LocalDay } from "@/lib/progress/schema";
import { CardState, isDue } from "./sm2";

/** app decision: how many unseen cards a day brings in by default, and the allowed range. */
export const NEW_PER_DAY = { default: 15, min: 5, max: 50 } as const;

export const FlashcardsState = z.object({
  version: z.literal(1),
  /** Only the cards the learner has seen, by card id. */
  cards: z.record(z.string(), CardState),
  /** Unseen cards brought in on `day`, to respect the daily limit. */
  newToday: z.object({ day: LocalDay, count: z.int().check(z.minimum(0)) }),
  newPerDay: z
    .int()
    .check(z.minimum(NEW_PER_DAY.min), z.maximum(NEW_PER_DAY.max)),
});
export type FlashcardsState = z.infer<typeof FlashcardsState>;

export const EMPTY_FLASHCARDS: FlashcardsState = {
  version: 1,
  cards: {},
  newToday: { day: "1970-01-01", count: 0 },
  newPerDay: NEW_PER_DAY.default,
};

/** What a session needs to know about a card; the faces are built by the page. */
export type DeckCard = {
  id: string;
  deck: "vocabulary" | "phrases";
  level: CefrLevel;
  topics: Topic[];
};

export const newLeftToday = (state: FlashcardsState, today: string) =>
  Math.max(
    0,
    state.newPerDay - (state.newToday.day === today ? state.newToday.count : 0),
  );

/** Due cards first (oldest first), then unseen cards up to today's limit, in deck order. */
export function buildFlashcardSession<T extends DeckCard>(
  deck: readonly T[],
  state: FlashcardsState,
  today: string,
): T[] {
  const due = deck
    .filter(
      (card) => state.cards[card.id] && isDue(state.cards[card.id]!, today),
    )
    .sort((a, b) =>
      state.cards[a.id]!.due.localeCompare(state.cards[b.id]!.due),
    );
  const fresh = deck
    .filter((card) => !state.cards[card.id])
    .slice(0, newLeftToday(state, today));
  return [...due, ...fresh];
}

/** Cards due today or earlier, for the dashboard. */
export const dueCount = (state: FlashcardsState, today: string) =>
  Object.values(state.cards).filter((card) => isDue(card, today)).length;

/** Records one answer: the card's new schedule and, for an unseen card, the daily count. */
export function recordReview(
  state: FlashcardsState,
  id: string,
  next: CardState,
  today: string,
): FlashcardsState {
  const isNew = !state.cards[id];
  const count = state.newToday.day === today ? state.newToday.count : 0;
  return {
    ...state,
    cards: { ...state.cards, [id]: next },
    newToday: { day: today, count: count + (isNew ? 1 : 0) },
  };
}

/** The example with the headword replaced by a gap, or null when it cannot be found. */
export function gapExample(example: string, headword: string): string | null {
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");
  return pattern.test(example) ? example.replace(pattern, "___") : null;
}
