import type {
  CoreGrammarExercise,
  CoreVocabularyExercise,
} from "@/lib/content/schemas/core";
import { EXAM_FORMAT, type Skill } from "@/lib/exam/format";
import {
  CORE_PART_EXAM,
  READING_PART_EXAM,
  WRITING_PART_EXAM,
} from "@/lib/trainer/config";
import {
  buildListeningSession,
  type ListeningExercise,
  type ListeningPart,
} from "@/lib/trainer/listening";
import { createRng } from "@/lib/trainer/random";
import {
  buildReadingSession,
  initialOrder,
  type ReadingExercise,
  type ReadingPart,
} from "@/lib/trainer/reading";
import {
  buildGrammarSession,
  buildVocabularySession,
} from "@/lib/trainer/session";
import {
  buildSpeakingSession,
  type SpeakingExercise,
  type SpeakingPart,
} from "@/lib/trainer/speaking";
import {
  buildWritingSession,
  type WritingExercise,
  type WritingPart,
} from "@/lib/trainer/writing";
import type { Step } from "./steps";

export type MockBank = {
  grammar: CoreGrammarExercise[];
  vocabulary: CoreVocabularyExercise[];
  reading: ReadingExercise[];
  listening: ListeningExercise[];
  writing: WritingExercise[];
  speaking: SpeakingExercise[];
};

const READING: ReadingPart[] = [
  "reading-1",
  "reading-2",
  "reading-3",
  "reading-4",
];
const LISTENING: ListeningPart[] = [
  "listening-1",
  "listening-2",
  "listening-3",
  "listening-4",
];
const WRITING: WritingPart[] = [
  "writing-1",
  "writing-2",
  "writing-3",
  "writing-4",
];
const SPEAKING: SpeakingPart[] = [
  "speaking-1",
  "speaking-2",
  "speaking-3",
  "speaking-4",
];

const empty = { id: 0, mode: "exam" as const, startedAt: 0, deadline: null };

/**
 * The sections of the chosen components, in exam order. The same seed always gives the same
 * tasks, so a mock exam can be rebuilt after a reload.
 */
export function buildMockSteps(
  bank: MockBank,
  components: readonly Skill[],
  seed: number,
): Step[] {
  const rng = createRng(seed);
  const steps: Step[] = [];
  const want = new Set(components);
  if (want.has("core")) {
    steps.push({
      kind: "grammar",
      part: "core-grammar",
      session: {
        ...empty,
        questions: buildGrammarSession({
          exercises: bank.grammar,
          count: CORE_PART_EXAM.grammar.count,
          rng,
        }),
      },
    });
    steps.push({
      kind: "vocabulary",
      part: "core-vocabulary",
      session: {
        ...empty,
        tasks: buildVocabularySession({
          tasks: bank.vocabulary,
          count: CORE_PART_EXAM.vocabulary.count,
          rng,
        }),
      },
    });
  }
  if (want.has("reading"))
    for (const part of READING) {
      const tasks = buildReadingSession({
        tasks: bank.reading,
        part,
        mode: "exam",
        rng,
      });
      if (!tasks.length) continue;
      const orders = Object.fromEntries(
        tasks.flatMap((task) =>
          task.examPart === "reading-2"
            ? [[task.id, initialOrder(task, rng)]]
            : [],
        ),
      );
      steps.push({
        kind: "reading",
        part,
        session: { ...empty, tasks, orders },
      });
    }
  if (want.has("listening"))
    for (const part of LISTENING) {
      const tasks = buildListeningSession({
        tasks: bank.listening,
        part,
        mode: "exam",
        rng,
      });
      if (tasks.length)
        steps.push({
          kind: "listening",
          part,
          session: { id: 0, mode: "exam", startedAt: 0, tasks },
        });
    }
  if (want.has("writing"))
    for (const part of WRITING) {
      const [task] = buildWritingSession({ tasks: bank.writing, part, rng });
      if (task)
        steps.push({ kind: "writing", part, session: { ...empty, task } });
    }
  if (want.has("speaking"))
    for (const part of SPEAKING) {
      const [task] = buildSpeakingSession({ tasks: bank.speaking, part, rng });
      if (task)
        steps.push({
          kind: "speaking",
          part,
          session: { id: 0, mode: "exam", task },
        });
    }
  return steps;
}

/** The exam's time per section: Core and Reading share out their paper, Writing per part. */
export function mockSeconds(step: Step): number | null {
  switch (step.kind) {
    case "grammar":
      return CORE_PART_EXAM.grammar.seconds;
    case "vocabulary":
      return CORE_PART_EXAM.vocabulary.seconds;
    case "reading":
      return READING_PART_EXAM[step.part].seconds;
    case "writing":
      return WRITING_PART_EXAM[step.part].seconds;
    // Listening is paced by the recordings and Speaking times every answer itself.
    case "listening":
    case "speaking":
      return null;
  }
}

/** Exam minutes of each component, for the setup screen. */
export const COMPONENT_MINUTES: Record<Skill, number> = {
  core: EXAM_FORMAT.core.minutes,
  reading: EXAM_FORMAT.reading.minutes,
  listening: EXAM_FORMAT.listening.minutes,
  writing: EXAM_FORMAT.writing.minutes,
  speaking: EXAM_FORMAT.speaking.minutes,
};
