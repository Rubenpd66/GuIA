import { describe, expect, it } from "vitest";
import {
  PRICES,
  TIERS,
  canAccess,
  formatPrice,
  levelsFor,
  tierFor,
} from "./tiers";

describe("tiers", () => {
  it("unlocks a tier's level and every level below", () => {
    expect(levelsFor("free")).toEqual(["A2"]);
    expect(levelsFor("b1")).toEqual(["A2", "B1"]);
    expect(levelsFor("b2")).toEqual(["A2", "B1", "B2"]);
    expect(levelsFor("c1")).toEqual(["A2", "B1", "B2", "C1"]);
  });

  it("names the cheapest tier for each level", () => {
    expect(tierFor("A2")).toBe("free");
    expect(tierFor("B1")).toBe("b1");
    expect(tierFor("C1")).toBe("c1");
    for (const tier of TIERS)
      expect(tierFor(levelsFor(tier).at(-1)!)).toBe(tier);
  });

  it("answers access questions", () => {
    expect(canAccess("b1", "A2")).toBe(true);
    expect(canAccess("b1", "B2")).toBe(false);
    expect(canAccess("c1", "C1")).toBe(true);
  });

  it("prices the year at 20 % off twelve months, in cents", () => {
    expect(PRICES).toEqual({
      b1: { month: 999, year: 9590 },
      b2: { month: 1499, year: 14390 },
      c1: { month: 1999, year: 19190 },
    });
  });
});

describe("formatPrice", () => {
  it("formats euro cents the way each locale writes prices", () => {
    // Intl keeps the number and the sign together with a no-break space.
    expect(formatPrice(999, "es")).toBe("9,99 €");
    expect(formatPrice(9590, "en")).toBe("€95.90");
  });
});

describe("PRICES", () => {
  // Plans.saveNote says yearly billing saves 20 %; this keeps the copy true if a price changes.
  it("makes every yearly plan about 20 % cheaper than twelve months", () => {
    for (const { month, year } of Object.values(PRICES))
      expect(Math.round((1 - year / (month * 12)) * 100)).toBe(20);
  });
});
