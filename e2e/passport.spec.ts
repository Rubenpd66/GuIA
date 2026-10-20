import { expect, test, type Page } from "@playwright/test";
import { seedProgress } from "./helpers";

const cover = (page: Page) =>
  page.getByRole("button", { name: "Abrir tu pasaporte de idiomas" });

/** The inside page is what the pointer would hit at its centre: not covered by the cover. */
async function insideIsOnTop(page: Page) {
  return page.evaluate(() => {
    const inside = document.querySelector(".passport-inside");
    if (!inside) return false;
    const box = inside.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    return !!hit && inside.contains(hit);
  });
}

test("the home passport opens on the highest level reached", async ({
  page,
}) => {
  await seedProgress(page);
  await page.goto("/es");
  await page.waitForLoadState("networkidle");
  await cover(page).click();
  const toggle = page.locator(".passport-cover");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const inside = page.getByRole("region", { name: "Tu nivel estimado" });
  await expect(
    inside.getByRole("img", { name: "Nivel más alto alcanzado: C" }),
  ).toBeVisible();
  await expect(inside.getByRole("link", { name: "Ver mi panel" })).toBeVisible();
  await expect.poll(() => insideIsOnTop(page)).toBe(true);
  await inside.getByRole("button", { name: "Cerrar el pasaporte" }).click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("a new learner's passport invites the placement test", async ({
  page,
}) => {
  await page.goto("/es");
  await cover(page).click();
  const inside = page.getByRole("region", { name: "Tu nivel estimado" });
  await expect(
    inside.getByRole("link", { name: "Haz el test de nivel" }),
  ).toBeVisible();
});

test("the open passport fits a 320 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/es");
  await cover(page).click();
  await expect.poll(() => insideIsOnTop(page)).toBe(true);
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBe(true);
});

test("with less motion the cover fades instead of turning", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es");
  await cover(page).click();
  const transform = await page
    .locator(".passport-cover")
    .evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe("none");
  await expect.poll(() => insideIsOnTop(page)).toBe(true);
});

test("the dashboard opens the passport by itself when there is data", async ({
  page,
}) => {
  await seedProgress(page);
  await page.goto("/es/panel");
  const toggle = page.locator(".passport-cover");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page
      .getByRole("region", { name: "Tu nivel estimado" })
      .getByRole("link", { name: "Repetir el test de nivel" }),
  ).toBeVisible();
});
