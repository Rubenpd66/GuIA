/* eslint-disable @typescript-eslint/no-explicit-any -- tests break fixtures on purpose */
import { describe, expect, it } from "vitest";
import { validExercises, words } from "../../../../tests/fixtures/content";
import { EXAM_PARTS, type ExamPart } from "@/lib/exam/format";
import { Exercise } from "./exercise";

type Mutation = [
  part: ExamPart,
  description: string,
  mutate: (exercise: any) => void,
  path: (string | number)[],
];

const MUTATIONS: Mutation[] = [
  [
    "core-grammar",
    "two options",
    (e) => (e.options = e.options.slice(0, 2)),
    ["options"],
  ],
  ["core-grammar", "an answer out of range", (e) => (e.answer = 3), ["answer"]],
  [
    "core-grammar",
    "a prompt without a gap",
    (e) => (e.prompt = "No gap here."),
    ["prompt"],
  ],
  [
    "core-grammar",
    "a prompt with two gaps",
    (e) => (e.prompt = "___ and ___"),
    ["prompt"],
  ],
  [
    "core-grammar",
    "duplicate options",
    (e) => (e.options = ["a", "a", "b"]),
    ["options"],
  ],
  [
    "core-grammar",
    "two option notes",
    (e) => e.optionNotes.pop(),
    ["optionNotes"],
  ],
  ["core-grammar", "an unknown field", (e) => (e.colour = "red"), []],
  [
    "core-vocabulary",
    "an answer outside the bank",
    (e) => (e.items[0].answer = 9),
    ["items", 0, "answer"],
  ],
  [
    "core-vocabulary",
    "two items with the same answer",
    (e) => (e.items[1].answer = 0),
    ["items", 1, "answer"],
  ],
  [
    "core-vocabulary",
    "a usage item without a gap",
    (e) => (e.vocabType = "usage"),
    ["items", 0, "prompt"],
  ],
  [
    "core-vocabulary",
    "a bank of four words",
    (e) => (e.options = e.options.slice(0, 4)),
    ["options"],
  ],
  ["reading-1", "four items", (e) => e.items.pop(), ["items"]],
  [
    "reading-2",
    "five sentences",
    (e) => {
      e.sentences.pop();
      e.cohesionHints = [];
    },
    ["sentences"],
  ],
  [
    "reading-2",
    "a duplicate sentence",
    (e) => (e.sentences[5] = e.sentences[4]),
    ["sentences"],
  ],
  [
    "reading-2",
    "a hint phrase missing from its sentence",
    (e) => (e.cohesionHints[0].phrase = "Nobody"),
    ["cohesionHints", 0, "phrase"],
  ],
  ["reading-3", "three people", (e) => e.people.pop(), ["people"]],
  [
    "reading-3",
    "an answer for a fifth person",
    (e) => (e.statements[0].answer = 4),
    ["statements", 0, "answer"],
  ],
  ["reading-3", "six statements", (e) => e.statements.pop(), ["statements"]],
  [
    "reading-4",
    "a 686-word text",
    (e) => (e.paragraphs = Array.from({ length: 7 }, () => words(98))),
    ["paragraphs"],
  ],
  [
    "reading-4",
    "an 812-word text",
    (e) => (e.paragraphs = Array.from({ length: 7 }, () => words(116))),
    ["paragraphs"],
  ],
  [
    "reading-4",
    "a heading used twice",
    (e) => (e.answers[1] = e.answers[0]),
    ["answers"],
  ],
  ["reading-4", "six paragraphs", (e) => e.paragraphs.pop(), ["paragraphs"]],
  ["listening-1", "two options", (e) => e.options.pop(), ["options"]],
  ["listening-2", "five options", (e) => e.options.pop(), ["options"]],
  [
    "listening-2",
    "two speakers with the same answer",
    (e) => (e.speakers[1].answer = e.speakers[0].answer),
    ["speakers"],
  ],
  [
    "listening-3",
    "a script with only the man",
    (e) => (e.script = e.script.filter((l: any) => l.speaker === "man")),
    ["script"],
  ],
  [
    "listening-3",
    "the answer nobody",
    (e) => (e.statements[0].answer = "nobody"),
    ["statements", 0, "answer"],
  ],
  [
    "listening-4",
    "a question without cues",
    (e) => (e.questions[0].cues = []),
    ["questions", 0, "cues"],
  ],
  ["writing-1", "four messages", (e) => e.messages.pop(), ["messages"]],
  [
    "writing-1",
    "a six-word answer",
    (e) => (e.messages[0].sampleAnswers = ["one two three four five six"]),
    ["messages", 0, "sampleAnswers", 0],
  ],
  [
    "writing-2",
    "a 31-word C model",
    (e) => (e.models.c = { text: words(31), annotations: [] }),
    ["models", "c", "text"],
  ],
  [
    "writing-3",
    "a 41-word B2 model",
    (e) => (e.questions[0].models.b2 = { text: words(41), annotations: [] }),
    ["questions", 0, "models", "b2", "text"],
  ],
  [
    "writing-4",
    "a 119-word formal C model",
    (e) => (e.formal.models.c = { text: words(119), annotations: [] }),
    ["formal", "models", "c", "text"],
  ],
  [
    "writing-4",
    "a 51-word informal model",
    (e) => (e.informal.models.b2 = { text: words(51), annotations: [] }),
    ["informal", "models", "b2", "text"],
  ],
  [
    "writing-4",
    "an annotation quote not in the text",
    (e) => (e.formal.models.c.annotations[0].quote = "not in the email"),
    ["formal", "models", "c", "annotations", 0, "quote"],
  ],
  ["speaking-1", "two questions", (e) => e.questions.pop(), ["questions"]],
  ["speaking-3", "one image", (e) => e.images.pop(), ["images"]],
  ["speaking-4", "two questions", (e) => e.questions.pop(), ["questions"]],
];

describe("Exercise schema", () => {
  it.each(EXAM_PARTS)("accepts the valid %s fixture", (part) => {
    const result = Exercise.safeParse(validExercises[part]);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(MUTATIONS)("%s rejects %s", (part, _description, mutate, path) => {
    const exercise = structuredClone(validExercises[part]);
    mutate(exercise);
    const result = Exercise.safeParse(exercise);
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path) ?? [];
    expect(
      paths.some((p) => path.every((segment, i) => p[i] === segment)),
    ).toBe(true);
  });
});
