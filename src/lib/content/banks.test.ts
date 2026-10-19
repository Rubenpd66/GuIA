import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import { BANKS } from "./banks";
import { buildContentIndex } from "./index";
import { ContentFile } from "./schemas/content-file";

describe("placement bank", () => {
  it("holds only exercises flagged for the placement test", () => {
    const question = validExercises["core-grammar"] as { id: string };
    const index = buildContentIndex([
      ContentFile.parse({
        kind: "exercises",
        items: [
          { ...question, id: "cg-public", placement: true },
          { ...question, id: "cg-paid" },
        ],
      }),
    ]);
    expect(BANKS.placement(index).grammar.map((q) => q.id)).toEqual([
      "cg-public",
    ]);
  });

  it("filters every list, not only grammar", () => {
    const task = validExercises["listening-1"] as { id: string };
    const index = buildContentIndex([
      ContentFile.parse({
        kind: "exercises",
        items: [
          { ...task, id: "l1-public", placement: true },
          { ...task, id: "l1-paid" },
        ],
      }),
    ]);
    expect(BANKS.placement(index).listening1.map((t) => t.id)).toEqual([
      "l1-public",
    ]);
  });
});
