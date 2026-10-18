import { describe, expect, it } from "vitest";
import { coveredUnits, findUncoveredUnits } from "./coverage";

const refs = [
  { book: "egu", unit: 3 },
  { book: "egu", unit: 1 },
  { book: "evu", unit: 2 },
  { book: "egu", unit: 3 },
] as const;

describe("book coverage", () => {
  it("collects each book's referenced units once, in order", () => {
    expect(coveredUnits(refs, "egu")).toEqual([1, 3]);
    expect(coveredUnits(refs, "evu")).toEqual([2]);
  });

  it("lists the units of a book that no lesson references", () => {
    expect(findUncoveredUnits(refs, "egu", 5)).toEqual([2, 4, 5]);
  });
});
