import { describe, expect, it } from "vitest";
import { progressPercent } from "./ProgressBar";

describe("progressPercent", () => {
  it("rounds to a whole percent", () => {
    expect(progressPercent(0.456)).toBe(46);
  });
  it("clamps values outside 0..1", () => {
    expect(progressPercent(-1)).toBe(0);
    expect(progressPercent(2)).toBe(100);
  });
  it("treats NaN and infinities as no progress", () => {
    expect(progressPercent(Number.NaN)).toBe(0);
    expect(progressPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
