"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ChecklistProps = {
  title: string;
  note: string;
  saveLabel: string;
  criteria: readonly { key: string; label: string; hint: string }[];
  onSave: (correct: number, total: number) => void;
};

/** The app's own self-assessment: one tick per criterion met, saved as ticks out of the total. */
export function Checklist({
  title,
  note,
  saveLabel,
  criteria,
  onSave,
}: ChecklistProps) {
  const [met, setMet] = useState<Record<string, boolean>>({});
  return (
    <fieldset className="space-y-4 rounded-card border-[1.5px] border-line p-4">
      <legend className="px-1 text-lg font-bold">{title}</legend>
      <p className="text-sm text-ink-soft">{note}</p>
      <ul className="space-y-1">
        {criteria.map((criterion) => (
          <li key={criterion.key}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={Boolean(met[criterion.key])}
                onChange={(event) =>
                  setMet((current) => ({
                    ...current,
                    [criterion.key]: event.target.checked,
                  }))
                }
                className="mt-1 size-5 shrink-0"
              />
              <span>
                <span className="font-semibold">{criterion.label}</span>
                <span className="block text-sm text-ink-soft">
                  {criterion.hint}
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
            criteria.filter((criterion) => met[criterion.key]).length,
            criteria.length,
          )
        }
      >
        {saveLabel}
      </Button>
    </fieldset>
  );
}
