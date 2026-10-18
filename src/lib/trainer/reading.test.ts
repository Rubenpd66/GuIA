import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import {
  Reading1Exercise,
  Reading2Exercise,
  Reading3Exercise,
  Reading4Exercise,
} from "@/lib/content/schemas/reading";
import { READING_PART_EXAM } from "./config";
import { createRng } from "./random";
import {
  buildReadingSession,
  initialOrder,
  moveItem,
  readingItems,
} from "./reading";
import { scoreItems } from "./score";

const r1 = Reading1Exercise.parse(validExercises["reading-1"]);
const r2 = Reading2Exercise.parse(validExercises["reading-2"]);
const r3 = Reading3Exercise.parse(validExercises["reading-3"]);
const r4 = Reading4Exercise.parse(validExercises["reading-4"]);

const withId = <T extends { id: string }>(task: T, id: string): T => ({
  ...structuredClone(task),
  id,
});

describe("READING_PART_EXAM", () => {
  it("adds up to the 35 minutes of the Reading paper (app decision)", () => {
    const seconds = Object.values(READING_PART_EXAM).reduce(
      (sum, part) => sum + part.seconds,
      0,
    );
    expect(seconds).toBe(35 * 60);
    expect(READING_PART_EXAM["reading-2"].tasks).toBe(2);
  });
});

describe("initialOrder", () => {
  it("keeps the first sentence and never returns the solved order", () => {
    for (let seed = 0; seed < 1000; seed++) {
      const order = initialOrder(r2, createRng(seed));
      expect(order[0]).toBe(0);
      expect([...order].sort()).toEqual([0, 1, 2, 3, 4, 5]);
      expect(order).not.toEqual([0, 1, 2, 3, 4, 5]);
    }
  });
});

describe("moveItem", () => {
  it("moves an item without mutating the original order", () => {
    const order = [0, 3, 1, 2, 5, 4];
    expect(moveItem(order, 1, 3)).toEqual([0, 1, 2, 3, 5, 4]);
    expect(order).toEqual([0, 3, 1, 2, 5, 4]);
  });

  it("refuses to move to or from the fixed first position", () => {
    const order = [0, 3, 1, 2, 5, 4];
    expect(moveItem(order, 2, 0)).toEqual(order);
    expect(moveItem(order, 0, 3)).toEqual(order);
    expect(moveItem(order, 2, 9)).toEqual(order);
  });
});

describe("readingItems", () => {
  it("builds one key per gap, position, statement and paragraph", () => {
    expect(readingItems(r1)).toHaveLength(5);
    expect(readingItems(r1)[0]).toEqual({
      key: `${r1.id}#0`,
      answer: r1.items[0]!.answer,
    });
    expect(readingItems(r2).map((item) => item.key)).toEqual(
      [1, 2, 3, 4, 5].map((p) => `${r2.id}#${p}`),
    );
    expect(readingItems(r2).map((item) => item.answer)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(readingItems(r3)).toHaveLength(7);
    expect(readingItems(r4).map((item) => item.answer)).toEqual(r4.answers);
  });

  it("marks a sentence order position by position", () => {
    const items = readingItems(r2);
    const order = [0, 2, 1, 3, 4, 5];
    const answers = Object.fromEntries(
      order.slice(1).map((sentence, i) => [`${r2.id}#${i + 1}`, sentence]),
    );
    expect(scoreItems(items, answers).correct).toBe(3);
  });

  it("scores a repeated heading only where it is right", () => {
    const items = readingItems(r4);
    const first = r4.answers[0]!;
    const answers = Object.fromEntries(items.map((item) => [item.key, first]));
    expect(scoreItems(items, answers).correct).toBe(1);
  });
});

describe("buildReadingSession", () => {
  const rng = () => createRng(7);

  it("gives one task in study mode", () => {
    const tasks = [r2, withId(r2, "r2-b"), withId(r2, "r2-c")];
    expect(
      buildReadingSession({
        tasks,
        part: "reading-2",
        mode: "study",
        rng: rng(),
      }),
    ).toHaveLength(1);
  });

  it("takes two different part 2 tasks in exam mode", () => {
    const tasks = [r2, withId(r2, "r2-b"), withId(r2, "r2-c")];
    const session = buildReadingSession({
      tasks,
      part: "reading-2",
      mode: "exam",
      rng: rng(),
    });
    expect(session).toHaveLength(2);
    expect(new Set(session.map((task) => task.id)).size).toBe(2);
  });

  it("gives a shorter session when the bank is too small", () => {
    expect(
      buildReadingSession({
        tasks: [r2],
        part: "reading-2",
        mode: "exam",
        rng: rng(),
      }),
    ).toHaveLength(1);
  });

  it("filters by level and returns the tasks of the given keys", () => {
    const b1 = { ...withId(r3, "r3-b1"), cefrLevel: "B1" as const };
    const tasks = [r3, b1];
    expect(
      buildReadingSession({
        tasks,
        part: "reading-3",
        mode: "study",
        rng: rng(),
        levels: ["B1"],
      }).map((task) => task.id),
    ).toEqual(["r3-b1"]);
    expect(
      buildReadingSession({
        tasks,
        part: "reading-3",
        mode: "exam",
        rng: rng(),
        onlyKeys: ["r3-b1#4"],
      }).map((task) => task.id),
    ).toEqual(["r3-b1"]);
  });
});
