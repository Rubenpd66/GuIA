import { describe, expect, it } from "vitest";
import { guillochePath, wavePath } from "./guilloche";

describe("guillochePath", () => {
  const options = { cx: 50, cy: 50, R: 5, r: 3, d: 5, steps: 200 };

  it("draws a closed path with one segment per step", () => {
    const path = guillochePath(options);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/L/g)).toHaveLength(200);
  });

  it("is deterministic, so server and client render the same markup", () => {
    expect(guillochePath(options)).toBe(guillochePath(options));
  });

  it("stays within its bounding radius", () => {
    const numbers = guillochePath({ ...options, R: 40, r: 15, d: 10 })
      .match(/-?\d+(\.\d+)?/g)!
      .map(Number);
    const limit = 50 + (40 - 15) + 10;
    expect(Math.max(...numbers)).toBeLessThanOrEqual(limit);
  });
});

describe("wavePath", () => {
  it("draws an open wave across the given width", () => {
    const path = wavePath({
      width: 100,
      y: 10,
      amplitude: 4,
      wavelength: 25,
      steps: 50,
    });
    expect(path.startsWith("M0 ")).toBe(true);
    expect(path.endsWith("Z")).toBe(false);
    expect(path.match(/L/g)).toHaveLength(50);
  });
});
