import { expect, test } from "@playwright/test";
import { seedProgress } from "./helpers";

test("a dialog takes the focus, closes with Escape and gives it back", async ({
  page,
}) => {
  await page.goto("/es/ajustes");
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "Borrar progreso" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the stamp only fades when less motion is asked for", async ({ page }) => {
  await seedProgress(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es/simulacro");
  await page.evaluate(() =>
    localStorage.setItem(
      "sello:mock",
      JSON.stringify({
        version: 1,
        seed: 1,
        components: ["core"],
        startedAt: 1,
        index: 2,
        results: [
          { part: "core-grammar", correct: 20, total: 25 },
          { part: "core-vocabulary", correct: 21, total: 25 },
        ],
        runningSince: null,
        finishedAt: 2,
      }),
    ),
  );
  await page.reload();
  await page.waitForLoadState("networkidle");
  const animation = await page
    .locator("svg.stamp-drop")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("stamp-fade");
});

test("entering content rises, and only fades when less motion is asked for", async ({
  page,
}) => {
  await page.goto("/es");
  const animationName = () =>
    page
      .locator(".enter")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
  expect(await animationName()).toBe("enter-rise");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  expect(await animationName()).toBe("enter-fade");
});

test("buttons give press feedback with a transform transition", async ({
  page,
}) => {
  await page.goto("/es");
  const property = await page
    .getByRole("link", { name: "Haz el test de nivel" })
    .first()
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(property).toContain("transform");
});
