"use client";

import { useTranslations } from "next-intl";
import { AnswerSelect, Feedback } from "@/components/reading/AnswerSelect";
import type { Listening2Exercise } from "@/lib/content/schemas/listening";
import { listeningKey } from "@/lib/trainer/listening";
import { AudioPlayer } from "./AudioPlayer";
import type { ListeningTaskProps } from "./Listening1Task";
import { Transcript } from "./Transcript";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Part 2: four speakers to match with six statements; two statements are not needed. */
export function Listening2Task({
  task,
  answers,
  revealed,
  onAnswer,
  audio,
  showScript,
}: ListeningTaskProps<Listening2Exercise>) {
  const t = useTranslations("Listening.trainer");
  const options = task.options.map((option, i) => `${LETTERS[i]}. ${option}`);
  return (
    <div className="space-y-6">
      <p lang="en" className="text-lg font-semibold">
        {task.question}
      </p>
      <ul lang="en" className="space-y-1">
        {options.map((option, i) => (
          <li key={i} className="prose-reading">
            {option}
          </li>
        ))}
      </ul>
      <ol className="space-y-6">
        {task.speakers.map((speaker, i) => {
          const key = listeningKey(task.id, i);
          const chosen = answers[key];
          const isRevealed = Boolean(revealed[key]);
          const right = chosen === speaker.answer;
          const label = t("speakerN", { number: i + 1 });
          return (
            <li key={key} className="space-y-2">
              <AudioPlayer
                id={`${task.id}@${i}`}
                script={speaker.script}
                audio={audio}
                label={label}
              />
              {showScript || isRevealed ? (
                <Transcript script={speaker.script} />
              ) : null}
              <label htmlFor={`l2-${key}`} className="block font-semibold">
                {label}
              </label>
              <AnswerSelect
                id={`l2-${key}`}
                value={chosen}
                options={options}
                placeholder={t("chooseOption")}
                revealed={isRevealed}
                right={right}
                className="max-w-md"
                onChange={(choice) => onAnswer(key, choice)}
              />
              {isRevealed ? (
                <Feedback
                  right={right}
                  answer={options[speaker.answer] ?? ""}
                  explanation={task.explanation}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
