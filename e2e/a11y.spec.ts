import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sampleUrls } from "./routes";

for (const url of sampleUrls()) {
  for (const scheme of ["light", "dark"] as const) {
    test(`axe: ${url} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const summary = violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(" "))
            .join(" | ")}`,
      );
      expect(summary).toEqual([]);
    });
  }
}

// WCAG 1.4.10: content reflows at 320 CSS pixels (400 % zoom on a 1280 px screen).
test.describe("reflow at 320 px", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const url of sampleUrls()) {
    test(`no sideways scroll: ${url}`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => {
        const wide = [...document.querySelectorAll("body *")].filter(
          (el) => el.getBoundingClientRect().right > window.innerWidth + 1,
        );
        return {
          page: document.documentElement.scrollWidth > window.innerWidth,
          culprits: wide
            .slice(0, 3)
            .map(
              (el) => el.tagName + "." + el.className.toString().slice(0, 40),
            ),
        };
      });
      expect(overflow).toEqual({ page: false, culprits: [] });
    });
  }
});
