import { describe, expect, it } from "vitest";
import type { Attempt, Progress } from "@/lib/progress/schema";
import { passportSummary } from "./passport";

let n = 0;
const attempt = (
  part: Attempt["part"],
  correct: number,
  total: number,
  mode: Attempt["mode"] = "exam",
  finishedAt = 1000,
): Attempt => ({
  id: `a${n++}`,
  part,
  mode,
  startedAt: finishedAt - 10,
  finishedAt,
  correct,
  total,
});
const progress = (attempts: Attempt[]): Progress => ({
  version: 1,
  attempts,
  mistakes: {},
});

describe("passportSummary", () => {
  it("has no data and no level for a new learner", () => {
    const summary = passportSummary(progress([]));
    expect(summary.hasData).toBe(false);
    expect(summary.highest).toBeNull();
    expect(summary.lastTestAt).toBeNull();
    expect(summary.skills.map((s) => s.skill)).toEqual([
      "core",
      "reading",
      "listening",
      "writing",
      "speaking",
    ]);
  });

  it("takes the highest level across skills", () => {
    const summary = passportSummary(
      progress([
        attempt("core-grammar", 15, 25),
        attempt("reading-1", 5, 5),
        attempt("reading-1", 5, 5),
      ]),
    );
    expect(summary.hasData).toBe(true);
    expect(summary.highest).toBe("C");
    const reading = summary.skills.find((s) => s.skill === "reading");
    expect(reading).toMatchObject({ level: "C", percent: 100 });
    const core = summary.skills.find((s) => s.skill === "core");
    expect(core).toMatchObject({ level: "B1", percent: 60 });
  });

  it("dates the passport with the latest exam-mode attempt only", () => {
    const summary = passportSummary(
      progress([
        attempt("core-grammar", 20, 25, "exam", 2000),
        attempt("core-grammar", 20, 25, "study", 9000),
      ]),
    );
    expect(summary.lastTestAt).toBe(2000);
  });

  it("keeps a skill without a level when it is below the lowest band", () => {
    const summary = passportSummary(progress([attempt("core-grammar", 2, 25)]));
    expect(summary.highest).toBeNull();
    expect(summary.hasData).toBe(true);
    expect(summary.skills[0]).toMatchObject({ level: null, percent: 8 });
  });
});

describe("passportSummary and self-assessment", () => {
  it("prefers levels from marked tests over the learner's own rubric", () => {
    const summary = passportSummary(
      progress([
        attempt("core-grammar", 15, 25),
        attempt("speaking-1", 4, 4),
        attempt("speaking-1", 4, 4),
      ]),
    );
    expect(summary.highest).toBe("B1");
    expect(summary.highestSelfAssessed).toBe(false);
  });

  it("falls back to a self-assessed level when it is the only one", () => {
    const summary = passportSummary(
      progress([attempt("writing-2", 4, 4), attempt("writing-2", 4, 4)]),
    );
    expect(summary.highest).toBe("C");
    expect(summary.highestSelfAssessed).toBe(true);
  });
});
