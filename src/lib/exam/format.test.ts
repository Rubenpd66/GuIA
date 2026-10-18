import { describe, expect, it } from "vitest";
import {
  EXAM_FORMAT,
  EXAM_PARTS,
  SKILL_OF_PART,
  isExamPart,
  partNumber,
} from "./format";

describe("exam format", () => {
  it("lists the 18 exam parts", () => {
    expect(EXAM_PARTS).toHaveLength(18);
    expect(new Set(EXAM_PARTS).size).toBe(18);
  });

  it("pins the official numbers", () => {
    expect(EXAM_FORMAT.core).toMatchObject({
      minutes: 25,
      grammarQuestions: 25,
      grammarOptions: 3,
      vocabularyQuestions: 25,
    });
    expect(EXAM_FORMAT.reading.minutes).toBe(35);
    expect(EXAM_FORMAT.reading.part1).toEqual({ sentences: 5, options: 3 });
    expect(EXAM_FORMAT.reading.part2).toEqual({ tasks: 2, sentences: 6 });
    expect(EXAM_FORMAT.reading.part3).toEqual({ people: 4, statements: 7 });
    expect(EXAM_FORMAT.reading.part4).toMatchObject({
      headings: 8,
      paragraphs: 7,
    });
    expect(EXAM_FORMAT.listening).toMatchObject({ minutes: 40, maxPlays: 2 });
    expect(EXAM_FORMAT.listening.part2).toEqual({ speakers: 4, options: 6 });
    expect(EXAM_FORMAT.listening.part3).toEqual({ statements: 4 });
    expect(EXAM_FORMAT.writing.minutes).toBe(50);
    expect(EXAM_FORMAT.writing.part2.words).toEqual([20, 30]);
    expect(EXAM_FORMAT.writing.part3).toMatchObject({
      questions: 3,
      words: [30, 40],
    });
    expect(EXAM_FORMAT.writing.part4).toMatchObject({
      informalWords: [40, 50],
      formalWords: [120, 150],
    });
    expect(EXAM_FORMAT.speaking.minutes).toBe(12);
    expect(EXAM_FORMAT.speaking.part1).toEqual({
      questions: 3,
      answerSeconds: 30,
    });
    expect(EXAM_FORMAT.speaking.part4).toMatchObject({
      prepSeconds: 60,
      answerSeconds: 120,
    });
    expect(EXAM_FORMAT.scores).toEqual({
      skillMax: 50,
      grammarVocabularyMax: 50,
      skillsTotalMax: 200,
    });
  });

  it("maps every part to its skill", () => {
    const parts = Object.values(SKILL_OF_PART);
    expect(parts.filter((s) => s === "core")).toHaveLength(2);
    for (const skill of [
      "reading",
      "listening",
      "writing",
      "speaking",
    ] as const) {
      expect(parts.filter((s) => s === skill)).toHaveLength(4);
    }
  });

  it("recognises valid part identifiers only", () => {
    expect(isExamPart("reading-2")).toBe(true);
    expect(isExamPart("core-grammar")).toBe(true);
    expect(isExamPart("reading-9")).toBe(false);
    expect(isExamPart("")).toBe(false);
  });

  it("numbers parts 1 to 4 and leaves the two Core parts unnumbered", () => {
    expect(partNumber("reading-1")).toBe(1);
    expect(partNumber("speaking-4")).toBe(4);
    expect(partNumber("core-grammar")).toBeNull();
    expect(partNumber("core-vocabulary")).toBeNull();
  });
});
