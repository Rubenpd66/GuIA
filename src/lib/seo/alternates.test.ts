import { describe, expect, it } from "vitest";
import { buildAlternates } from "./alternates";

describe("buildAlternates", () => {
  it("points the canonical at the current language and lists both", () => {
    expect(buildAlternates("/syllabus", "en")).toEqual({
      canonical: "/en/syllabus",
      languages: {
        es: "/es/temario",
        en: "/en/syllabus",
        "x-default": "/es/temario",
      },
    });
  });

  it("handles the home page", () => {
    expect(buildAlternates("/", "es").canonical).toBe("/es");
  });

  it("fills dynamic segments", () => {
    expect(
      buildAlternates("/grammar/[slug]", "es", { slug: "present-perfect" }),
    ).toMatchObject({
      canonical: "/es/gramatica/present-perfect",
      languages: { en: "/en/grammar/present-perfect" },
    });
  });
});
