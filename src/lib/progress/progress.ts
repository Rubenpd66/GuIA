import type { ExamPart } from "@/lib/exam/format";
import type { ItemResult } from "@/lib/trainer/score";
import { Progress, type Attempt, type MistakeEntry } from "./schema";

export const EMPTY_PROGRESS: Progress = {
  version: 1,
  attempts: [],
  mistakes: {},
};
export const MAX_ATTEMPTS = 200;
/** Correct answers in a row that take an item out of the mistakes bank. */
export const STREAK_TO_CLEAR = 2;

/** Stored progress, or an empty record if there is none or it cannot be read. */
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return EMPTY_PROGRESS;
  try {
    const result = Progress.safeParse(JSON.parse(raw));
    return result.success ? result.data : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

type FinishedSession = {
  part: ExamPart;
  mode: "study" | "exam";
  startedAt: number;
  finishedAt: number;
  results: readonly ItemResult[];
};

export function recordSession(
  progress: Progress,
  session: FinishedSession,
): Progress {
  const mistakes: Record<string, MistakeEntry> = { ...progress.mistakes };
  for (const { key, correct } of session.results) {
    const previous = mistakes[key];
    if (!correct) {
      mistakes[key] = {
        part: session.part,
        count: (previous?.count ?? 0) + 1,
        streak: 0,
        lastSeen: session.finishedAt,
      };
    } else if (previous) {
      const streak = previous.streak + 1;
      if (streak >= STREAK_TO_CLEAR) delete mistakes[key];
      else
        mistakes[key] = { ...previous, streak, lastSeen: session.finishedAt };
    }
  }
  return recordAttempt(
    { ...progress, mistakes },
    {
      part: session.part,
      mode: session.mode,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      correct: session.results.filter((result) => result.correct).length,
      total: session.results.length,
    },
  );
}

/** Adds an attempt without touching the mistakes bank (Writing self-assessment, for example). */
export function recordAttempt(
  progress: Progress,
  attempt: Omit<Attempt, "id">,
): Progress {
  return {
    version: 1,
    attempts: [
      ...progress.attempts,
      { id: `${attempt.part}-${attempt.startedAt}`, ...attempt },
    ].slice(-MAX_ATTEMPTS),
    mistakes: progress.mistakes,
  };
}

export function mistakeKeys(progress: Progress, part: ExamPart): string[] {
  return Object.entries(progress.mistakes)
    .filter(([, entry]) => entry.part === part)
    .map(([key]) => key);
}

export function exportProgress(progress: Progress, exportedAt: number): string {
  return JSON.stringify({ app: "sello", exportedAt, progress }, null, 2);
}

export type ImportResult =
  | { ok: true; progress: Progress }
  | { ok: false; error: "invalid-json" | "not-sello" | "invalid-data" };

export function importProgress(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalid-json" };
  }
  if (
    typeof data !== "object" ||
    data === null ||
    (data as { app?: unknown }).app !== "sello"
  ) {
    return { ok: false, error: "not-sello" };
  }
  const result = Progress.safeParse((data as { progress?: unknown }).progress);
  return result.success
    ? { ok: true, progress: result.data }
    : { ok: false, error: "invalid-data" };
}
