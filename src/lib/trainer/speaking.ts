import type { CefrLevel } from "@/lib/content/schemas/common";
import type {
  Speaking1Exercise,
  Speaking2Exercise,
  Speaking3Exercise,
  Speaking4Exercise,
  SpeakingQuestion,
} from "@/lib/content/schemas/speaking";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { SPEAKING_PART_EXAM } from "./config";
import { shuffle, type Rng } from "./random";
import type { TrainerMode } from "./reducer";

export type SpeakingPart = keyof typeof SPEAKING_PART_EXAM;

/** app decision: a comfortable speaking pace, used only to size the model answers. */
export const WORDS_PER_SECOND = 2.2;

/** Seconds of speech one question gets; part 4 shares its single turn between three questions. */
export function secondsPerQuestion(part: SpeakingPart): number {
  return part === "speaking-4"
    ? EXAM_FORMAT.speaking.part4.answerSeconds /
        EXAM_FORMAT.speaking.part4.questions
    : SPEAKING_PART_EXAM[part].answerSeconds;
}

/** Word range a model answer should fall in (a warning in the validator, not an error). */
export function modelWordRange(part: SpeakingPart): [number, number] {
  const target = secondsPerQuestion(part) * WORDS_PER_SECOND;
  return [Math.round(target * 0.6), Math.round(target * 1.1)];
}

export type SpeakingExercise =
  Speaking1Exercise | Speaking2Exercise | Speaking3Exercise | Speaking4Exercise;

/** One recording: a single question in parts 1–3, all three questions together in part 4. */
export type SpeakingTurn = { key: string; questions: SpeakingQuestion[] };

export function speakingTurns(task: SpeakingExercise): SpeakingTurn[] {
  return task.examPart === "speaking-4"
    ? [{ key: `${task.id}#0`, questions: task.questions }]
    : task.questions.map((question, i) => ({
        key: `${task.id}#${i}`,
        questions: [question],
      }));
}

export type TurnPhase =
  "reading" | "ready" | "preparing" | "answering" | "done";

export type SpeakingState = {
  mode: TrainerMode;
  prepSeconds: number;
  answerSeconds: number;
  turns: number;
  turn: number;
  phase: TurnPhase | "finished";
  /** When the current preparation or answer time runs out. */
  endsAt: number | null;
};

export type SpeakingAction =
  /** The question has been read out (or the silent reading time is over). */
  | { type: "read-end"; at: number }
  /** Study mode: the learner starts when ready. */
  | { type: "start"; at: number }
  /** Clock tick: moves on when the current time is up. */
  | { type: "tick"; at: number }
  /** Stops preparing or answering early. */
  | { type: "stop"; at: number }
  /** Study mode: answer the same turn again. */
  | { type: "retry" }
  | { type: "next" };

export function initialSpeakingState(
  part: SpeakingPart,
  mode: TrainerMode,
  turns: number,
): SpeakingState {
  const { prepSeconds, answerSeconds } = SPEAKING_PART_EXAM[part];
  return {
    mode,
    prepSeconds,
    answerSeconds,
    turns,
    turn: 0,
    phase: "reading",
    endsAt: null,
  };
}

const answering = (state: SpeakingState, from: number): SpeakingState => ({
  ...state,
  phase: "answering",
  endsAt: from + state.answerSeconds * 1000,
});

const begin = (state: SpeakingState, at: number): SpeakingState =>
  state.prepSeconds > 0
    ? { ...state, phase: "preparing", endsAt: at + state.prepSeconds * 1000 }
    : answering(state, at);

/**
 * Reading → (ready, study only) → (preparing, part 4) → answering → done, per turn. Time only
 * starts once the question has been read, and moves on from the previous deadline, not the tick.
 */
export function speakingReducer(
  state: SpeakingState,
  action: SpeakingAction,
): SpeakingState {
  switch (action.type) {
    case "read-end":
      if (state.phase !== "reading") return state;
      return state.mode === "exam"
        ? begin(state, action.at)
        : { ...state, phase: "ready" };
    case "start":
      return state.phase === "ready" ? begin(state, action.at) : state;
    case "tick":
      if (state.endsAt === null || action.at < state.endsAt) return state;
      if (state.phase === "preparing") return answering(state, state.endsAt);
      if (state.phase === "answering")
        return { ...state, phase: "done", endsAt: null };
      return state;
    case "stop":
      if (state.phase === "preparing") return answering(state, action.at);
      if (state.phase === "answering")
        return { ...state, phase: "done", endsAt: null };
      return state;
    case "retry":
      return state.mode === "study" && state.phase === "done"
        ? { ...state, phase: "ready" }
        : state;
    case "next":
      if (state.phase !== "done") return state;
      return state.turn + 1 >= state.turns
        ? { ...state, phase: "finished" }
        : { ...state, turn: state.turn + 1, phase: "reading" };
  }
}

/** The app's own self-assessment criteria (not the official marking scale). */
export const SPEAKING_RUBRIC = [
  "task",
  "fluency",
  "language",
  "pronunciation",
] as const;
export type SpeakingCriterion = (typeof SPEAKING_RUBRIC)[number];

/** One task per session in both modes: the exam has one task per part. */
export function buildSpeakingSession({
  tasks,
  part,
  rng,
  levels,
}: {
  tasks: readonly SpeakingExercise[];
  part: SpeakingPart;
  rng: Rng;
  levels?: readonly CefrLevel[];
}): SpeakingExercise[] {
  const pool = tasks.filter(
    (task) =>
      task.examPart === part && (!levels || levels.includes(task.cefrLevel)),
  );
  return shuffle(pool, rng).slice(0, 1);
}
