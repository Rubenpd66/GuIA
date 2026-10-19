import { expect, test } from "@playwright/test";

test("the manifest makes the app installable", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    short_name: "Sello",
    display: "standalone",
    start_url: "/es/panel",
  });
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok()).toBe(true);
  }
  expect(
    manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"),
  ).toBe(true);
  expect((await request.get("/favicon.ico")).ok()).toBe(true);
});

test("visited pages work offline; others show the offline page", async ({
  page,
  context,
}) => {
  await page.goto("/es/gramatica");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The first load is not controlled yet; this one is, and goes into the cache.
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.goto("/es/lectura");
  await page.waitForLoadState("networkidle");

  await context.setOffline(true);
  await page.goto("/es/gramatica");
  await expect(page.locator("h1")).toContainText(/Gramática|Grammar/);
  await page.goto("/es/expresion-oral");
  await expect(page.locator("h1")).toHaveText("Sin conexión");
  await context.setOffline(false);
});
