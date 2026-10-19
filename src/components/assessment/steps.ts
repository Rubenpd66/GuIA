/**
 * The marked sections the placement test and the mock exam run, one per trainer session.
 * They reuse the trainers' own sessions and scoring, so a section behaves like exam mode.
 */
import type { ListeningSessionData } from "@/components/listening/ListeningTrainer";
import type { ReadingSessionData } from "@/components/reading/ReadingTrainer";
import type { GrammarSessionData } from "@/components/trainer/GrammarTrainer";
import type { VocabularySessionData } from "@/components/trainer/VocabularyTrainer";
import type { ExamPart } from "@/lib/exam/format";
import { listeningItems, type ListeningPart } from "@/lib/trainer/listening";
import { readingItems, type ReadingPart } from "@/lib/trainer/reading";

export type Step =
  | { kind: "grammar"; part: "core-grammar"; session: GrammarSessionData }
  | {
      kind: "vocabulary";
      part: "core-vocabulary";
      session: VocabularySessionData;
    }
  | { kind: "reading"; part: ReadingPart; session: ReadingSessionData }
  | { kind: "listening"; part: ListeningPart; session: ListeningSessionData };

/** The marked items of a section, to score it with `scoreItems`. */
export function stepItems(step: Step): { key: string; answer: number }[] {
  switch (step.kind) {
    case "grammar":
      return step.session.questions;
    case "vocabulary":
      return step.session.tasks.flatMap((task) => task.items);
    case "reading":
      return step.session.tasks.flatMap(readingItems);
    case "listening":
      return step.session.tasks.flatMap(listeningItems);
  }
}

/** A section restarted at `at`, with its clock (if any) counting from then. */
export function startStep(
  step: Step,
  at: number,
  seconds: number | null,
): Step {
  const deadline = seconds === null ? null : at + seconds * 1000;
  switch (step.kind) {
    case "listening":
      return { ...step, session: { ...step.session, id: at, startedAt: at } };
    default:
      return {
        ...step,
        session: { ...step.session, id: at, startedAt: at, deadline },
      } as Step;
  }
}

export type StepResult = { part: ExamPart; correct: number; total: number };
