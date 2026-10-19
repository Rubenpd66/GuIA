import { describe, expect, it } from "vitest";
import { validExercises } from "../../../tests/fixtures/content";
import {
  Listening1Exercise,
  Listening2Exercise,
  Listening3Exercise,
  Listening4Exercise,
} from "@/lib/content/schemas/listening";
import { createRng } from "./random";
import {
  buildListeningSession,
  listeningItems,
  playsLeft,
  recordings,
} from "./listening";
import { scoreItems } from "./score";

const l1 = Listening1Exercise.parse(validExercises["listening-1"]);
const l2 = Listening2Exercise.parse(validExercises["listening-2"]);
const l3 = Listening3Exercise.parse(validExercises["listening-3"]);
const l4 = Listening4Exercise.parse(validExercises["listening-4"]);

const withId = <T extends { id: string }>(task: T, id: string): T => ({
  ...structuredClone(task),
  id,
});

describe("listeningItems", () => {
  it("has the items each part marks", () => {
    expect(listeningItems(l1)).toHaveLength(1);
    expect(listeningItems(l2)).toHaveLength(4);
    expect(listeningItems(l3)).toHaveLength(4);
    expect(listeningItems(l4)).toHaveLength(2);
  });

  it("maps part 3 answers to man, woman and both as 0, 1 and 2", () => {
    const answers = listeningItems(l3).map((item) => item.answer);
    expect(answers).toEqual(
      l3.statements.map((s) => ["man", "woman", "both"].indexOf(s.answer)),
    );
  });
});

describe("recordings", () => {
  it("gives part 2 one recording per speaker and the others one", () => {
    expect(recordings(l2).map((r) => r.id)).toEqual(
      [0, 1, 2, 3].map((i) => `${l2.id}@${i}`),
    );
    expect(recordings(l4)).toEqual([{ id: l4.id, script: l4.script }]);
  });
});

describe("playsLeft", () => {
  it("stops at two plays in exam mode and never in study mode", () => {
    expect(playsLeft("exam", 0)).toBe(2);
    expect(playsLeft("exam", 1)).toBe(1);
    expect(playsLeft("exam", 2)).toBe(0);
    expect(playsLeft("exam", 5)).toBe(0);
    expect(playsLeft("study", 9)).toBe(Infinity);
  });
});

describe("scoring", () => {
  it("counts a part 2 option chosen twice only where it is right", () => {
    const items = listeningItems(l2);
    const answers = Object.fromEntries(
      items.map((item) => [item.key, items[0]!.answer]),
    );
    expect(scoreItems(items, answers).correct).toBe(1);
  });

  it("scores part 3 'both' as index 2", () => {
    const items = listeningItems(l3);
    const answers = Object.fromEntries(items.map((i) => [i.key, i.answer]));
    expect(scoreItems(items, answers).correct).toBe(4);
  });
});

describe("buildListeningSession", () => {
  const bank = Array.from({ length: 8 }, (_, i) => withId(l1, `l1-${i}`));

  it("gives one task in study mode and five in exam mode for part 1", () => {
    const options = {
      tasks: bank,
      part: "listening-1",
      rng: createRng(1),
    } as const;
    expect(buildListeningSession({ ...options, mode: "study" })).toHaveLength(
      1,
    );
    const exam = buildListeningSession({ ...options, mode: "exam" });
    expect(exam).toHaveLength(5);
    expect(new Set(exam.map((t) => t.id)).size).toBe(5);
  });

  it("is shorter, not broken, when the bank is small", () => {
    const session = buildListeningSession({
      tasks: bank.slice(0, 2),
      part: "listening-1",
      mode: "exam",
      rng: createRng(1),
    });
    expect(session).toHaveLength(2);
  });

  it("keeps only tasks with the mistaken items and ignores other parts", () => {
    const tasks = [...bank, l2];
    const session = buildListeningSession({
      tasks,
      part: "listening-1",
      mode: "study",
      rng: createRng(1),
      onlyKeys: ["l1-3#0"],
    });
    expect(session.map((t) => t.id)).toEqual(["l1-3"]);
  });
});
