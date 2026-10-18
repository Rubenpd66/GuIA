import type { Answers } from "./score";

export type TrainerMode = "study" | "exam";

export type TrainerState = {
  mode: TrainerMode;
  /** Number of screens: questions in Grammar, tasks in Vocabulary. */
  steps: number;
  index: number;
  answers: Answers;
  /** Study mode only: items whose explanation is showing (their answer is locked). */
  revealed: Record<string, true>;
  startedAt: number;
  finishedAt?: number;
};

export type TrainerAction =
  | { type: "answer"; key: string; choice: number }
  | { type: "reveal"; keys: readonly string[] }
  | { type: "next" }
  | { type: "prev" }
  | { type: "go"; index: number }
  | { type: "finish"; at: number };

export function initialTrainerState({
  mode,
  steps,
  startedAt,
}: {
  mode: TrainerMode;
  steps: number;
  startedAt: number;
}): TrainerState {
  return { mode, steps, index: 0, answers: {}, revealed: {}, startedAt };
}

const clamp = (index: number, steps: number) =>
  Math.min(Math.max(index, 0), steps - 1);

export function trainerReducer(
  state: TrainerState,
  action: TrainerAction,
): TrainerState {
  if (state.finishedAt !== undefined) return state;
  switch (action.type) {
    case "answer":
      if (state.revealed[action.key]) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.choice },
      };
    case "reveal":
      if (state.mode === "exam") return state;
      return {
        ...state,
        revealed: {
          ...state.revealed,
          ...Object.fromEntries(action.keys.map((key) => [key, true as const])),
        },
      };
    case "next":
      return { ...state, index: clamp(state.index + 1, state.steps) };
    case "prev":
      return { ...state, index: clamp(state.index - 1, state.steps) };
    case "go":
      return { ...state, index: clamp(action.index, state.steps) };
    case "finish":
      return { ...state, finishedAt: action.at };
  }
}
