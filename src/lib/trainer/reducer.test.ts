import { describe, expect, it } from "vitest";
import {
  initialTrainerState,
  trainerReducer,
  type TrainerState,
} from "./reducer";

const start = (mode: "study" | "exam", steps = 3): TrainerState =>
  initialTrainerState({ mode, steps, startedAt: 1000 });

describe("trainerReducer in study mode", () => {
  it("locks an answer once its explanation is shown", () => {
    let state = start("study");
    state = trainerReducer(state, { type: "answer", key: "q1", choice: 2 });
    state = trainerReducer(state, { type: "reveal", keys: ["q1"] });
    state = trainerReducer(state, { type: "answer", key: "q1", choice: 0 });
    expect(state.answers.q1).toBe(2);
    expect(state.revealed.q1).toBe(true);
  });
});

describe("trainerReducer in exam mode", () => {
  it("lets you change answers and never reveals explanations", () => {
    let state = start("exam");
    state = trainerReducer(state, { type: "answer", key: "q1", choice: 2 });
    state = trainerReducer(state, { type: "answer", key: "q1", choice: 0 });
    state = trainerReducer(state, { type: "reveal", keys: ["q1"] });
    expect(state.answers.q1).toBe(0);
    expect(state.revealed.q1).toBeUndefined();
  });
});

describe("navigation", () => {
  it("moves between steps within bounds and finishes", () => {
    let state = start("exam", 2);
    state = trainerReducer(state, { type: "prev" });
    expect(state.index).toBe(0);
    state = trainerReducer(state, { type: "next" });
    state = trainerReducer(state, { type: "next" });
    expect(state.index).toBe(1);
    state = trainerReducer(state, { type: "go", index: 0 });
    expect(state.index).toBe(0);
    state = trainerReducer(state, { type: "finish", at: 5000 });
    expect(state.finishedAt).toBe(5000);
    state = trainerReducer(state, { type: "answer", key: "q9", choice: 1 });
    expect(state.answers.q9).toBeUndefined();
  });
});
