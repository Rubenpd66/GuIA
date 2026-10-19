/**
 * Pure rules for joining what this device has with what the cloud has, so signing in never
 * loses data. Every function is symmetric in what it keeps: merging twice changes nothing.
 */
import type { FlashcardsState } from "@/lib/flashcards/deck";
import { MAX_ATTEMPTS } from "@/lib/progress/progress";
import type { Attempt, MistakeEntry, Progress } from "@/lib/progress/schema";

/** A stored value with the time it was last saved, to break ties between two copies. */
export type Versioned<T> = { value: T; updatedAt: number };

/** Attempts from both sides (one per id, newest kept); a mistake the other side has since cleared stays cleared. */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const byId = new Map<string, Attempt>();
  for (const attempt of [...local.attempts, ...remote.attempts])
    byId.set(attempt.id, attempt);
  const attempts = [...byId.values()]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .slice(-MAX_ATTEMPTS);

  const latestByPart = (progress: Progress) => {
    const latest = new Map<string, number>();
    for (const a of progress.attempts)
      latest.set(a.part, Math.max(latest.get(a.part) ?? 0, a.finishedAt));
    return latest;
  };
  const mistakes: Record<string, MistakeEntry> = {};
  const sides: [Progress, Progress][] = [
    [local, remote],
    [remote, local],
  ];
  for (const [mine, other] of sides) {
    const otherLatest = latestByPart(other);
    for (const [key, entry] of Object.entries(mine.mistakes)) {
      const theirs = other.mistakes[key];
      if (theirs) {
        // On both sides: keep the copy seen last.
        if (!mistakes[key] || entry.lastSeen > mistakes[key]!.lastSeen)
          mistakes[key] = entry;
      } else if ((otherLatest.get(entry.part) ?? 0) <= entry.lastSeen) {
        mistakes[key] = entry;
      }
      // shortcut: a mistake missing on one side counts as cleared when that side practised
      // the part later, even if its session never asked that question; revisit if it matters.
    }
  }
  return { version: 1, attempts, mistakes };
}

const reviewedOf = (card: { reviewed?: string | undefined }) =>
  card.reviewed ?? "";

export function mergeFlashcards(
  local: Versioned<FlashcardsState>,
  remote: Versioned<FlashcardsState>,
): FlashcardsState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local;
  const cards: FlashcardsState["cards"] = { ...remote.value.cards };
  for (const [id, card] of Object.entries(local.value.cards)) {
    const other = cards[id];
    if (!other || reviewedOf(card) > reviewedOf(other)) cards[id] = card;
    else if (reviewedOf(card) === reviewedOf(other) && newer === local)
      cards[id] = card;
  }
  const a = local.value.newToday;
  const b = remote.value.newToday;
  const newToday =
    a.day === b.day
      ? { day: a.day, count: Math.max(a.count, b.count) }
      : a.day > b.day
        ? a
        : b;
  return {
    version: 1,
    cards,
    newToday,
    newPerDay: newer.value.newPerDay,
  };
}

/** For single values (exam date, mock exam in progress): the one saved last wins. */
export function mergeLatest<T>(local: Versioned<T>, remote: Versioned<T>): T {
  return remote.updatedAt > local.updatedAt ? remote.value : local.value;
}
