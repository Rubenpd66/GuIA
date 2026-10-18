import { describe, expect, it } from "vitest";
import { createRng, shuffle } from "./random";

describe("createRng", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(first.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it("gives different sequences for different seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});

describe("shuffle", () => {
  it("returns a permutation without changing the input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const output = shuffle(input, createRng(7));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...output].sort()).toEqual(input);
  });
});
