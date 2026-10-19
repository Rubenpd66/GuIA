import type { CefrLevel } from "@/lib/content/schemas/common";
import type {
  AnnotatedText,
  Writing1Exercise,
  Writing2Exercise,
  Writing3Exercise,
  Writing4Exercise,
} from "@/lib/content/schemas/writing";
import { countWords } from "@/lib/content/text";
import { EXAM_FORMAT, type WordRange } from "@/lib/exam/format";
import { WRITING_PART_EXAM } from "./config";
import { shuffle, type Rng } from "./random";

export type WritingPart = keyof typeof WRITING_PART_EXAM;
export type WritingExercise =
  Writing1Exercise | Writing2Exercise | Writing3Exercise | Writing4Exercise;
export type WordStatus = "below" | "within" | "above";

const { part1, part2, part3, part4 } = EXAM_FORMAT.writing;

export function wordStatus(
  text: string,
  [min, max]: WordRange,
): { count: number; status: WordStatus } {
  const count = countWords(text);
  return {
    count,
    status: count < min ? "below" : count > max ? "above" : "within",
  };
}

/** One thing the learner writes: a message (part 1), a reply (parts 2–3) or an email (part 4). */
export type WritingItem = {
  /** Also the draft key. */
  key: string;
  prompt: string;
  range: WordRange;
  recipient?: string;
  models?: { b2: AnnotatedText; c: AnnotatedText };
  sampleAnswers?: string[];
};

export function writingItems(task: WritingExercise): WritingItem[] {
  const key = (suffix: string | number) => `${task.id}#${suffix}`;
  switch (task.examPart) {
    case "writing-1":
      return task.messages.map((message, i) => ({
        key: key(i),
        prompt: message.prompt,
        range: [1, part1.maxWords],
        sampleAnswers: message.sampleAnswers,
      }));
    case "writing-2":
      return [
        {
          key: key(0),
          prompt: task.prompt,
          range: part2.words,
          models: task.models,
        },
      ];
    case "writing-3":
      return task.questions.map((question, i) => ({
        key: key(i),
        prompt: question.prompt,
        range: part3.words,
        models: question.models,
      }));
    case "writing-4":
      return [
        {
          key: key("informal"),
          prompt: task.informal.prompt,
          range: part4.informalWords,
          models: task.informal.models,
        },
        {
          key: key("formal"),
          prompt: task.formal.prompt,
          recipient: task.formal.recipient,
          range: part4.formalWords,
          models: task.formal.models,
        },
      ];
  }
}

export type Segment = { text: string; annotation?: number };

/**
 * Splits a model answer into plain and annotated stretches. Each annotation takes the first
 * occurrence of its quote that no earlier annotation has taken, so a quote used twice marks
 * two places; an annotation with no free occurrence is left unmarked (its note still shows).
 */
export function annotatedSegments(model: AnnotatedText): Segment[] {
  const taken: { start: number; end: number; annotation: number }[] = [];
  model.annotations.forEach(({ quote }, annotation) => {
    let start = model.text.indexOf(quote);
    while (start !== -1) {
      const end = start + quote.length;
      if (!taken.some((t) => start < t.end && t.start < end)) {
        taken.push({ start, end, annotation });
        return;
      }
      start = model.text.indexOf(quote, start + 1);
    }
  });
  taken.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end, annotation } of taken) {
    if (start > cursor)
      segments.push({ text: model.text.slice(cursor, start) });
    segments.push({ text: model.text.slice(start, end), annotation });
    cursor = end;
  }
  if (cursor < model.text.length)
    segments.push({ text: model.text.slice(cursor) });
  return segments;
}

/** The app's own self-assessment criteria (not the official marking scale). */
export const RUBRIC_CRITERIA = [
  "task",
  "organisation",
  "language",
  "register",
] as const;
export type RubricCriterion = (typeof RUBRIC_CRITERIA)[number];

type WritingSessionOptions = {
  tasks: readonly WritingExercise[];
  part: WritingPart;
  rng: Rng;
  levels?: readonly CefrLevel[];
  /** Tasks with an unfinished draft: one of them is picked first so the text is not stranded. */
  draftedIds?: readonly string[];
};

/** One task per session in both modes: the exam has one task per part. */
export function buildWritingSession({
  tasks,
  part,
  rng,
  levels,
  draftedIds = [],
}: WritingSessionOptions): WritingExercise[] {
  const pool = tasks.filter(
    (task) =>
      task.examPart === part && (!levels || levels.includes(task.cefrLevel)),
  );
  const drafted = pool.find((task) => draftedIds.includes(task.id));
  return drafted ? [drafted] : shuffle(pool, rng).slice(0, 1);
}

/**
 * The message key for a model answer's label. A2 tasks keep the schema's `b2` / `c` slots, but
 * their models are written at A2, so calling them "B2" would overstate the learner's level.
 */
export function modelLabelKey(
  model: "b2" | "c",
  level: CefrLevel,
): "b2" | "c" | "basic" | "rich" {
  if (level !== "A2") return model;
  return model === "b2" ? "basic" : "rich";
}
