import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { SECTIONS } from "@/config/sections";
import { EXAM_PARTS, SKILLS } from "@/lib/exam/format";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : leaves(value, `${prefix}${key}.`),
  );
}

const MESSAGES = { es: es as Tree, en: en as Tree };

describe("messages", () => {
  it("have exactly the same keys in Spanish and English", () => {
    const keysOf = (tree: Tree) =>
      leaves(tree)
        .map(([key]) => key)
        .sort();
    expect(keysOf(MESSAGES.es)).toEqual(keysOf(MESSAGES.en));
  });

  it.each(["es", "en"] as const)("have no empty strings in %s", (locale) => {
    const empty = leaves(MESSAGES[locale]).filter(
      ([, value]) => value.trim() === "",
    );
    expect(empty).toEqual([]);
  });

  it("name every exam part, skill and section", () => {
    expect(Object.keys(en.Parts).sort()).toEqual([...EXAM_PARTS].sort());
    expect(Object.keys(en.Skills).sort()).toEqual([...SKILLS].sort());
    expect(Object.keys(en.Sections).sort()).toEqual(
      Object.keys(SECTIONS).sort(),
    );
  });
});
