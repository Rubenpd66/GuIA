import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import {
  Speaking1Exercise,
  Speaking4Exercise,
} from "@/lib/content/schemas/speaking";
import { createRng } from "./random";
import {
  buildSpeakingSession,
  initialSpeakingState,
  modelWordRange,
  speakingReducer,
  speakingTurns,
  type SpeakingAction,
  type SpeakingState,
} from "./speaking";

const s1 = Speaking1Exercise.parse(validExercises["speaking-1"]);
const s4 = Speaking4Exercise.parse(validExercises["speaking-4"]);

const run = (state: SpeakingState, actions: SpeakingAction[]) =>
  actions.reduce(speakingReducer, state);

describe("modelWordRange", () => {
  it("sizes models from the answer time; part 4 shares two minutes between three questions", () => {
    expect(modelWordRange("speaking-1")).toEqual([40, 73]);
    expect(modelWordRange("speaking-3")).toEqual([59, 109]);
    expect(modelWordRange("speaking-4")).toEqual([53, 97]);
  });
});

describe("speakingTurns", () => {
  it("gives parts 1–3 one turn per question and part 4 a single turn", () => {
    expect(speakingTurns(s1).map((turn) => turn.key)).toEqual([
      `${s1.id}#0`,
      `${s1.id}#1`,
      `${s1.id}#2`,
    ]);
    expect(speakingTurns(s4)).toHaveLength(1);
    expect(speakingTurns(s4)[0]!.questions).toHaveLength(3);
  });
});

describe("speakingReducer", () => {
  it("starts the answer time in exam mode only once the question has been read", () => {
    const start = initialSpeakingState("speaking-1", "exam", 3);
    expect(run(start, [{ type: "tick", at: 99_000 }])).toEqual(start);
    const answering = run(start, [{ type: "read-end", at: 5000 }]);
    expect(answering).toMatchObject({ phase: "answering", endsAt: 35_000 });
    expect(run(answering, [{ type: "read-end", at: 9000 }]).endsAt).toBe(
      35_000,
    );
    expect(run(answering, [{ type: "tick", at: 34_999 }]).phase).toBe(
      "answering",
    );
    expect(run(answering, [{ type: "tick", at: 35_000 }])).toMatchObject({
      phase: "done",
      endsAt: null,
    });
  });

  it("gives part 4 a minute to prepare, then one two-minute turn from the prep deadline", () => {
    const state = run(initialSpeakingState("speaking-4", "exam", 1), [
      { type: "read-end", at: 0 },
    ]);
    expect(state).toMatchObject({ phase: "preparing", endsAt: 60_000 });
    // A late tick does not shorten the answer time.
    const answering = run(state, [{ type: "tick", at: 61_000 }]);
    expect(answering).toMatchObject({ phase: "answering", endsAt: 180_000 });
    const finished = run(answering, [
      { type: "tick", at: 180_000 },
      { type: "next" },
    ]);
    expect(finished.phase).toBe("finished");
  });

  it("lets the learner stop preparing or answering early", () => {
    const state = run(initialSpeakingState("speaking-4", "exam", 1), [
      { type: "read-end", at: 0 },
      { type: "stop", at: 10_000 },
    ]);
    expect(state).toMatchObject({ phase: "answering", endsAt: 130_000 });
    expect(run(state, [{ type: "stop", at: 20_000 }]).phase).toBe("done");
  });

  it("waits for the learner in study mode and allows retries there only", () => {
    const ready = run(initialSpeakingState("speaking-2", "study", 3), [
      { type: "read-end", at: 0 },
    ]);
    expect(ready).toMatchObject({ phase: "ready", endsAt: null });
    const done = run(ready, [
      { type: "start", at: 1000 },
      { type: "tick", at: 46_000 },
    ]);
    expect(done.phase).toBe("done");
    expect(run(done, [{ type: "retry" }]).phase).toBe("ready");
    const exam = run(initialSpeakingState("speaking-2", "exam", 3), [
      { type: "read-end", at: 0 },
      { type: "tick", at: 45_000 },
      { type: "retry" },
    ]);
    expect(exam.phase).toBe("done");
  });

  it("moves through the turns and ignores next before a turn is done", () => {
    let state = initialSpeakingState("speaking-1", "exam", 3);
    expect(run(state, [{ type: "next" }])).toEqual(state);
    for (let turn = 0; turn < 3; turn++) {
      expect(state).toMatchObject({ turn, phase: "reading" });
      state = run(state, [
        { type: "read-end", at: 0 },
        { type: "stop", at: 1 },
        { type: "next" },
      ]);
    }
    expect(state.phase).toBe("finished");
  });
});

describe("buildSpeakingSession", () => {
  it("picks one task of the part and level", () => {
    const tasks = [s1, { ...s1, id: "s1-other", cefrLevel: "B2" as const }, s4];
    expect(
      buildSpeakingSession({
        tasks,
        part: "speaking-1",
        rng: createRng(3),
        levels: ["B2"],
      }).map((task) => task.id),
    ).toEqual(["s1-other"]);
  });
});
