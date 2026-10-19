import { describe, expect, it } from "vitest";
import type { Progress } from "@/lib/progress/schema";
import { estimateAll } from "./level";
import { suggestions, weakestParts } from "./next";

const NOW = new Date(2026, 9, 19, 12).getTime();
const tries = (part: Progress["attempts"][number]["part"], ratio: number) =>
  [0, 1].map((i) => ({
    id: `${part}-${i}`,
    part,
    mode: "study" as const,
    startedAt: i,
    finishedAt: i + 1,
    correct: Math.round(ratio * 10),
    total: 10,
  }));

const progress = (
  attempts: Progress["attempts"],
  mistakes: Progress["mistakes"] = {},
): Progress => ({ version: 1, attempts, mistakes });

describe("suggestions", () => {
  it("starts with a part that has no data, then the weakest part", () => {
    const p = progress([
      ...tries("core-grammar", 0.9),
      ...tries("core-vocabulary", 0.5),
    ]);
    expect(suggestions(p, estimateAll(p), NOW)).toEqual([
      { kind: "start", part: "reading-1" },
      { kind: "weakest", part: "core-vocabulary" },
    ]);
  });

  it("puts a mock exam first when the exam is two weeks away or less", () => {
    const p = progress([], {
      a: { part: "reading-3", count: 1, streak: 0, lastSeen: 0 },
      b: { part: "reading-3", count: 2, streak: 0, lastSeen: 0 },
      c: { part: "core-grammar", count: 1, streak: 0, lastSeen: 0 },
    });
    expect(suggestions(p, estimateAll(p), NOW, "2026-11-02")).toEqual([
      { kind: "mock", daysLeft: 14 },
      { kind: "start", part: "core-grammar" },
      { kind: "mistakes", part: "reading-3", count: 2 },
    ]);
    expect(suggestions(p, estimateAll(p), NOW, "2026-11-03")[0]?.kind).toBe(
      "start",
    );
    // A date in the past suggests nothing.
    expect(suggestions(p, estimateAll(p), NOW, "2026-10-18")[0]?.kind).toBe(
      "start",
    );
  });
});

describe("weakestParts", () => {
  it("lists the parts with the lowest estimates", () => {
    const p = progress([
      ...tries("reading-1", 0.9),
      ...tries("reading-2", 0.4),
      ...tries("listening-1", 0.6),
      ...tries("writing-2", 0.7),
    ]);
    expect(weakestParts(estimateAll(p))).toEqual([
      "reading-2",
      "listening-1",
      "writing-2",
    ]);
  });
});
