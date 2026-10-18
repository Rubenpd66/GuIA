import { describe, expect, it } from "vitest";
import {
  countGaps,
  countWords,
  findAmericanSpellings,
  splitSentences,
  stripBom,
} from "./text";

const BOM = String.fromCharCode(0xfeff);

describe("countWords", () => {
  it("counts contractions and hyphenated words as one word", () => {
    expect(countWords("It's a well-known fact — honestly.")).toBe(5);
    expect(countWords("don’t")).toBe(1);
  });

  it("ignores whitespace, line breaks and punctuation", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  Hello,\r\n\r\nworld!  ")).toBe(2);
  });

  it("counts numbers with suffixes and skips currency symbols", () => {
    expect(countWords("I paid £30-odd for it")).toBe(5);
  });
});

describe("countGaps", () => {
  it("counts runs of three or more underscores", () => {
    expect(countGaps("Hardly ___ we arrived when ______ left.")).toBe(2);
    expect(countGaps("No gap here, just a_b.")).toBe(0);
  });
});

describe("stripBom", () => {
  it("removes a leading byte order mark only", () => {
    expect(stripBom(BOM + '{"a":1}')).toBe('{"a":1}');
    expect(stripBom('{"a":1}')).toBe('{"a":1}');
  });
});

describe("findAmericanSpellings", () => {
  it("flags American spellings with a British suggestion", () => {
    expect(findAmericanSpellings("My favorite Color")).toEqual([
      { word: "favorite", british: "favourite", index: 3 },
      { word: "Color", british: "Colour", index: 12 },
    ]);
  });

  it("accepts British spellings and longer words", () => {
    expect(findAmericanSpellings("A colourful neighbourhood")).toEqual([]);
    expect(findAmericanSpellings("Colorado is a place name")).toEqual([]);
  });
});

describe("splitSentences", () => {
  it("splits after full stops, question marks and exclamation marks", () => {
    expect(
      splitSentences("It rained. Did we care? No! We went out anyway."),
    ).toEqual(["It rained.", "Did we care?", "No!", "We went out anyway."]);
  });

  it("keeps closing quotes with their sentence", () => {
    expect(splitSentences('She said, "Never again." Then she left.')).toEqual([
      'She said, "Never again."',
      "Then she left.",
    ]);
  });

  it("does not split after titles, common abbreviations or in decimals", () => {
    expect(
      splitSentences(
        "Mr. Hughes paid 3.5 times more, e.g. For rent. Dr. Patel agreed.",
      ),
    ).toEqual([
      "Mr. Hughes paid 3.5 times more, e.g. For rent.",
      "Dr. Patel agreed.",
    ]);
  });

  it("returns one sentence for text without a final stop and none for blank text", () => {
    expect(splitSentences("  Just one line ")).toEqual(["Just one line"]);
    expect(splitSentences("   ")).toEqual([]);
  });
});
