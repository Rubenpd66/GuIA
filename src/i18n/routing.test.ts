import { describe, expect, it } from "vitest";
import { SECTIONS } from "@/config/sections";
import { routing } from "./routing";

type External = string | Record<string, string>;
const entries = Object.entries(routing.pathnames) as [string, External][];
const externalFor = (value: External, locale: string) =>
  typeof value === "string" ? value : value[locale];
const segments = (path: string) => path.match(/\[[^\]]+\]/g) ?? [];

describe("routing", () => {
  it("uses Spanish by default and both locales", () => {
    expect(routing.locales).toEqual(["es", "en"]);
    expect(routing.defaultLocale).toBe("es");
  });

  it("gives every localized pathname an es and an en version", () => {
    for (const [, external] of entries) {
      if (typeof external === "string") continue;
      expect(Object.keys(external).sort()).toEqual(["en", "es"]);
    }
  });

  it.each(routing.locales)("keeps external paths unique in %s", (locale) => {
    const paths = entries.map(([, external]) => externalFor(external, locale));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("keeps the same dynamic segments in every locale", () => {
    for (const [internal, external] of entries) {
      for (const locale of routing.locales) {
        expect(segments(externalFor(external, locale)!)).toEqual(
          segments(internal),
        );
      }
    }
  });

  it("translates the practice route and keeps its parameter", () => {
    expect(routing.pathnames["/practice/[part]"]).toEqual({
      es: "/practica/[part]",
      en: "/practice/[part]",
    });
  });

  it("has a pathname for every section", () => {
    for (const { pathname } of Object.values(SECTIONS)) {
      expect(Object.keys(routing.pathnames)).toContain(pathname);
    }
  });
});
