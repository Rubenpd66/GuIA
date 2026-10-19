import { describe, expect, it } from "vitest";
import type { Attempt } from "@/lib/progress/schema";
import { bandOf, estimateAll, estimatePart, leveledUp } from "./level";

let clock = 1_000_000;
const attempt = (
  part: Attempt["part"],
  correct: number,
  total: number,
  mode: Attempt["mode"] = "study",
): Attempt => {
  clock += 60_000;
  return {
    id: `${part}-${clock}`,
    part,
    mode,
    startedAt: clock - 30_000,
    finishedAt: clock,
    correct,
    total,
  };
};

describe("bandOf", () => {
  it("maps shares to the app's bands, with no stamp below A2", () => {
    expect(bandOf(0.85)).toBe("C");
    expect(bandOf(0.849)).toBe("B2");
    expect(bandOf(0.7)).toBe("B2");
    expect(bandOf(0.55)).toBe("B1");
    expect(bandOf(0.4)).toBe("A2");
    expect(bandOf(0.39)).toBeNull();
  });
});

describe("estimatePart", () => {
  it("says nothing with too little data", () => {
    expect(estimatePart([attempt("reading-1", 5, 5)], "reading-1")).toBeNull();
    // One attempt under exam conditions is enough.
    expect(
      estimatePart([attempt("reading-1", 4, 5, "exam")], "reading-1")?.level,
    ).toBe("B2");
    expect(estimatePart([], "core-grammar")).toBeNull();
    // A Core session with ten items is enough on its own.
    expect(
      estimatePart([attempt("core-grammar", 9, 10)], "core-grammar")?.level,
    ).toBe("C");
    expect(
      estimatePart([attempt("core-grammar", 4, 5)], "core-grammar"),
    ).toBeNull();
  });

  it("weighs recent and exam attempts more", () => {
    const history = [
      ...Array.from({ length: 5 }, () => attempt("reading-2", 0, 5)),
      ...Array.from({ length: 5 }, () => attempt("reading-2", 5, 5)),
    ];
    // The five recent perfect attempts weigh 2, the older failures 1.
    expect(estimatePart(history, "reading-2")!.ratio).toBeCloseTo(10 / 15);
    const exam = estimatePart(
      [attempt("reading-3", 0, 7), attempt("reading-3", 7, 7, "exam")],
      "reading-3",
    )!;
    expect(exam.ratio).toBeCloseTo(4 / 6);
  });

  it("only looks at the last ten attempts and marks self-assessment", () => {
    const history = [
      ...Array.from({ length: 5 }, () => attempt("writing-2", 0, 4)),
      ...Array.from({ length: 10 }, () => attempt("writing-2", 4, 4)),
    ];
    expect(estimatePart(history, "writing-2")).toMatchObject({
      ratio: 1,
      level: "C",
      attempts: 10,
      selfAssessed: true,
    });
  });
});

describe("estimateAll", () => {
  it("averages the parts with data into the skill", () => {
    const { parts, skills } = estimateAll({
      version: 1,
      mistakes: {},
      attempts: [
        attempt("listening-1", 10, 10),
        attempt("listening-1", 10, 10),
        attempt("listening-2", 2, 4),
        attempt("listening-2", 2, 4),
      ],
    });
    expect(parts["listening-3"]).toBeNull();
    expect(skills.listening?.ratio).toBeCloseTo(0.75);
    expect(skills.listening?.level).toBe("B2");
    expect(skills.reading).toBeNull();
  });
});

describe("leveledUp", () => {
  const at = (level: "A2" | "B2" | "C" | null) => ({
    ratio: 0,
    level,
    attempts: 2,
    selfAssessed: false,
  });
  it("is true only when the stamp gets higher", () => {
    expect(leveledUp(null, at("A2"))).toBe(true);
    expect(leveledUp(at(null), at("A2"))).toBe(true);
    expect(leveledUp(at("B2"), at("C"))).toBe(true);
    expect(leveledUp(at("C"), at("B2"))).toBe(false);
    expect(leveledUp(at("B2"), at("B2"))).toBe(false);
    expect(leveledUp(at("B2"), null)).toBe(false);
  });
});
