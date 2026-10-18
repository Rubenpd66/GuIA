import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("follows the WCAG 2.1 formula", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#1A2332", "#EEF2EF")).toBeCloseTo(13.97, 1);
  });

  it("does not depend on the order of the colours", () => {
    expect(contrastRatio("#6B1F33", "#EEF2EF")).toBeCloseTo(
      contrastRatio("#EEF2EF", "#6B1F33"),
      5,
    );
  });

  it("rejects colours that are not #RRGGBB", () => {
    expect(() => contrastRatio("red", "#FFFFFF")).toThrow();
  });
});
