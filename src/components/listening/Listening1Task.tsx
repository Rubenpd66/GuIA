"use client";

import { useLocale, useTranslations } from "next-intl";
import { Explanation } from "@/components/content/Explanation";
import { OptionButton, optionState } from "@/components/trainer/OptionButton";
import type { Listening1Exercise } from "@/lib/content/schemas/listening";
import { listeningKey } from "@/lib/trainer/listening";
import type { Answers } from "@/lib/trainer/score";
import { AudioPlayer, type AudioControl } from "./AudioPlayer";
import { Transcript } from "./Transcript";

export type ListeningTaskProps<T> = {
  task: T;
  answers: Answers;
  revealed: Record<string, true>;
  onAnswer: (key: string, choice: number) => void;
  audio: AudioControl;
  /** Show the transcript from the start (no sound available, or the learner is reading). */
  showScript: boolean;
};

/** Part 1: a short recording and one question about a specific detail. */
export function Listening1Task({
  task,
  answers,
  revealed,
  onAnswer,
  audio,
  showScript,
}: ListeningTaskProps<Listening1Exercise>) {
  const t = useTranslations("Listening.trainer");
  const tTrainer = useTranslations("Trainer");
  const locale = useLocale();
  const key = listeningKey(task.id, 0);
  const isRevealed = Boolean(revealed[key]);
  const chosen = answers[key];
  return (
    <div className="space-y-5">
      <p lang="en" className="prose-reading text-ink-soft">
        <span className="font-sans text-sm font-bold">{t("situation")}: </span>
        {task.context}
      </p>
      <AudioPlayer id={task.id} script={task.script} audio={audio} />
      {showScript || isRevealed ? <Transcript script={task.script} /> : null}
      <p lang="en" className="text-lg font-semibold">
        {task.question}
      </p>
      <div role="group" aria-label={task.question} className="space-y-3">
        {task.options.map((option, i) => {
          const state = optionState(i, {
            chosen,
            answer: task.answer,
            revealed: isRevealed,
          });
          return (
            <OptionButton
              key={i}
              index={i}
              label={option}
              state={state}
              disabled={isRevealed}
              onSelect={() => onAnswer(key, i)}
              stateLabel={
                state === "correct"
                  ? tTrainer("correct")
                  : state === "wrong"
                    ? tTrainer("incorrect")
                    : undefined
              }
            />
          );
        })}
      </div>
      {isRevealed ? (
        <div role="status" className="rounded-control bg-surface p-3 text-sm">
          <Explanation text={task.explanation} locale={locale} />
        </div>
      ) : null}
    </div>
  );
}
