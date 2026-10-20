"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ListeningSession } from "@/components/listening/ListeningTrainer";
import { ReadingSession } from "@/components/reading/ReadingTrainer";
import { usePartName } from "@/components/sections/usePartName";
import { SpeakingSession } from "@/components/speaking/SpeakingTrainer";
import { GrammarSession } from "@/components/trainer/GrammarTrainer";
import { VocabularySession } from "@/components/trainer/VocabularyTrainer";
import { Button } from "@/components/ui/Button";
import { WritingSession } from "@/components/writing/WritingTrainer";
import { holdLevelUps } from "@/lib/estimate/levelUps";
import { recordSession } from "@/lib/progress/progress";
import { readProgress, saveProgress } from "@/lib/progress/useProgress";
import { scoreItems, type Answers } from "@/lib/trainer/score";
import { startStep, stepItems, type Step, type StepResult } from "./steps";

export type RunnerProgress = {
  index: number;
  results: StepResult[];
  /** When the section in progress started, or null between sections. */
  runningSince: number | null;
};

type AssessmentRunnerProps = {
  steps: Step[];
  /** Time limit of a section in seconds, or null for no clock. */
  secondsOf: (step: Step) => number | null;
  /**
   * Where to pick up after a reload; a section in progress keeps its original clock.
   * shortcut: its answers and Listening play counts start again; save them per section if that matters.
   */
  resume?: RunnerProgress;
  /** Called on every change, so the caller can save it. */
  onProgress?: (progress: RunnerProgress) => void;
  onComplete: (results: StepResult[]) => void;
};

// Only called from event handlers and effects; the purity lint misreads them as render code.
const now = () => Date.now();

const startedAtOf = (step: Step) =>
  step.kind === "speaking" ? step.session.id : step.session.startedAt;

/**
 * Runs sections one after another, each as the trainer's exam session. A marked section is
 * saved as an exam-mode attempt (its mistakes go to the bank) as soon as it ends; Writing and
 * Speaking save their own attempt with the self-assessment.
 */
export function AssessmentRunner({
  steps,
  secondsOf,
  resume,
  onProgress,
  onComplete,
}: AssessmentRunnerProps) {
  const t = useTranslations("Assessment");
  const partName = usePartName();
  const [index, setIndex] = useState(resume?.index ?? 0);
  const [results, setResults] = useState<StepResult[]>(resume?.results ?? []);
  const [running, setRunning] = useState<Step | null>(() => {
    const step = resume ? steps[resume.index] : undefined;
    return step && resume?.runningSince != null
      ? startStep(step, resume.runningSince, secondsOf(step))
      : null;
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = steps[index];

  useEffect(() => {
    if (!running) headingRef.current?.focus();
  }, [running, index]);

  // The test or mock exam shows its own levels at the end.
  useEffect(() => holdLevelUps(), []);

  const advance = (result: StepResult) => {
    const next = [...results, result];
    setResults(next);
    setRunning(null);
    onProgress?.({ index: index + 1, results: next, runningSince: null });
    if (index + 1 >= steps.length) onComplete(next);
    else setIndex(index + 1);
  };

  const finishMarked = (
    current: Step,
    answers: Answers,
    finishedAt: number,
  ) => {
    const scored = scoreItems(stepItems(current), answers);
    saveProgress(
      recordSession(readProgress(), {
        part: current.part,
        mode: "exam",
        startedAt: startedAtOf(current),
        finishedAt,
        results: scored.results,
      }),
    );
    advance({
      part: current.part,
      correct: scored.correct,
      total: scored.total,
    });
  };

  const begin = (current: Step) => {
    const at = now();
    setRunning(startStep(current, at, secondsOf(current)));
    onProgress?.({ index, results, runningSince: at });
  };

  if (!step) return null;

  if (running) {
    const done = (answers: Answers, _timeUp: boolean, at: number) =>
      finishMarked(running, answers, at);
    const selfAssessed = (result: { correct: number; total: number }) =>
      advance({ part: running.part, ...result });
    const key = running.session.id;
    switch (running.kind) {
      case "grammar":
        return (
          <GrammarSession key={key} session={running.session} onFinish={done} />
        );
      case "vocabulary":
        return (
          <VocabularySession
            key={key}
            session={running.session}
            onFinish={done}
          />
        );
      case "reading":
        return (
          <ReadingSession
            key={key}
            part={running.part}
            session={running.session}
            onFinish={done}
          />
        );
      case "listening":
        return (
          <ListeningSession
            key={key}
            part={running.part}
            session={running.session}
            onFinish={(answers, at) => finishMarked(running, answers, at)}
          />
        );
      case "writing":
        return (
          <WritingSession
            key={key}
            part={running.part}
            session={running.session}
            phrases={[]}
            onSaved={selfAssessed}
          />
        );
      case "speaking":
        return (
          <SpeakingSession
            key={key}
            part={running.part}
            session={running.session}
            phrases={[]}
            onSaved={selfAssessed}
          />
        );
    }
  }

  const seconds = secondsOf(step);
  return (
    <section
      aria-labelledby="assessment-step"
      className="max-w-[68ch] space-y-4"
    >
      <p className="font-semibold text-ink-soft">
        {t("section", { current: index + 1, total: steps.length })}
      </p>
      <h2
        id="assessment-step"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold focus:outline-none"
      >
        {partName(step.part)}
      </h2>
      <p>
        {seconds === null
          ? t(step.kind === "speaking" ? "speakingTimed" : "untimed")
          : t("timed", { minutes: Math.round(seconds / 60) })}
      </p>
      <Button variant="primary" size="lg" onClick={() => begin(step)}>
        {t("startSection")}
      </Button>
    </section>
  );
}
