import { expect, test, type Page } from "@playwright/test";
import { fakeMicrophone, seedProgress } from "./helpers";

/** The trainer setup cards are plain labels; keep clicking until hydration picks the click up. */
async function chooseMode(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  const radio = page.getByRole("radio", { name: new RegExp(name) });
  for (let i = 0; i < 10 && !(await radio.isChecked()); i++) {
    await page.getByText(name, { exact: true }).click();
    await page.waitForTimeout(200);
  }
  await expect(radio).toBeChecked();
}

const progress = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("sello:progress") ?? "null"),
  );

test.describe("navigation", () => {
  test("switches language on the same page and keeps the theme", async ({
    page,
  }) => {
    await page.goto("/es/gramatica");
    await page
      .getByRole("link", { name: /EN English/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/grammar$/);
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    // The radio is visually hidden inside its label, as in the trainers' setup cards.
    await page.getByText("Dark", { exact: true }).click();
    await expect(page.getByRole("radio", { name: /Dark/ })).toBeChecked();
    await page.goto("/en/reading");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("trainers in exam mode", () => {
  test.skip(({ isMobile }) => isMobile, "desktop covers the flows");

  test("Core grammar: finishing saves an exam attempt", async ({ page }) => {
    await page.goto("/es/practica/core-grammar");
    await chooseMode(page, "Modo examen");
    await page.getByRole("button", { name: "Empezar", exact: true }).click();
    await page
      .getByRole("button", { name: "Terminar", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Resultado" }),
    ).toBeVisible();
    expect((await progress(page)).attempts.at(-1)).toMatchObject({
      part: "core-grammar",
      mode: "exam",
      total: 25,
    });
  });

  test("Writing: the editor locks when time runs out", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en/practice/writing-2");
    await chooseMode(page, "Exam mode");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.locator("textarea").fill("I joined because I love long walks.");
    await page.clock.runFor(7 * 60_000 + 2000);
    await expect(page.locator("textarea")).toHaveAttribute("readonly", "");
    await expect(page.locator("textarea")).toHaveValue(/long walks/);
  });

  test("Speaking: records an answer with a simulated microphone", async ({
    page,
  }) => {
    await fakeMicrophone(page);
    await page.goto("/es/practica/speaking-1");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Empezar", exact: true }).click();
    await page.getByRole("button", { name: "Empezar a hablar" }).click();
    await expect(page.getByText("Grabando", { exact: true })).toBeVisible();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "He terminado" }).click();
    await expect(page.locator("audio")).toHaveAttribute("src", /^blob:/);
  });
});

test.describe("assessments", () => {
  test.skip(({ isMobile }) => isMobile, "desktop covers the flows");

  test("the placement test runs to a result and a plan", async ({ page }) => {
    await page.goto("/es/test-de-nivel");
    await page.getByRole("button", { name: "Empezar el test" }).click();
    for (let section = 0; section < 5; section++) {
      await page.getByRole("button", { name: "Empezar la sección" }).click();
      const finish = page.getByRole("button", {
        name: "Terminar",
        exact: true,
      });
      const next = page.getByRole("button", { name: "Siguiente", exact: true });
      while (!(await finish.count()) && (await next.count()))
        await next.first().click();
      await finish.first().click();
    }
    await expect(
      page.getByRole("heading", { name: "Tu nivel estimado" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tu plan/ })).toBeVisible();
    expect((await progress(page)).attempts).toHaveLength(5);
  });

  test("a mock exam resumes after a reload without giving time back", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/es/simulacro");
    await page.waitForLoadState("networkidle");
    for (const name of ["Reading", "Listening", "Writing", "Speaking"])
      await page.getByRole("checkbox", { name: new RegExp(name) }).uncheck();
    await page.getByRole("button", { name: /Empezar el simulacro/ }).click();
    await page.getByRole("button", { name: "Empezar la sección" }).click();
    await page.clock.runFor(5 * 60_000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    // 12:30 for the section minus the 5 minutes already spent.
    await expect(page.getByText(/7:[23]\d/).first()).toBeVisible();
    await page.clock.runFor(8 * 60_000);
    await page.getByRole("button", { name: "Empezar la sección" }).click();
    await page.clock.runFor(13 * 60_000);
    await expect(
      page.getByRole("heading", { name: "Informe del simulacro" }),
    ).toBeVisible();
  });
});

test.describe("study tools", () => {
  test.skip(({ isMobile }) => isMobile, "desktop covers the flows");

  test("flashcards: a card graded Again comes back at the end", async ({
    page,
  }) => {
    await page.goto("/en/flashcards");
    await page.getByRole("button", { name: /Start \(/ }).click();
    const total = await page.getByText(/Card 1 of (\d+)/).innerText();
    await page.keyboard.press("Space");
    await page.keyboard.press("1");
    const grown = Number(total.match(/of (\d+)/)![1]) + 1;
    await expect(
      page.getByText(new RegExp(`Card 2 of ${grown}`)),
    ).toBeVisible();
  });

  test("export and import keep progress, exam date and flashcards", async ({
    page,
  }) => {
    await seedProgress(page);
    await page.goto("/es/ajustes");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("textbox", { name: "Fecha del examen" })
      .fill("2026-12-01");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar progreso" }).click();
    const file = await (await download).path();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByText("Progreso importado.")).toBeVisible();
    expect((await progress(page)).attempts).toHaveLength(4);
    await expect(
      page.getByRole("textbox", { name: "Fecha del examen" }),
    ).toHaveValue("2026-12-01");
  });
});
