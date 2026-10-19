/**
 * The sections the placement test and the mock exam run, one per trainer session. They
 * reuse the trainers' own sessions and scoring, so a section behaves like exam mode.
 */
import type { ListeningSessionData } from "@/components/listening/ListeningTrainer";
import type { ReadingSessionData } from "@/components/reading/ReadingTrainer";
import type { SpeakingSessionData } from "@/components/speaking/SpeakingTrainer";
import type { GrammarSessionData } from "@/components/trainer/GrammarTrainer";
import type { VocabularySessionData } from "@/components/trainer/VocabularyTrainer";
import type { WritingSessionData } from "@/components/writing/WritingTrainer";
import { SKILL_OF_PART, type ExamPart, type Skill } from "@/lib/exam/format";
import { bandOf } from "@/lib/estimate/level";
import { listeningItems, type ListeningPart } from "@/lib/trainer/listening";
import { readingItems, type ReadingPart } from "@/lib/trainer/reading";
import type { SpeakingPart } from "@/lib/trainer/speaking";
import type { WritingPart } from "@/lib/trainer/writing";

export type Step =
  | { kind: "grammar"; part: "core-grammar"; session: GrammarSessionData }
  | {
      kind: "vocabulary";
      part: "core-vocabulary";
      session: VocabularySessionData;
    }
  | { kind: "reading"; part: ReadingPart; session: ReadingSessionData }
  | { kind: "listening"; part: ListeningPart; session: ListeningSessionData }
  /** Writing and Speaking end with the learner's self-assessment, not a key. */
  | { kind: "writing"; part: WritingPart; session: WritingSessionData }
  | { kind: "speaking"; part: SpeakingPart; session: SpeakingSessionData };

/** The marked items of a section, to score it with `scoreItems` (none when self-assessed). */
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
    case "writing":
    case "speaking":
      return [];
  }
}

/** A section started at `at`, with its clock (if any) counting from then. */
export function startStep(
  step: Step,
  at: number,
  seconds: number | null,
): Step {
  const deadline = seconds === null ? null : at + seconds * 1000;
  switch (step.kind) {
    case "listening":
      return { ...step, session: { ...step.session, id: at, startedAt: at } };
    case "speaking":
      return { ...step, session: { ...step.session, id: at } };
    default:
      return {
        ...step,
        session: { ...step.session, id: at, startedAt: at, deadline },
      } as Step;
  }
}

export type StepResult = { part: ExamPart; correct: number; total: number };

/** Each skill's share of right answers (or ticked criteria) across its sections. */
export function levelsBySkill(results: readonly StepResult[]) {
  const bySkill = new Map<Skill, { correct: number; total: number }>();
  for (const { part, correct, total } of results) {
    const skill = SKILL_OF_PART[part];
    const sum = bySkill.get(skill) ?? { correct: 0, total: 0 };
    bySkill.set(skill, {
      correct: sum.correct + correct,
      total: sum.total + total,
    });
  }
  return [...bySkill].map(([skill, { correct, total }]) => {
    const ratio = total ? correct / total : 0;
    return { skill, ratio, level: bandOf(ratio) };
  });
}
