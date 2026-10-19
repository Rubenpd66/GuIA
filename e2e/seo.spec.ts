import { expect, test } from "@playwright/test";

test("pages declare a canonical URL and both language alternates", async ({
  page,
}) => {
  await page.goto("/es/temario");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/es\/temario$/,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute("href", /\/en\/syllabus$/);
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", /\/es\/temario$/);
});
