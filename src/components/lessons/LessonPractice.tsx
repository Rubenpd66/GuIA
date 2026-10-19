"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Explanation } from "@/components/content/Explanation";
import { GapSentence } from "@/components/content/GapSentence";
import { OptionButton, optionState } from "@/components/trainer/OptionButton";
import type { LocalizedText } from "@/lib/content/schemas/common";

type PracticeItem = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: LocalizedText;
};

/** The lesson's mini practice: answer once, then see whether it was right and why. */
export function LessonPractice({ items }: { items: PracticeItem[] }) {
  const t = useTranslations("Trainer");
  const tLesson = useTranslations("Lesson");
  const locale = useLocale();
  const [chosen, setChosen] = useState<Record<number, number>>({});

  return (
    <ol className="space-y-8">
      {items.map((item, i) => {
        const answer = chosen[i];
        const revealed = answer !== undefined;
        const right = answer === item.answer;
        return (
          <li key={i}>
            <p className="prose-reading text-xl">
              <GapSentence
                text={item.prompt}
                fill={revealed ? item.options[answer] : undefined}
                tone={revealed ? (right ? "entry" : "refusal") : "neutral"}
                gapLabel={tLesson("gap")}
              />
            </p>
            <div className="mt-4 grid gap-2">
              {item.options.map((option, j) => {
                const state = optionState(j, {
                  chosen: answer,
                  answer: item.answer,
                  revealed,
                });
                return (
                  <OptionButton
                    key={option}
                    index={j}
                    label={option}
                    state={state}
                    disabled={revealed}
                    onSelect={() =>
                      setChosen((current) => ({ ...current, [i]: j }))
                    }
                    stateLabel={
                      state === "correct"
                        ? t("correct")
                        : state === "wrong"
                          ? t("incorrect")
                          : undefined
                    }
                  />
                );
              })}
            </div>
            <div role="status" className="mt-3">
              {revealed ? (
                <div className="rounded-control bg-surface p-4">
                  <p
                    className={
                      right
                        ? "font-semibold text-success"
                        : "font-semibold text-danger"
                    }
                  >
                    {right
                      ? t("correct")
                      : t("correctAnswer", {
                          answer: item.options[item.answer] ?? "",
                        })}
                  </p>
                  <div className="mt-1">
                    <Explanation text={item.explanation} locale={locale} />
                  </div>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
