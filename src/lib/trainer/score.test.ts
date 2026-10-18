import { describe, expect, it } from "vitest";
import { scoreItems } from "./score";

describe("scoreItems", () => {
  const items = [
    { key: "a", answer: 0 },
    { key: "b", answer: 2 },
    { key: "c", answer: 1 },
  ];

  it("counts right answers and treats unanswered items as wrong", () => {
    const result = scoreItems(items, { a: 0, b: 1 });
    expect(result.correct).toBe(1);
    expect(result.total).toBe(3);
    expect(result.results).toEqual([
      { key: "a", correct: true, chosen: 0 },
      { key: "b", correct: false, chosen: 1 },
      { key: "c", correct: false, chosen: undefined },
    ]);
  });
});
