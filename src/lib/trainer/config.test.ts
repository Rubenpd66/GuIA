import { describe, expect, it } from "vitest";
import { CORE_PART_EXAM, formatClock } from "./config";

describe("Core part exam settings", () => {
  it("uses 25 questions and half of the 25-minute Core time per part", () => {
    expect(CORE_PART_EXAM.grammar).toEqual({ count: 25, seconds: 750 });
    expect(CORE_PART_EXAM.vocabulary).toEqual({ count: 25, seconds: 750 });
  });
});

describe("formatClock", () => {
  it("shows minutes and seconds, rounding up and never below zero", () => {
    expect(formatClock(750_000)).toBe("12:30");
    expect(formatClock(61_200)).toBe("1:02");
    expect(formatClock(400)).toBe("0:01");
    expect(formatClock(-5000)).toBe("0:00");
  });
});
