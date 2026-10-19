import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { parseThemeTokens } from "./css-tokens";

const css = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const tokens = parseThemeTokens(css);

/** Pairs from the spec (§6): [foreground, background, minimum ratio]. */
const PAIRS = [
  ["ink", "canvas", 4.5],
  ["ink", "surface", 4.5],
  ["ink-soft", "canvas", 4.5],
  ["ink-soft", "surface", 4.5],
  ["on-accent", "accent", 4.5],
  ["accent", "canvas", 4.5],
  ["accent", "surface", 4.5],
  ["success", "canvas", 4.5],
  ["success", "surface", 4.5],
  ["danger", "canvas", 4.5],
  ["danger", "surface", 4.5],
  ["reward-ink", "canvas", 4.5],
  ["reward-ink", "surface", 4.5],
  ["level-a2", "canvas", 4.5],
  ["level-b1", "canvas", 4.5],
  ["level-b2", "canvas", 4.5],
  ["level-c1", "canvas", 4.5],
  ["level-a2", "surface", 4.5],
  ["level-b1", "surface", 4.5],
  ["level-b2", "surface", 4.5],
  ["level-c1", "surface", 4.5],
  ["line", "canvas", 3],
  ["line", "surface", 3],
  ["focus", "canvas", 3],
  ["on-reward", "reward", 4.5],
] as const;

const CASES = (["light", "dark"] as const).flatMap((theme) =>
  PAIRS.map(([fg, bg, min]) => [theme, fg, bg, min] as const),
);

describe("theme tokens", () => {
  it("define the same tokens in light and dark", () => {
    expect(Object.keys(tokens.light).sort()).toEqual(
      Object.keys(tokens.dark).sort(),
    );
    expect(Object.keys(tokens.light)).toContain("canvas");
  });

  it.each(CASES)("%s: %s on %s reaches %d:1", (theme, fg, bg, min) => {
    const foreground = tokens[theme][fg];
    const background = tokens[theme][bg];
    expect(foreground, `--${fg} is missing`).toBeDefined();
    expect(background, `--${bg} is missing`).toBeDefined();
    expect(contrastRatio(foreground!, background!)).toBeGreaterThanOrEqual(min);
  });
});

describe("parseThemeTokens", () => {
  it("reads hex custom properties from :root and the dark theme block", () => {
    const parsed = parseThemeTokens(`
      :root { --canvas: #EEF2EF; --radius: 6px; }
      [data-theme="dark"] { --canvas: #1C1317; }
    `);
    expect(parsed).toEqual({
      light: { canvas: "#EEF2EF" },
      dark: { canvas: "#1C1317" },
    });
  });
});

/** The level chips tint their own colour at 6 % over the canvas: the text must still read. */
describe("level chips", () => {
  const mix = (fg: string, bg: string, share: number) => {
    const channel = (hex: string, i: number) =>
      parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return `#${[0, 1, 2]
      .map((i) =>
        Math.round(channel(fg, i) * share + channel(bg, i) * (1 - share))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  };
  const CHIPS = (["light", "dark"] as const).flatMap((theme) =>
    (["a2", "b1", "b2", "c1"] as const).map((level) => [theme, level] as const),
  );
  it.each(CHIPS)(
    "%s: level-%s text on its tint reaches 4.5:1",
    (theme, level) => {
      const fg = tokens[theme][`level-${level}`]!;
      const bg = mix(fg, tokens[theme].surface!, 0.06);
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
