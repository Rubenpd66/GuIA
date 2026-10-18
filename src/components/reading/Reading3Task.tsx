"use client";

import { useTranslations } from "next-intl";
import type { Reading3Exercise } from "@/lib/content/schemas/reading";
import { readingKey } from "@/lib/trainer/reading";
import type { Answers } from "@/lib/trainer/score";
import { AnswerSelect, Feedback } from "./AnswerSelect";
import {
  HighlightableText,
  HighlighterControls,
  useHighlights,
} from "./HighlightableText";

type Reading3TaskProps = {
  task: Reading3Exercise;
  answers: Answers;
  revealed: Record<string, true>;
  onAnswer: (key: string, choice: number) => void;
};

const LETTERS = ["A", "B", "C", "D"];

/** Part 3: four people's opinions and seven statements to match to them. */
export function Reading3Task({
  task,
  answers,
  revealed,
  onAnswer,
}: Reading3TaskProps) {
  const t = useTranslations("Reading.trainer");
  const highlights = useHighlights();
  const people = task.people.map(
    (person, i) => `${LETTERS[i]}. ${person.name}`,
  );
  return (
    <div className="space-y-6">
      <p lang="en" className="text-lg font-semibold">
        {task.question}
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <HighlighterControls
            active={highlights.active}
            onActiveChange={highlights.setActive}
            count={highlights.count}
            onClear={highlights.clear}
          />
          {task.people.map((person, i) => (
            <details
              key={i}
              open
              className="rounded-control border-[1.5px] border-hairline bg-paper p-3"
            >
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
                {people[i]}
              </summary>
              <div className="mt-2">
                <HighlightableText
                  paragraphs={[person.text]}
                  highlighted={highlights.of(String(i))}
                  onToggle={highlights.toggle(String(i))}
                  active={highlights.active}
                />
              </div>
            </details>
          ))}
        </div>
        <ol className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          {task.statements.map((statement, i) => {
            const key = readingKey(task.id, i);
            const chosen = answers[key];
            const isRevealed = Boolean(revealed[key]);
            const right = chosen === statement.answer;
            return (
              <li key={key} className="space-y-2">
                <label
                  htmlFor={`r3-${key}`}
                  lang="en"
                  className="prose-reading block"
                >
                  <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
                    {i + 1}.
                  </span>
                  {statement.text}
                </label>
                <AnswerSelect
                  id={`r3-${key}`}
                  value={chosen}
                  options={people}
                  placeholder={t("choosePerson")}
                  revealed={isRevealed}
                  right={right}
                  onChange={(choice) => onAnswer(key, choice)}
                />
                {isRevealed ? (
                  <Feedback
                    right={right}
                    answer={people[statement.answer] ?? ""}
                    explanation={statement.explanation}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
