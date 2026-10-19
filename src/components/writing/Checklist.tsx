"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  RUBRIC_CRITERIA,
  type RubricCriterion,
  type WritingPart,
} from "@/lib/trainer/writing";

/** The app's own self-assessment: one tick per criterion met, saved as ticks out of four. */
export function Checklist({
  part,
  onSave,
}: {
  part: WritingPart;
  onSave: (correct: number, total: number) => void;
}) {
  const t = useTranslations("Writing");
  const [met, setMet] = useState<Partial<Record<RubricCriterion, boolean>>>({});
  return (
    <fieldset className="space-y-4 rounded-page border-[1.5px] border-line p-4">
      <legend className="px-1 text-lg font-bold font-semi-expanded">
        {t("trainer.checklistTitle")}
      </legend>
      <p className="text-sm text-ink-soft">{t("trainer.checklistNote")}</p>
      <ul className="space-y-1">
        {RUBRIC_CRITERIA.map((criterion) => (
          <li key={criterion}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={Boolean(met[criterion])}
                onChange={(event) =>
                  setMet((current) => ({
                    ...current,
                    [criterion]: event.target.checked,
                  }))
                }
                className="mt-1 size-5 shrink-0"
              />
              <span>
                <span className="font-semibold">
                  {t(`rubric.${criterion}`)}
                </span>
                <span className="block text-sm text-ink-soft">
                  {t(`rubricHints.${part}.${criterion}`)}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        onClick={() =>
          onSave(
            RUBRIC_CRITERIA.filter((criterion) => met[criterion]).length,
            RUBRIC_CRITERIA.length,
          )
        }
      >
        {t("trainer.saveAssessment")}
      </Button>
    </fieldset>
  );
}
