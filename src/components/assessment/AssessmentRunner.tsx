"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ListeningSession } from "@/components/listening/ListeningTrainer";
import { ReadingSession } from "@/components/reading/ReadingTrainer";
import { usePartName } from "@/components/sections/usePartName";
import { GrammarSession } from "@/components/trainer/GrammarTrainer";
import { VocabularySession } from "@/components/trainer/VocabularyTrainer";
import { Button } from "@/components/ui/Button";
import { recordSession } from "@/lib/progress/progress";
import { readProgress, saveProgress } from "@/lib/progress/useProgress";
import { scoreItems, type Answers } from "@/lib/trainer/score";
import { startStep, stepItems, type Step, type StepResult } from "./steps";

type AssessmentRunnerProps = {
  steps: Step[];
  /** Time limit of a section in seconds, or null for no clock. */
  secondsOf: (step: Step) => number | null;
  onComplete: (results: StepResult[]) => void;
};

// Only called from event handlers; the purity lint misreads them as render code.
const now = () => Date.now();

/**
 * Runs marked sections one after another, each as the trainer's exam session. Every section
 * is saved as an exam-mode attempt (and its mistakes go to the bank) as soon as it ends.
 */
export function AssessmentRunner({
  steps,
  secondsOf,
  onComplete,
}: AssessmentRunnerProps) {
  const t = useTranslations("Assessment");
  const partName = usePartName();
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState<Step | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = steps[index];

  useEffect(() => {
    if (!running) headingRef.current?.focus();
  }, [running, index]);

  const finish = (current: Step, answers: Answers, finishedAt: number) => {
    const scored = scoreItems(stepItems(current), answers);
    saveProgress(
      recordSession(readProgress(), {
        part: current.part,
        mode: "exam",
        startedAt: current.session.startedAt,
        finishedAt,
        results: scored.results,
      }),
    );
    const next = [
      ...results,
      { part: current.part, correct: scored.correct, total: scored.total },
    ];
    setResults(next);
    setRunning(null);
    if (index + 1 >= steps.length) onComplete(next);
    else setIndex(index + 1);
  };

  if (!step) return null;

  if (running) {
    const done = (answers: Answers, _timeUp: boolean, at: number) =>
      finish(running, answers, at);
    switch (running.kind) {
      case "grammar":
        return (
          <GrammarSession
            key={running.session.id}
            session={running.session}
            onFinish={done}
          />
        );
      case "vocabulary":
        return (
          <VocabularySession
            key={running.session.id}
            session={running.session}
            onFinish={done}
          />
        );
      case "reading":
        return (
          <ReadingSession
            key={running.session.id}
            part={running.part}
            session={running.session}
            onFinish={done}
          />
        );
      case "listening":
        return (
          <ListeningSession
            key={running.session.id}
            part={running.part}
            session={running.session}
            onFinish={(answers, at) => finish(running, answers, at)}
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
        className="text-xl font-bold font-semi-expanded focus:outline-none"
      >
        {partName(step.part)}
      </h2>
      <p>
        {seconds === null
          ? t("untimed")
          : t("timed", { minutes: Math.round(seconds / 60) })}
      </p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => setRunning(startStep(step, now(), seconds))}
      >
        {t("startSection")}
      </Button>
    </section>
  );
}
