"use client";

import { useTranslations } from "next-intl";
import type { Reading4Exercise } from "@/lib/content/schemas/reading";
import { readingKey } from "@/lib/trainer/reading";
import type { Answers } from "@/lib/trainer/score";
import { AnswerSelect, Feedback } from "./AnswerSelect";
import {
  HighlightableText,
  HighlighterControls,
  useHighlights,
} from "./HighlightableText";

type Reading4TaskProps = {
  task: Reading4Exercise;
  answers: Answers;
  revealed: Record<string, true>;
  onAnswer: (key: string, choice: number) => void;
};

/** Part 4: a long text with a heading to choose above each paragraph; one heading is spare. */
export function Reading4Task({
  task,
  answers,
  revealed,
  onAnswer,
}: Reading4TaskProps) {
  const t = useTranslations("Reading.trainer");
  const highlights = useHighlights();
  const keys = task.paragraphs.map((_, i) => readingKey(task.id, i));
  return (
    <div className="space-y-6">
      <h3 lang="en" className="text-xl font-bold font-semi-expanded">
        {task.title}
      </h3>
      <div className="rounded-control border-[1.5px] border-hairline p-4">
        <h4 className="font-semibold">{t("headingsTitle")}</h4>
        <ul lang="en" className="mt-2 list-disc space-y-1 pl-6">
          {task.headings.map((heading) => (
            <li key={heading}>{heading}</li>
          ))}
        </ul>
      </div>
      <HighlighterControls
        active={highlights.active}
        onActiveChange={highlights.setActive}
        count={highlights.count}
        onClear={highlights.clear}
      />
      <ol className="space-y-8">
        {task.paragraphs.map((paragraph, i) => {
          const key = keys[i]!;
          const chosen = answers[key];
          const isRevealed = Boolean(revealed[key]);
          const right = chosen === task.answers[i];
          // A heading picked for another paragraph stays available, only labelled.
          const options = task.headings.map((heading, h) =>
            keys.some((other) => other !== key && answers[other] === h)
              ? `${heading} ${t("alreadyChosen")}`
              : heading,
          );
          return (
            <li key={key} className="space-y-3">
              <label htmlFor={`r4-${key}`} className="block font-semibold">
                {t("paragraph", { number: i + 1 })}
              </label>
              <AnswerSelect
                id={`r4-${key}`}
                value={chosen}
                options={options}
                placeholder={t("chooseHeading")}
                revealed={isRevealed}
                right={right}
                onChange={(choice) => onAnswer(key, choice)}
                className="max-w-full"
              />
              <HighlightableText
                paragraphs={[paragraph]}
                highlighted={highlights.of(String(i))}
                onToggle={highlights.toggle(String(i))}
                active={highlights.active}
              />
              {isRevealed ? (
                <Feedback
                  right={right}
                  answer={task.headings[task.answers[i]!] ?? ""}
                  explanation={task.explanations[i]!}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
