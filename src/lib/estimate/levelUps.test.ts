import { describe, expect, it } from "vitest";
import type { Progress } from "@/lib/progress/schema";
import {
  announceLevelUps,
  dismissLevelUps,
  holdLevelUps,
  partsLeveledUp,
  readLevelUps,
} from "./levelUps";

const progress = (correct: number): Progress => ({
  version: 1,
  mistakes: {},
  attempts: [
    {
      id: "r",
      part: "reading-1",
      mode: "exam",
      startedAt: 0,
      finishedAt: 1,
      correct,
      total: 5,
    },
  ],
});
const EMPTY: Progress = { version: 1, attempts: [], mistakes: {} };

describe("partsLeveledUp", () => {
  it("lists a part that gains or raises its level", () => {
    expect(partsLeveledUp(EMPTY, progress(4)).map((l) => l.part)).toEqual([
      "reading-1",
    ]);
    expect(partsLeveledUp(progress(3), progress(5))[0]?.estimate.level).toBe(
      "C",
    );
    expect(partsLeveledUp(progress(5), progress(3))).toEqual([]);
    // Below A2 there is no level to announce.
    expect(partsLeveledUp(EMPTY, progress(1))).toEqual([]);
  });
});

describe("announcing", () => {
  it("publishes level-ups, except while a test or mock exam holds them", () => {
    const ups = partsLeveledUp(EMPTY, progress(4));
    const release = holdLevelUps();
    announceLevelUps(ups);
    expect(readLevelUps()).toEqual([]);
    release();
    announceLevelUps(ups);
    expect(readLevelUps()).toEqual(ups);
    dismissLevelUps();
    expect(readLevelUps()).toEqual([]);
  });
});
