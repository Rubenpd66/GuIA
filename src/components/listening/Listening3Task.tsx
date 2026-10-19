"use client";

import { useTranslations } from "next-intl";
import { AnswerSelect, Feedback } from "@/components/reading/AnswerSelect";
import type { Listening3Exercise } from "@/lib/content/schemas/listening";
import { listeningKey, SPEAKER_CHOICES } from "@/lib/trainer/listening";
import { AudioPlayer } from "./AudioPlayer";
import type { ListeningTaskProps } from "./Listening1Task";
import { Transcript } from "./Transcript";

/** Part 3: one conversation and four statements: the man, the woman or both. */
export function Listening3Task({
  task,
  answers,
  revealed,
  onAnswer,
  audio,
  showScript,
}: ListeningTaskProps<Listening3Exercise>) {
  const t = useTranslations("Listening.trainer");
  const choices = SPEAKER_CHOICES.map((choice) => t(`choices.${choice}`));
  const allRevealed = task.statements.every((_, i) =>
    Boolean(revealed[listeningKey(task.id, i)]),
  );
  return (
    <div className="space-y-6">
      <p lang="en" className="text-lg font-semibold">
        {task.question}
      </p>
      <AudioPlayer id={task.id} script={task.script} audio={audio} />
      {showScript || allRevealed ? <Transcript script={task.script} /> : null}
      <ol className="space-y-5">
        {task.statements.map((statement, i) => {
          const key = listeningKey(task.id, i);
          const chosen = answers[key];
          const isRevealed = Boolean(revealed[key]);
          const answer = SPEAKER_CHOICES.indexOf(statement.answer);
          const right = chosen === answer;
          return (
            <li key={key} className="space-y-2">
              <label
                htmlFor={`l3-${key}`}
                lang="en"
                className="prose-reading block text-lg"
              >
                <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                  {i + 1}.
                </span>
                {statement.text}
              </label>
              <AnswerSelect
                id={`l3-${key}`}
                value={chosen}
                options={choices}
                placeholder={t("chooseWho")}
                revealed={isRevealed}
                right={right}
                onChange={(choice) => onAnswer(key, choice)}
              />
              {isRevealed ? (
                <Feedback
                  right={right}
                  answer={choices[answer] ?? ""}
                  explanation={statement.explanation}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
