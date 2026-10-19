"use client";

import { useTranslations } from "next-intl";
import { Feedback } from "@/components/reading/AnswerSelect";
import { OptionButton, optionState } from "@/components/trainer/OptionButton";
import type { Listening4Exercise } from "@/lib/content/schemas/listening";
import { listeningKey } from "@/lib/trainer/listening";
import { AudioPlayer } from "./AudioPlayer";
import type { ListeningTaskProps } from "./Listening1Task";
import { Transcript } from "./Transcript";

/** Part 4: one monologue and two questions about attitude, intention or opinion. */
export function Listening4Task({
  task,
  answers,
  revealed,
  onAnswer,
  audio,
  showScript,
}: ListeningTaskProps<Listening4Exercise>) {
  const t = useTranslations("Listening.trainer");
  const tTrainer = useTranslations("Trainer");
  const allRevealed = task.questions.every((_, i) =>
    Boolean(revealed[listeningKey(task.id, i)]),
  );
  return (
    <div className="space-y-6">
      <AudioPlayer id={task.id} script={task.script} audio={audio} />
      {allRevealed ? (
        <Transcript
          script={task.script}
          cues={task.questions.flatMap((q) => q.cues)}
          open
        />
      ) : showScript ? (
        <Transcript script={task.script} />
      ) : null}
      <ol className="space-y-8">
        {task.questions.map((question, i) => {
          const key = listeningKey(task.id, i);
          const chosen = answers[key];
          const isRevealed = Boolean(revealed[key]);
          return (
            <li key={key} className="space-y-3">
              <p lang="en" className="text-lg font-semibold">
                <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                  {i + 1}.
                </span>
                {question.prompt}
              </p>
              <div
                role="group"
                aria-label={question.prompt}
                className="space-y-3"
              >
                {question.options.map((option, o) => {
                  const state = optionState(o, {
                    chosen,
                    answer: question.answer,
                    revealed: isRevealed,
                  });
                  return (
                    <OptionButton
                      key={o}
                      index={o}
                      label={option}
                      state={state}
                      disabled={isRevealed}
                      onSelect={() => onAnswer(key, o)}
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
                <>
                  <Feedback
                    right={chosen === question.answer}
                    answer={question.options[question.answer] ?? ""}
                    explanation={question.explanation}
                  />
                  <p lang="en" className="text-sm text-ink-soft">
                    {t("clues", { clues: question.cues.join(" · ") })}
                  </p>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
