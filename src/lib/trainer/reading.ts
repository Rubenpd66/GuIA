import type { CefrLevel } from "@/lib/content/schemas/common";
import type {
  Reading1Exercise,
  Reading2Exercise,
  Reading3Exercise,
  Reading4Exercise,
} from "@/lib/content/schemas/reading";
import { READING_PART_EXAM } from "./config";
import { shuffle, type Rng } from "./random";
import type { TrainerMode } from "./reducer";

export type ReadingPart = keyof typeof READING_PART_EXAM;
export type ReadingExercise =
  Reading1Exercise | Reading2Exercise | Reading3Exercise | Reading4Exercise;

export const readingKey = (taskId: string, index: number) =>
  `${taskId}#${index}`;

/**
 * The marked items of a task: gaps (part 1), positions 1–5 (part 2, answer = the sentence
 * that belongs there), statements (part 3) and paragraphs (part 4).
 */
export function readingItems(
  task: ReadingExercise,
): { key: string; answer: number }[] {
  switch (task.examPart) {
    case "reading-1":
      return task.items.map((item, i) => ({
        key: readingKey(task.id, i),
        answer: item.answer,
      }));
    case "reading-2":
      return task.sentences.slice(1).map((_, i) => ({
        key: readingKey(task.id, i + 1),
        answer: i + 1,
      }));
    case "reading-3":
      return task.statements.map((statement, i) => ({
        key: readingKey(task.id, i),
        answer: statement.answer,
      }));
    case "reading-4":
      return task.answers.map((answer, i) => ({
        key: readingKey(task.id, i),
        answer,
      }));
  }
}

/** Starting order for part 2: the first sentence stays put and the rest never start solved. */
export function initialOrder(task: Reading2Exercise, rng: Rng): number[] {
  const rest = task.sentences.slice(1).map((_, i) => i + 1);
  let shuffled = shuffle(rest, rng);
  while (shuffled.every((sentence, i) => sentence === rest[i])) {
    shuffled = shuffle(rest, rng);
  }
  return [0, ...shuffled];
}

/** Moves one sentence; position 0 is fixed and out-of-range moves are ignored. */
export function moveItem(order: number[], from: number, to: number): number[] {
  const last = order.length - 1;
  if (from < 1 || to < 1 || from > last || to > last || from === to)
    return order;
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

type ReadingSessionOptions = {
  tasks: readonly ReadingExercise[];
  part: ReadingPart;
  mode: TrainerMode;
  rng: Rng;
  levels?: readonly CefrLevel[];
  /** Only tasks that contain at least one of these items (reviewing mistakes). */
  onlyKeys?: readonly string[];
};

/** One task to study, or the exam's number of different tasks (fewer if the bank is small). */
export function buildReadingSession({
  tasks,
  part,
  mode,
  rng,
  levels,
  onlyKeys,
}: ReadingSessionOptions): ReadingExercise[] {
  const keys = onlyKeys ? new Set(onlyKeys) : undefined;
  const pool = tasks.filter(
    (task) =>
      task.examPart === part &&
      (!levels || levels.includes(task.cefrLevel)) &&
      (!keys || readingItems(task).some((item) => keys.has(item.key))),
  );
  const count = keys
    ? pool.length
    : mode === "exam"
      ? READING_PART_EXAM[part].tasks
      : 1;
  return shuffle(pool, rng).slice(0, count);
}
