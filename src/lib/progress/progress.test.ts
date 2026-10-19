import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  MAX_ATTEMPTS,
  exportProgress,
  importProgress,
  mistakeKeys,
  parseProgress,
  recordAttempt,
  recordSession,
} from "./progress";

const session = (results: { key: string; correct: boolean }[], at = 2000) => ({
  part: "core-grammar" as const,
  mode: "study" as const,
  startedAt: at - 1000,
  finishedAt: at,
  results: results.map((r) => ({ ...r, chosen: r.correct ? 0 : 1 })),
});

describe("parseProgress", () => {
  it("starts empty when nothing is stored or the data is unusable", () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("{not json")).toEqual(EMPTY_PROGRESS);
    expect(
      parseProgress(JSON.stringify({ version: 99, attempts: [] })),
    ).toEqual(EMPTY_PROGRESS);
    expect(
      parseProgress(JSON.stringify({ version: 1, attempts: "x" })),
    ).toEqual(EMPTY_PROGRESS);
  });

  it("reads valid stored progress", () => {
    const stored = recordSession(
      EMPTY_PROGRESS,
      session([{ key: "q1", correct: false }]),
    );
    expect(parseProgress(JSON.stringify(stored))).toEqual(stored);
  });
});

describe("recordSession", () => {
  it("adds the attempt with its score", () => {
    const progress = recordSession(
      EMPTY_PROGRESS,
      session([
        { key: "q1", correct: true },
        { key: "q2", correct: false },
      ]),
    );
    expect(progress.attempts).toEqual([
      {
        id: "core-grammar-1000",
        part: "core-grammar",
        mode: "study",
        startedAt: 1000,
        finishedAt: 2000,
        correct: 1,
        total: 2,
      },
    ]);
  });

  it("keeps a mistake until it is answered correctly twice in a row", () => {
    let progress = recordSession(
      EMPTY_PROGRESS,
      session([{ key: "q1", correct: false }], 2000),
    );
    expect(progress.mistakes.q1).toEqual({
      part: "core-grammar",
      count: 1,
      streak: 0,
      lastSeen: 2000,
    });

    progress = recordSession(
      progress,
      session([{ key: "q1", correct: false }], 3000),
    );
    expect(progress.mistakes.q1?.count).toBe(2);

    progress = recordSession(
      progress,
      session([{ key: "q1", correct: true }], 4000),
    );
    expect(progress.mistakes.q1?.streak).toBe(1);

    progress = recordSession(
      progress,
      session([{ key: "q1", correct: true }], 5000),
    );
    expect(progress.mistakes.q1).toBeUndefined();
  });

  it("does not add correct answers to the mistakes bank", () => {
    const progress = recordSession(
      EMPTY_PROGRESS,
      session([{ key: "q1", correct: true }]),
    );
    expect(progress.mistakes).toEqual({});
  });

  it(`keeps only the last ${MAX_ATTEMPTS} attempts`, () => {
    let progress = EMPTY_PROGRESS;
    for (let i = 0; i < MAX_ATTEMPTS + 5; i++) {
      progress = recordSession(
        progress,
        session([{ key: "q", correct: true }], 10_000 + i * 10),
      );
    }
    expect(progress.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(progress.attempts.at(-1)?.finishedAt).toBe(
      10_000 + (MAX_ATTEMPTS + 4) * 10,
    );
  });
});

describe("mistakeKeys", () => {
  it("lists the keys of one exam part", () => {
    let progress = recordSession(
      EMPTY_PROGRESS,
      session([{ key: "q1", correct: false }]),
    );
    progress = recordSession(progress, {
      ...session([{ key: "t#a", correct: false }]),
      part: "core-vocabulary",
    });
    expect(mistakeKeys(progress, "core-grammar")).toEqual(["q1"]);
    expect(mistakeKeys(progress, "core-vocabulary")).toEqual(["t#a"]);
  });
});

describe("export and import", () => {
  const progress = recordSession(
    EMPTY_PROGRESS,
    session([{ key: "q1", correct: false }]),
  );

  it("round-trips through the exported file", () => {
    const result = importProgress(exportProgress(progress, 123));
    expect(result).toEqual({ ok: true, progress, extras: {} });
  });

  it("carries the extras and drops damaged ones", () => {
    const file = exportProgress(progress, 123, { examDate: "2026-12-01" });
    expect(importProgress(file)).toMatchObject({
      ok: true,
      extras: { examDate: "2026-12-01" },
    });
    const damaged = JSON.stringify({
      app: "sello",
      progress,
      examDate: "soon",
    });
    expect(importProgress(damaged)).toMatchObject({ ok: true, extras: {} });
  });

  it("rejects files that are not JSON, not from Sello or damaged", () => {
    expect(importProgress("hello")).toEqual({
      ok: false,
      error: "invalid-json",
    });
    expect(importProgress(JSON.stringify({ app: "other", progress }))).toEqual({
      ok: false,
      error: "not-sello",
    });
    expect(
      importProgress(
        JSON.stringify({ app: "sello", progress: { version: 1, attempts: 5 } }),
      ),
    ).toEqual({ ok: false, error: "invalid-data" });
  });
});

describe("recordAttempt", () => {
  it("adds the attempt and leaves the mistakes bank alone", () => {
    const before = recordSession(
      EMPTY_PROGRESS,
      session([{ key: "g1", correct: false }]),
    );
    const after = recordAttempt(before, {
      part: "writing-2",
      mode: "exam",
      startedAt: 5000,
      finishedAt: 9000,
      correct: 3,
      total: 4,
    });
    expect(after.mistakes).toBe(before.mistakes);
    expect(after.attempts.at(-1)).toEqual({
      id: "writing-2-5000",
      part: "writing-2",
      mode: "exam",
      startedAt: 5000,
      finishedAt: 9000,
      correct: 3,
      total: 4,
    });
  });
});
