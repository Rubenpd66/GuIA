import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("the admin panel is hidden from visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("Administración")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/es");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["permissions-policy"]).toContain("microphone=(self)");
});

test("the sign-in page offers every way in", async ({ page }) => {
  await page.goto("/es/acceso");
  await expect(
    page.getByRole("button", { name: "Crear cuenta" }),
  ).toBeVisible();
  await page.locator("#up-email").fill("someone@example.com");
  await page.locator("#up-password").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  // The consent box is required, so the browser stops the submit.
  await expect(page.getByLabel(/14 años o más/)).toBeFocused();
});

// The full round trip needs a throwaway user in the test project (sello-dev), created with the
// secret key. Without these variables it is skipped.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;

test.describe("account round trip", () => {
  test.skip(!URL || !SECRET, "needs SUPABASE_SECRET_KEY for the test project");

  test("signs in, syncs to a second browser and deletes the account", async ({
    browser,
  }) => {
    const admin = createClient(URL!, SECRET!, {
      auth: { persistSession: false },
    });
    const email = `e2e-${Date.now()}@example.com`;
    const password = "e2e-password-123";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    const userId = data.user!.id;

    try {
      const signIn = async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("/es/acceso");
        await page.locator("#in-email").fill(email);
        await page.locator("#in-password").fill(password);
        await page
          .getByRole("button", { name: "Entrar", exact: true })
          .first()
          .click();
        await expect(page).toHaveURL(/\/es\/cuenta/);
        await expect(page.getByText("Sincronizado")).toBeVisible({
          timeout: 15_000,
        });
        return page;
      };

      const first = await signIn();
      await first.goto("/es/ajustes");
      await first.getByLabel("Fecha del examen").fill("2030-05-17");
      // Wait for the debounced upload to reach the cloud.
      await expect
        .poll(async () => {
          const { data: rows } = await admin
            .from("user_data")
            .select("key")
            .eq("user_id", userId)
            .eq("key", "exam-date");
          return rows?.length;
        })
        .toBe(1);

      const second = await signIn();
      await second.goto("/es/ajustes");
      await expect(second.getByLabel("Fecha del examen")).toHaveValue(
        "2030-05-17",
      );

      await second.goto("/es/cuenta");
      await second.getByRole("button", { name: "Borrar mi cuenta" }).click();
      await second.getByRole("button", { name: "Sí, borrar" }).click();
      await expect
        .poll(
          async () => (await admin.auth.admin.getUserById(userId)).data.user,
        )
        .toBeNull();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
