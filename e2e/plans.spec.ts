import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;

const card = (page: import("@playwright/test").Page, level: string) =>
  page.locator("article", {
    has: page.getByRole("heading", { name: `Plan ${level}` }),
  });

test.describe("visitors", () => {
  test("see four plans, a free start and account creation for the paid ones", async ({
    page,
  }) => {
    await page.goto("/es/planes");
    await expect(page.locator("article")).toHaveCount(4);
    await expect(
      card(page, "A2").getByRole("link", { name: "Empezar gratis" }),
    ).toBeVisible();
    for (const level of ["B1", "B2", "C1"]) {
      const link = card(page, level).getByRole("link", {
        name: "Crear cuenta y suscribirme",
      });
      await expect(link).toBeVisible();
      // Sign-in sends them back here.
      await expect(link).toHaveAttribute("href", /next=%2Fes%2Fplanes/);
    }
  });

  test("the interval toggle switches the prices", async ({ page }) => {
    await page.goto("/es/planes");
    const b1 = card(page, "B1");
    await expect(b1).toContainText("95,90");
    await page.getByText("Mensual", { exact: true }).click();
    await expect(b1).toContainText("9,99");
    await page.getByText("Anual", { exact: true }).click();
    await expect(b1).toContainText("95,90");
  });

  test("?nivel= marks the plan for that level and ignores unknown values", async ({
    page,
  }) => {
    await page.goto("/es/planes?nivel=B2");
    const marked = page.locator('article[aria-current="true"]');
    await expect(marked).toHaveCount(1);
    await expect(marked).toContainText("Plan B2");
    await page.goto("/es/planes?nivel=Z9");
    await expect(page.locator("article")).toHaveCount(4);
    await expect(page.locator('article[aria-current="true"]')).toHaveCount(0);
  });

  test("the page ships Product data and the level catalogue", async ({
    request,
  }) => {
    const body = await (await request.get("/es/planes")).text();
    expect(body).toContain('"@type":"Product"');
    expect(body).toContain("Preguntas frecuentes");
  });
});

test.describe("a B1 subscriber", () => {
  test.skip(!URL || !SECRET, "needs SUPABASE_SECRET_KEY for the test project");

  test("sees their plan and can change to a higher one", async ({ page }) => {
    const admin = createClient(URL!, SECRET!, {
      auth: { persistSession: false },
    });
    const email = `e2e-plans-${Date.now()}@example.com`;
    const password = "e2e-password-123";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    const userId = data.user!.id;
    try {
      const { error: rowError } = await admin.from("subscriptions").insert({
        user_id: userId,
        tier: "b1",
        interval: "month",
        status: "active",
        current_period_end: new Date(
          Date.now() + 30 * 86_400_000,
        ).toISOString(),
        stripe_customer_id: `cus_e2e_${Date.now()}`,
      });
      expect(rowError).toBeNull();

      await page.goto("/es/acceso");
      await page.locator("#in-email").fill(email);
      await page.locator("#in-password").fill(password);
      await page
        .getByRole("button", { name: "Entrar", exact: true })
        .first()
        .click();
      await expect(page).toHaveURL(/\/es\/cuenta/);

      await page.goto("/es/planes");
      await expect(card(page, "B1").getByText("Tu plan actual")).toBeVisible();
      for (const level of ["B2", "C1"])
        await expect(
          card(page, level).getByRole("button", { name: "Cambiar de plan" }),
        ).toBeVisible();
      await expect(
        card(page, "A2").getByRole("link", { name: "Empezar gratis" }),
      ).toBeVisible();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
