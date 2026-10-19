import type { CefrLevel } from "@/lib/content/schemas/common";
import type {
  Listening1Exercise,
  Listening2Exercise,
  Listening3Exercise,
  Listening4Exercise,
  Script,
} from "@/lib/content/schemas/listening";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { LISTENING_PART_EXAM } from "./config";
import { shuffle, type Rng } from "./random";
import type { TrainerMode } from "./reducer";

export type ListeningPart = keyof typeof LISTENING_PART_EXAM;
export type ListeningExercise =
  | Listening1Exercise
  | Listening2Exercise
  | Listening3Exercise
  | Listening4Exercise;

/** Part 3 answers are stored as the index into this list. */
export const SPEAKER_CHOICES = ["man", "woman", "both"] as const;

export const listeningKey = (taskId: string, index: number) =>
  `${taskId}#${index}`;

/** Items of a task: one question (1), speakers (2), statements (3) or questions (4). */
export function listeningItems(
  task: ListeningExercise,
): { key: string; answer: number }[] {
  switch (task.examPart) {
    case "listening-1":
      return [{ key: listeningKey(task.id, 0), answer: task.answer }];
    case "listening-2":
      return task.speakers.map((speaker, i) => ({
        key: listeningKey(task.id, i),
        answer: speaker.answer,
      }));
    case "listening-3":
      return task.statements.map((statement, i) => ({
        key: listeningKey(task.id, i),
        answer: SPEAKER_CHOICES.indexOf(statement.answer),
      }));
    case "listening-4":
      return task.questions.map((question, i) => ({
        key: listeningKey(task.id, i),
        answer: question.answer,
      }));
  }
}

/** The recordings of a task; part 2 has one per speaker, the rest a single one. */
export function recordings(
  task: ListeningExercise,
): { id: string; script: Script }[] {
  return task.examPart === "listening-2"
    ? task.speakers.map((speaker, i) => ({
        id: `${task.id}@${i}`,
        script: speaker.script,
      }))
    : [{ id: task.id, script: task.script }];
}

/** Exam mode lets each recording be played `maxPlays` times; study mode has no limit. */
export function playsLeft(mode: TrainerMode, played: number): number {
  return mode === "exam"
    ? Math.max(0, EXAM_FORMAT.listening.maxPlays - played)
    : Infinity;
}

type ListeningSessionOptions = {
  tasks: readonly ListeningExercise[];
  part: ListeningPart;
  mode: TrainerMode;
  rng: Rng;
  levels?: readonly CefrLevel[];
  /** Only tasks that contain at least one of these items (reviewing mistakes). */
  onlyKeys?: readonly string[];
};

/** One task to study, or the exam's number of different tasks (fewer if the bank is small). */
export function buildListeningSession({
  tasks,
  part,
  mode,
  rng,
  levels,
  onlyKeys,
}: ListeningSessionOptions): ListeningExercise[] {
  const keys = onlyKeys ? new Set(onlyKeys) : undefined;
  const pool = tasks.filter(
    (task) =>
      task.examPart === part &&
      (!levels || levels.includes(task.cefrLevel)) &&
      (!keys || listeningItems(task).some((item) => keys.has(item.key))),
  );
  const count = keys
    ? pool.length
    : mode === "exam"
      ? LISTENING_PART_EXAM[part].tasks
      : 1;
  return shuffle(pool, rng).slice(0, count);
}
