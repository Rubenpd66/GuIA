"use client";

import { useTranslations } from "next-intl";
import { GapSentence } from "@/components/content/GapSentence";
import type { Reading1Exercise } from "@/lib/content/schemas/reading";
import { readingKey } from "@/lib/trainer/reading";
import type { Answers } from "@/lib/trainer/score";
import { AnswerSelect, Feedback } from "./AnswerSelect";

type Reading1TaskProps = {
  task: Reading1Exercise;
  answers: Answers;
  revealed: Record<string, true>;
  onAnswer: (key: string, choice: number) => void;
};

/** Part 1: a short text with five sentence gaps, three options each. */
export function Reading1Task({
  task,
  answers,
  revealed,
  onAnswer,
}: Reading1TaskProps) {
  const t = useTranslations("Reading.trainer");
  const tLesson = useTranslations("Lesson");
  return (
    <div className="space-y-6">
      {task.context ? (
        <p lang="en" className="prose-reading text-ink-soft">
          {task.context}
        </p>
      ) : null}
      <ol className="space-y-5">
        {task.items.map((item, i) => {
          const key = readingKey(task.id, i);
          const chosen = answers[key];
          const isRevealed = Boolean(revealed[key]);
          const right = chosen === item.answer;
          return (
            <li key={key} className="space-y-2">
              <label
                htmlFor={`r1-${key}`}
                lang="en"
                className="prose-reading block text-lg"
              >
                <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                  {i + 1}.
                </span>
                <GapSentence text={item.prompt} gapLabel={tLesson("gap")} />
              </label>
              <AnswerSelect
                id={`r1-${key}`}
                value={chosen}
                options={item.options}
                placeholder={t("chooseOption")}
                revealed={isRevealed}
                right={right}
                onChange={(choice) => onAnswer(key, choice)}
              />
              {isRevealed ? (
                <Feedback
                  right={right}
                  answer={item.options[item.answer] ?? ""}
                  explanation={item.explanation}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
