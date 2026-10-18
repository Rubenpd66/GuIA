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
  ["ink", "paper", 4.5],
  ["ink", "sheet", 4.5],
  ["ink-soft", "paper", 4.5],
  ["ink-soft", "sheet", 4.5],
  ["on-cover", "cover", 4.5],
  ["foil", "cover", 4.5],
  ["entry", "paper", 4.5],
  ["entry", "sheet", 4.5],
  ["refusal", "paper", 4.5],
  ["refusal", "sheet", 4.5],
  ["line", "paper", 3],
  ["line", "sheet", 3],
  ["focus", "paper", 3],
] as const;

const CASES = (["light", "dark"] as const).flatMap((theme) =>
  PAIRS.map(([fg, bg, min]) => [theme, fg, bg, min] as const),
);

describe("theme tokens", () => {
  it("define the same tokens in light and dark", () => {
    expect(Object.keys(tokens.light).sort()).toEqual(
      Object.keys(tokens.dark).sort(),
    );
    expect(Object.keys(tokens.light)).toContain("paper");
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
      :root { --paper: #EEF2EF; --radius: 6px; }
      [data-theme="dark"] { --paper: #1C1317; }
    `);
    expect(parsed).toEqual({
      light: { paper: "#EEF2EF" },
      dark: { paper: "#1C1317" },
    });
  });
});
