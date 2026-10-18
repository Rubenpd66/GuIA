import { describe, expect, it } from "vitest";
import { parseInline, splitGaps } from "./markup";

describe("parseInline", () => {
  it("reads bold, italic and highlight marks", () => {
    expect(
      parseInline("Use **had** + _past participle_, ==never== would."),
    ).toEqual([
      { type: "text", text: "Use " },
      { type: "strong", text: "had" },
      { type: "text", text: " + " },
      { type: "em", text: "past participle" },
      { type: "text", text: ", " },
      { type: "mark", text: "never" },
      { type: "text", text: " would." },
    ]);
  });

  it("leaves answer gaps and underscores inside words alone", () => {
    expect(parseInline("Hardly ___ the station when it rained.")).toEqual([
      { type: "text", text: "Hardly ___ the station when it rained." },
    ]);
    expect(parseInline("a snake_case_name")).toEqual([
      { type: "text", text: "a snake_case_name" },
    ]);
  });

  it("returns nothing for an empty string", () => {
    expect(parseInline("")).toEqual([]);
  });
});

describe("splitGaps", () => {
  it("splits a sentence around its answer gap", () => {
    expect(splitGaps("Hardly ___ the station when it rained.")).toEqual([
      "Hardly ",
      " the station when it rained.",
    ]);
    expect(splitGaps("No gap here.")).toEqual(["No gap here."]);
  });
});
