"use client";

import { useLocale, useTranslations } from "next-intl";
import { Explanation } from "@/components/content/Explanation";
import { Icon } from "@/components/icons/Icon";
import type { Reading2Exercise } from "@/lib/content/schemas/reading";
import { SortableList } from "./SortableList";

type Reading2TaskProps = {
  task: Reading2Exercise;
  /** `order[position]` is the index of the sentence shown there. */
  order: readonly number[];
  onMove: (from: number, to: number) => void;
  /** Study mode: the order is locked, each position marked, and the hints shown. */
  revealed: boolean;
};

/** Part 2: put sentences 2–6 in order after the fixed first one. */
export function Reading2Task({
  task,
  order,
  onMove,
  revealed,
}: Reading2TaskProps) {
  const t = useTranslations("Reading.trainer");
  const tTrainer = useTranslations("Trainer");
  const locale = useLocale();
  return (
    <div className="space-y-6">
      {task.title ? (
        <h3 lang="en" className="text-lg font-semibold">
          {task.title}
        </h3>
      ) : null}
      <SortableList
        items={task.sentences.map((sentence, i) => ({
          id: `${task.id}-${i}`,
          content: <span className="prose-reading">{sentence}</span>,
        }))}
        order={order}
        fixed={1}
        onMove={onMove}
        disabled={revealed}
        renderAfter={(position) => {
          if (!revealed || position === 0) return null;
          const right = order[position] === position;
          return (
            <span
              lang="es"
              className={`mt-1 flex items-center gap-1 font-sans text-sm font-semibold ${right ? "text-entry" : "text-refusal"}`}
            >
              <Icon name={right ? "check" : "cross"} className="size-4" />
              {right
                ? tTrainer("correct")
                : t("belongsAt", {
                    position: order.indexOf(position) + 1,
                  })}
            </span>
          );
        }}
      />
      {revealed ? (
        <div role="status" className="space-y-4 rounded-control bg-sheet p-4">
          <h4 className="font-semibold">{t("correctOrder")}</h4>
          <ol lang="en" className="prose-reading list-decimal space-y-1 pl-6">
            {task.sentences.map((sentence, i) => (
              <li key={i}>{sentence}</li>
            ))}
          </ol>
          {task.cohesionHints?.length ? (
            <>
              <h4 className="font-semibold">{t("cohesionTitle")}</h4>
              <ul className="space-y-3 text-sm">
                {task.cohesionHints.map((hint, i) => (
                  <li key={i}>
                    <p>
                      <mark
                        lang="en"
                        className="rounded-sm bg-[color-mix(in_srgb,var(--foil)_35%,transparent)] px-0.5 text-ink underline decoration-foil decoration-2 underline-offset-4"
                      >
                        {hint.phrase}
                      </mark>{" "}
                      {t("hint", {
                        sentence: hint.sentence + 1,
                        target: hint.refersTo + 1,
                      })}
                    </p>
                    <p lang="en" className="mt-1 text-ink-soft">
                      {task.sentences[hint.refersTo]}
                    </p>
                    {hint.note ? (
                      <div className="mt-1">
                        <Explanation text={hint.note} locale={locale} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="text-sm">
            <Explanation text={task.explanation} locale={locale} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
