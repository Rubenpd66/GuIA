import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { PRACTICE_PARTS } from "./routes";
import { fakeMicrophone, seedProgress } from "./helpers";

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`,
    ),
  ).toEqual([]);
}

for (const part of PRACTICE_PARTS) {
  for (const scheme of ["light", "dark"] as const) {
    test(`axe: practice ${part} in session (${scheme})`, async ({ page }) => {
      await fakeMicrophone(page);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/es/practica/${part}`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Empezar", exact: true }).click();
      await page.waitForTimeout(500);
      await expectNoViolations(page);
    });
  }
}

test("axe: dashboard and mistakes with data", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/es/panel");
  await page.waitForLoadState("networkidle");
  await expectNoViolations(page);
  await page.goto("/es/errores");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: "Vaciar el banco de errores" })
    .click();
  await expectNoViolations(page);
});

test("axe: flashcards session, both faces", async ({ page }) => {
  await page.goto("/en/flashcards");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Start \(/ }).click();
  await expectNoViolations(page);
  await page.getByRole("button", { name: "Turn over" }).click();
  await expectNoViolations(page);
});

test("axe: placement test and mock exam setup", async ({ page }) => {
  await page.goto("/es/test-de-nivel");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Empezar el test" }).click();
  await expectNoViolations(page);
  await page.goto("/en/mock-exam");
  await page.waitForLoadState("networkidle");
  await expectNoViolations(page);
});

test("axe: settings reset dialog", async ({ page }) => {
  await page.goto("/es/ajustes");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Borrar progreso" }).click();
  await expectNoViolations(page);
});
