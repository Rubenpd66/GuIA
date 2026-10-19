import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { sitemapEntries } from "./sitemap";

const BASE = "https://example.test";
const entries = sitemapEntries(BASE, {
  "/grammar/[slug]": ["inversion"],
  "/vocabulary/[slug]": ["work"],
  "/practice/[part]": ["core-grammar"],
});
const urls = entries.map((entry) => entry.url);

describe("sitemapEntries", () => {
  it("lists every page in both languages, with localized paths", () => {
    expect(urls).toContain(`${BASE}/es`);
    expect(urls).toContain(`${BASE}/en`);
    expect(urls).toContain(`${BASE}/es/panel`);
    expect(urls).toContain(`${BASE}/en/dashboard`);
    expect(urls).toContain(`${BASE}/es/gramatica/inversion`);
    expect(urls).toContain(`${BASE}/en/practice/core-grammar`);
    const staticPages = Object.keys(routing.pathnames).filter(
      (p) => !p.includes("[") && p !== "/design",
    ).length;
    expect(entries).toHaveLength((staticPages + 3) * 2);
  });

  it("pairs each URL with its real counterpart in the other language", () => {
    const panel = entries.find((e) => e.url === `${BASE}/es/panel`)!;
    expect(panel.alternates?.languages).toEqual({
      es: `${BASE}/es/panel`,
      en: `${BASE}/en/dashboard`,
    });
    for (const entry of entries) {
      expect(Object.values(entry.alternates!.languages!)).toContain(entry.url);
    }
  });

  it("leaves out the design page and unfilled dynamic routes", () => {
    expect(urls.some((url) => url.includes("/design"))).toBe(false);
    expect(urls.some((url) => url.includes("["))).toBe(false);
  });
});
