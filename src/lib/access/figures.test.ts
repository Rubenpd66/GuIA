import { describe, expect, it } from "vitest";
import type { ContentIndex } from "@/lib/content";
import { levelCatalogue, offersFor, planFigures } from "./figures";

const lesson = (slug: string, level: string) => ({
  slug,
  level,
  order: 1,
  title: { en: `T ${slug}`, es: `Título ${slug}` },
});
const word = (id: string, level: string, topics: string[]) => ({
  id,
  level,
  topics,
});
const task = (id: string, level: string, part: string, placement?: true) => ({
  id,
  cefrLevel: level,
  examPart: part,
  ...(placement ? { placement } : {}),
});

const index = {
  grammarLessons: [lesson("a", "A2"), lesson("b", "A2"), lesson("c", "B1")],
  vocabularyGroups: [
    { slug: "travel", title: { en: "Travel", es: "Viajes" } },
    { slug: "work", title: { en: "Work", es: "Trabajo" } },
  ],
  vocabulary: [
    word("w1", "A2", ["travel"]),
    word("w2", "B1", ["travel"]),
    word("w3", "B1", ["work"]),
  ],
  canDo: [],
  functional: [
    { id: "p1", level: "A2" },
    { id: "p2", level: "C1" },
  ],
  exercises: [
    task("e1", "A2", "core-grammar"),
    task("e2", "B1", "core-grammar"),
    task("e3", "B1", "reading-1"),
    task("e4", "C1", "reading-1", true),
  ],
} as unknown as ContentIndex;

describe("planFigures", () => {
  it("counts only what the free plan opens", () => {
    expect(planFigures(index, "free")).toEqual({
      lessons: 2,
      words: 1,
      phrases: 1,
      tasks: 1,
      mockLevel: "A2",
    });
  });

  it("adds the levels below", () => {
    const b1 = planFigures(index, "b1");
    expect(b1).toMatchObject({ lessons: 3, words: 3, phrases: 1, tasks: 3 });
  });

  it("counts a placement-flagged task by its own level only", () => {
    expect(planFigures(index, "free").tasks).toBe(1);
    const c1 = planFigures(index, "c1");
    expect(c1.tasks).toBe(4);
    expect(c1.mockLevel).toBe("C1");
  });
});

describe("levelCatalogue", () => {
  it("lists titles, groups with entries and tasks per part for a level", () => {
    expect(levelCatalogue(index, "B1", "es")).toEqual({
      lessons: [{ slug: "c", title: "Título c" }],
      groups: [
        { slug: "travel", title: "Viajes" },
        { slug: "work", title: "Trabajo" },
      ],
      tasksByPart: { "core-grammar": 1, "reading-1": 1 },
    });
  });

  it("leaves out groups with no entries at the level", () => {
    expect(levelCatalogue(index, "A2", "en").groups).toEqual([
      { slug: "travel", title: "Travel" },
    ]);
  });
});

describe("offersFor", () => {
  it("lists the monthly and yearly prices as decimal strings", () => {
    expect(offersFor("b1")).toEqual([
      { interval: "month", price: "9.99" },
      { interval: "year", price: "95.90" },
    ]);
    expect(offersFor("c1")[1]).toEqual({ interval: "year", price: "191.90" });
  });
});
