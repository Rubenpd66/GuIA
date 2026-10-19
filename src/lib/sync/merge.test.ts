import { describe, expect, it } from "vitest";
import { EMPTY_FLASHCARDS, type FlashcardsState } from "@/lib/flashcards/deck";
import { MAX_ATTEMPTS } from "@/lib/progress/progress";
import type { Attempt, Progress } from "@/lib/progress/schema";
import { mergeFlashcards, mergeLatest, mergeProgress } from "./merge";

const attempt = (id: string, finishedAt: number): Attempt => ({
  id,
  part: "core-grammar",
  mode: "study",
  startedAt: finishedAt - 10,
  finishedAt,
  correct: 1,
  total: 2,
});
const progress = (
  attempts: Attempt[],
  mistakes: Progress["mistakes"] = {},
): Progress => ({ version: 1, attempts, mistakes });

describe("mergeProgress", () => {
  it("keeps every attempt from both devices once, in time order", () => {
    const merged = mergeProgress(
      progress([attempt("a", 1), attempt("c", 3)]),
      progress([attempt("b", 2), attempt("a", 1)]),
    );
    expect(merged.attempts.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps only the most recent attempts", () => {
    const many = (prefix: string, from: number) =>
      Array.from({ length: MAX_ATTEMPTS }, (_, i) =>
        attempt(`${prefix}${i}`, from + i),
      );
    const merged = mergeProgress(
      progress(many("x", 0)),
      progress(many("y", 1000)),
    );
    expect(merged.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(merged.attempts[0]!.id).toBe("y0");
  });

  it("keeps the newer copy of a mistake and every mistake that only one side has", () => {
    const merged = mergeProgress(
      progress([], {
        q1: { part: "core-grammar", count: 1, streak: 1, lastSeen: 50 },
        q2: { part: "reading-1", count: 2, streak: 0, lastSeen: 10 },
      }),
      progress([], {
        q1: { part: "core-grammar", count: 3, streak: 0, lastSeen: 80 },
        q3: { part: "listening-1", count: 1, streak: 0, lastSeen: 5 },
      }),
    );
    expect(merged.mistakes.q1!.lastSeen).toBe(80);
    expect(Object.keys(merged.mistakes).sort()).toEqual(["q1", "q2", "q3"]);
  });

  it("does not bring back a mistake the newer side already cleared", () => {
    // Device A cleared q1 after device B last saw it: A's attempts are newer than B's q1.
    const merged = mergeProgress(
      progress([attempt("a", 100)]),
      progress([], {
        q1: { part: "core-grammar", count: 1, streak: 1, lastSeen: 50 },
      }),
    );
    expect(merged.mistakes.q1).toBeUndefined();
  });
});

describe("mergeFlashcards", () => {
  const card = (due: string, reviewed?: string) => ({
    ease: 2.5,
    interval: 1,
    reps: 1,
    due,
    ...(reviewed ? { reviewed } : {}),
  });
  const deck = (
    cards: FlashcardsState["cards"],
    newToday = { day: "2026-10-20", count: 0 },
    newPerDay = 15,
  ): FlashcardsState => ({ ...EMPTY_FLASHCARDS, cards, newToday, newPerDay });

  it("keeps the card reviewed most recently, and cards only one side has", () => {
    const merged = mergeFlashcards(
      {
        value: deck({
          a: card("2026-10-25", "2026-10-19"),
          b: card("2026-10-21"),
        }),
        updatedAt: 1,
      },
      {
        value: deck({
          a: card("2026-10-21", "2026-10-20"),
          c: card("2026-10-30"),
        }),
        updatedAt: 2,
      },
    );
    expect(merged.cards.a!.reviewed).toBe("2026-10-20");
    expect(Object.keys(merged.cards).sort()).toEqual(["a", "b", "c"]);
  });

  it("adds up nothing twice: today's new-card count is the larger one", () => {
    const merged = mergeFlashcards(
      { value: deck({}, { day: "2026-10-20", count: 4 }), updatedAt: 1 },
      { value: deck({}, { day: "2026-10-20", count: 6 }, 20), updatedAt: 2 },
    );
    expect(merged.newToday).toEqual({ day: "2026-10-20", count: 6 });
    expect(merged.newPerDay).toBe(20);
  });
});

describe("mergeLatest", () => {
  it("keeps the value saved last, including a deliberate null", () => {
    expect(
      mergeLatest(
        { value: "2026-12-01", updatedAt: 5 },
        { value: null, updatedAt: 9 },
      ),
    ).toBeNull();
    expect(
      mergeLatest({ value: "a", updatedAt: 9 }, { value: "b", updatedAt: 5 }),
    ).toBe("a");
  });
});
