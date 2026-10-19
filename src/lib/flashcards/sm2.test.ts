import { describe, expect, it } from "vitest";
import {
  EMPTY_FLASHCARDS,
  buildFlashcardSession,
  dueCount,
  gapExample,
  newLeftToday,
  recordReview,
  type DeckCard,
} from "./deck";
import { review } from "./sm2";

const TODAY = "2026-10-19";

describe("review (SM-2)", () => {
  it("schedules 1, 6 and then interval × ease days for right answers", () => {
    const first = review(undefined, "good", TODAY);
    expect(first).toMatchObject({ interval: 1, reps: 1, due: "2026-10-20" });
    const second = review(first, "good", "2026-10-20");
    expect(second).toMatchObject({ interval: 6, reps: 2, due: "2026-10-26" });
    const third = review(second, "good", "2026-10-26");
    expect(third.interval).toBe(Math.round(6 * third.ease));
    expect(third.ease).toBeCloseTo(2.5);
  });

  it("resets on Again and lowers the ease, never below 1.3", () => {
    let card = review(undefined, "good", TODAY);
    card = review(card, "good", TODAY);
    const lapse = review(card, "again", TODAY);
    expect(lapse).toMatchObject({ interval: 1, reps: 0, due: "2026-10-20" });
    expect(lapse.ease).toBeCloseTo(2.5 - 0.54);
    for (let i = 0; i < 10; i++) card = review(card, "again", TODAY);
    expect(card.ease).toBe(1.3);
  });

  it("raises the ease on Easy and keeps it on Good", () => {
    expect(review(undefined, "easy", TODAY).ease).toBeCloseTo(2.6);
    expect(review(undefined, "hard", TODAY).ease).toBeCloseTo(2.36);
  });
});

describe("flashcard sessions", () => {
  const deck: DeckCard[] = Array.from({ length: 30 }, (_, i) => ({
    id: `v:${i}`,
    deck: "vocabulary",
    level: "B2",
    topics: ["work"],
  }));

  it("puts due cards first, then unseen cards up to the daily limit", () => {
    let state = EMPTY_FLASHCARDS;
    state = recordReview(
      state,
      "v:5",
      { ease: 2.5, interval: 1, reps: 1, due: "2026-10-18" },
      "2026-10-17",
    );
    state = recordReview(
      state,
      "v:3",
      { ease: 2.5, interval: 1, reps: 1, due: "2026-10-19" },
      "2026-10-17",
    );
    state = recordReview(
      state,
      "v:7",
      { ease: 2.5, interval: 9, reps: 3, due: "2026-11-01" },
      "2026-10-17",
    );
    const session = buildFlashcardSession(deck, state, TODAY);
    expect(session.slice(0, 2).map((c) => c.id)).toEqual(["v:5", "v:3"]);
    expect(session).toHaveLength(2 + 15);
    expect(session.some((c) => c.id === "v:7")).toBe(false);
    expect(dueCount(state, TODAY)).toBe(2);
  });

  it("counts unseen cards per day and starts afresh the next day", () => {
    let state = EMPTY_FLASHCARDS;
    for (let i = 0; i < 4; i++)
      state = recordReview(
        state,
        `v:${i}`,
        review(undefined, "good", TODAY),
        TODAY,
      );
    // Reviewing a card already seen does not use up the daily limit.
    state = recordReview(
      state,
      "v:0",
      review(state.cards["v:0"], "good", TODAY),
      TODAY,
    );
    expect(newLeftToday(state, TODAY)).toBe(11);
    expect(newLeftToday(state, "2026-10-20")).toBe(15);
  });
});

describe("gapExample", () => {
  it("blanks the headword, whatever its case", () => {
    expect(gapExample("Commuting takes an hour.", "commuting")).toBe(
      "___ takes an hour.",
    );
    expect(gapExample("She took up yoga.", "take up")).toBeNull();
    expect(gapExample("A (rare) case.", "(rare)")).toBeNull();
  });
});
