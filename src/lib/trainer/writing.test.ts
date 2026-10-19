import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import {
  Writing1Exercise,
  Writing2Exercise,
  Writing4Exercise,
  type AnnotatedText,
} from "@/lib/content/schemas/writing";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { WRITING_PART_EXAM } from "./config";
import { createRng } from "./random";
import {
  annotatedSegments,
  buildWritingSession,
  wordStatus,
  writingItems,
} from "./writing";

const w1 = Writing1Exercise.parse(validExercises["writing-1"]);
const w2 = Writing2Exercise.parse(validExercises["writing-2"]);
const w4 = Writing4Exercise.parse(validExercises["writing-4"]);

const model = (text: string, quotes: string[]): AnnotatedText => ({
  text,
  annotations: quotes.map((quote) => ({
    quote,
    kind: "connector",
    note: { en: "note" },
  })),
});

describe("WRITING_PART_EXAM", () => {
  it("adds up to the 50 minutes of the Writing paper", () => {
    const seconds = Object.values(WRITING_PART_EXAM).reduce(
      (sum, part) => sum + part.seconds,
      0,
    );
    expect(seconds).toBe(EXAM_FORMAT.writing.minutes * 60);
  });
});

describe("wordStatus", () => {
  it("counts contractions and hyphenated words once, like the validator", () => {
    expect(wordStatus("I'm a well-known writer.", [1, 5])).toEqual({
      count: 4,
      status: "within",
    });
  });

  it("ignores loose punctuation and treats empty text as below the range", () => {
    expect(wordStatus(" - ... ! ", [1, 5])).toEqual({
      count: 0,
      status: "below",
    });
    expect(wordStatus("", [20, 30]).status).toBe("below");
    expect(wordStatus("one two three four five six", [1, 5]).status).toBe(
      "above",
    );
    expect(wordStatus("one two three four five", [1, 5]).status).toBe("within");
  });
});

describe("annotatedSegments", () => {
  it("splits the text into plain and annotated stretches that rebuild it", () => {
    const segments = annotatedSegments(
      model("However, I agree. Above all, it works.", [
        "Above all",
        "However,",
      ]),
    );
    expect(segments).toEqual([
      { text: "However,", annotation: 1 },
      { text: " I agree. " },
      { text: "Above all", annotation: 0 },
      { text: ", it works." },
    ]);
  });

  it("gives a repeated quote its next free occurrence", () => {
    const segments = annotatedSegments(
      model("so I went, so I saw", ["so", "so"]),
    );
    expect(segments.filter((s) => s.annotation !== undefined)).toEqual([
      { text: "so", annotation: 0 },
      { text: "so", annotation: 1 },
    ]);
    expect(segments.map((s) => s.text).join("")).toBe("so I went, so I saw");
  });

  it("leaves an overlapping quote unmarked instead of nesting it", () => {
    const segments = annotatedSegments(
      model("Not only that, but also this.", ["Not only that", "only"]),
    );
    expect(segments).toEqual([
      { text: "Not only that", annotation: 0 },
      { text: ", but also this." },
    ]);
  });
});

describe("writingItems", () => {
  it("gives every message, reply and email its own key and range", () => {
    expect(writingItems(w1).map((item) => item.range)).toEqual(
      Array(5).fill([1, 5]),
    );
    expect(writingItems(w2)[0]).toMatchObject({
      key: `${w2.id}#0`,
      range: [20, 30],
    });
    expect(writingItems(w4).map((item) => [item.key, item.range])).toEqual([
      [`${w4.id}#informal`, [40, 50]],
      [`${w4.id}#formal`, [120, 150]],
    ]);
    expect(writingItems(w4)[1]!.recipient).toBe(w4.formal.recipient);
  });
});

describe("buildWritingSession", () => {
  it("picks one task of the part and level", () => {
    const tasks = [w1, w2, { ...w2, id: "w2-other", cefrLevel: "C1" as const }];
    const session = buildWritingSession({
      tasks,
      part: "writing-2",
      rng: createRng(1),
      levels: ["C1"],
    });
    expect(session.map((task) => task.id)).toEqual(["w2-other"]);
    expect(
      buildWritingSession({ tasks, part: "writing-3", rng: createRng(1) }),
    ).toEqual([]);
  });

  it("resumes a task that has a draft", () => {
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      ...w2,
      id: `w2-${i}`,
    }));
    for (let seed = 0; seed < 20; seed++) {
      const [task] = buildWritingSession({
        tasks,
        part: "writing-2",
        rng: createRng(seed),
        draftedIds: ["w2-4"],
      });
      expect(task!.id).toBe("w2-4");
    }
  });
});
