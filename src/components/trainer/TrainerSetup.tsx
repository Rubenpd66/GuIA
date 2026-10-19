"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { CefrLevel } from "@/lib/content/schemas/common";
import { cx } from "@/lib/cx";
import type { TrainerMode } from "@/lib/trainer/reducer";

type TrainerSetupProps = {
  mode: TrainerMode;
  onModeChange: (mode: TrainerMode) => void;
  level: CefrLevel | "all";
  onLevelChange: (level: CefrLevel | "all") => void;
  levels: readonly CefrLevel[];
  examCount: number;
  examMinutes: number;
  /** Overrides the exam card hint and the bank size line (Reading counts tasks, not questions). */
  examHint?: string;
  bankText?: string;
  /** Overrides the study card hint (Writing has no right or wrong answers). */
  studyHint?: string;
  poolSize: number;
  focusName?: string;
  onClearFocus?: () => void;
  mistakes: number;
  onStart: () => void;
  onReviewMistakes: () => void;
};

const CARD =
  "flex cursor-pointer flex-col gap-1 rounded-card border-[1.5px] p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

export function TrainerSetup(props: TrainerSetupProps) {
  const t = useTranslations("Trainer");
  const modes = [
    {
      value: "study" as const,
      title: t("study"),
      hint: props.studyHint ?? t("studyHint"),
    },
    {
      value: "exam" as const,
      title: t("exam"),
      hint:
        props.examHint ??
        t("examHint", {
          count: props.examCount,
          minutes: props.examMinutes,
        }),
    },
  ];

  return (
    <section aria-labelledby="trainer-setup" className="max-w-[68ch] space-y-6">
      <h2 id="trainer-setup" className="text-xl font-bold">
        {t("setupTitle")}
      </h2>

      {props.focusName ? (
        <p className="flex flex-wrap items-center gap-3 rounded-control bg-surface px-4 py-3">
          <span className="font-semibold">
            {t("focus", { name: props.focusName })}
          </span>
          <button
            type="button"
            onClick={props.onClearFocus}
            className="text-sm underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t("clearFocus")}
          </button>
        </p>
      ) : null}

      <fieldset>
        <legend className="sr-only">{t("setupTitle")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {modes.map((mode) => (
            <label
              key={mode.value}
              className={cx(
                CARD,
                props.mode === mode.value
                  ? "border-accent bg-surface"
                  : "border-line",
              )}
            >
              <input
                type="radio"
                name="trainer-mode"
                value={mode.value}
                checked={props.mode === mode.value}
                onChange={() => props.onModeChange(mode.value)}
                className="sr-only"
              />
              <span className="font-semibold">{mode.title}</span>
              <span className="text-sm text-ink-soft">{mode.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {props.focusName ? null : (
        <div>
          <label htmlFor="trainer-level" className="block font-semibold">
            {t("level")}
          </label>
          <select
            id="trainer-level"
            value={props.level}
            onChange={(event) =>
              props.onLevelChange(event.target.value as CefrLevel | "all")
            }
            className="mt-2 min-h-12 w-full max-w-xs rounded-control border-[1.5px] border-line bg-canvas px-3"
          >
            <option value="all">{t("allLevels")}</option>
            {props.levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      )}

      {props.poolSize === 0 ? (
        <p role="status" className="text-danger">
          {t("empty")}
        </p>
      ) : (
        <p className="text-sm text-ink-soft">
          {props.bankText ?? t("bankSize", { count: props.poolSize })}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          size="lg"
          onClick={props.onStart}
          disabled={props.poolSize === 0}
        >
          {t("start")}
        </Button>
        {props.mistakes > 0 ? (
          <Button size="lg" onClick={props.onReviewMistakes}>
            {t("reviewMistakes", { count: props.mistakes })}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
