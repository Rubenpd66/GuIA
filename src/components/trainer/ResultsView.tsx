"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

type ResultsViewProps = {
  correct: number;
  total: number;
  timeUp: boolean;
  wrongCount: number;
  /** What the score means; defaults to the Core note. */
  note?: string;
  /** The list of mistakes, already rendered by the trainer. */
  children: ReactNode;
  onNewSession: () => void;
  onReviewThese: () => void;
  onChangeSettings: () => void;
};

export function ResultsView(props: ResultsViewProps) {
  const t = useTranslations("Trainer");
  return (
    <section
      aria-labelledby="trainer-results"
      className="max-w-[68ch] space-y-8"
    >
      <Card className="enter">
        <h2 id="trainer-results" className="text-xl font-bold">
          {t("resultsTitle")}
        </h2>
        {props.timeUp ? (
          <p className="mt-1 text-danger">{t("timeUp")}</p>
        ) : null}
        <p className="mt-3 text-4xl font-extrabold">
          {t("score", { correct: props.correct, total: props.total })}
        </p>
        <div className="mt-4">
          <ProgressBar
            value={props.total > 0 ? props.correct / props.total : 0}
            label={t("score", { correct: props.correct, total: props.total })}
          />
        </div>
        <p className="mt-4 text-sm text-ink-soft">{t("estimate")}</p>
        <p className="mt-3 text-ink-soft">{props.note ?? t("coreNote")}</p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button variant="primary" onClick={props.onNewSession}>
          {t("newSession")}
        </Button>
        {props.wrongCount > 0 ? (
          <Button onClick={props.onReviewThese}>{t("reviewThese")}</Button>
        ) : null}
        <Button variant="ghost" onClick={props.onChangeSettings}>
          {t("changeSettings")}
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-bold">{t("mistakesTitle")}</h3>
        {props.wrongCount === 0 ? (
          <p className="mt-2 text-ink-soft">{t("noMistakes")}</p>
        ) : (
          props.children
        )}
      </div>
    </section>
  );
}
