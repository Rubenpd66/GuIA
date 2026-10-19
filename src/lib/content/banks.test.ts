import { describe, expect, it } from "vitest";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import { BANKS, bankFor } from "./banks";
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

describe("bankFor", () => {
  const grammar = validExercises["core-grammar"] as { id: string };
  const index = buildContentIndex([
    ContentFile.parse({
      kind: "exercises",
      items: [
        { ...grammar, id: "cg-a2", cefrLevel: "A2" },
        { ...grammar, id: "cg-c1", cefrLevel: "C1" },
        { ...grammar, id: "cg-c1-public", cefrLevel: "C1", placement: true },
      ],
    }),
    ContentFile.parse({
      kind: "vocabulary",
      items: [
        { ...validLessons.vocabulary, id: "v-a2", level: "A2" },
        { ...validLessons.vocabulary, id: "v-b2", level: "B2" },
      ],
    }),
  ]);

  it("the mock bank for the free tier holds only A2 and placement exercises", () => {
    expect(bankFor("mock", index, "free").grammar.map((q) => q.id)).toEqual([
      "cg-a2",
      "cg-c1-public",
    ]);
    expect(bankFor("mock", index, "c1").grammar).toHaveLength(3);
  });

  it("flashcards follow the tier's levels", () => {
    expect(bankFor("flashcards", index, "b1").map((c) => c.id)).toEqual([
      "v:v-a2",
    ]);
    expect(bankFor("flashcards", index, "b2")).toHaveLength(2);
  });
});
