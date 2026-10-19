"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { WordRange } from "@/lib/exam/format";
import { cx } from "@/lib/cx";
import { wordStatus } from "@/lib/trainer/writing";

type WritingEditorProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (text: string) => void;
  range: WordRange;
  readOnly: boolean;
  rows?: number;
};

const STATUS_CLASS = {
  below: "text-ink-soft",
  within: "text-entry",
  above: "text-refusal",
} as const;

/** A labelled textarea with a word counter; only the range status is announced, not each word. */
export function WritingEditor({
  id,
  label,
  value,
  onChange,
  range,
  readOnly,
  rows = 6,
}: WritingEditorProps) {
  const t = useTranslations("Writing.trainer");
  const { count, status } = wordStatus(value, range);
  const [min, max] = range;
  return (
    <div className="space-y-2">
      <label htmlFor={id} lang="en" className="prose-reading block">
        {label}
      </label>
      <textarea
        id={id}
        lang="en"
        rows={rows}
        value={value}
        readOnly={readOnly}
        // The exam has no spellchecker.
        spellCheck={false}
        aria-describedby={`${id}-count`}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "prose-reading block w-full rounded-control border-[1.5px] border-line bg-paper p-3 text-lg",
          readOnly && "bg-sheet text-ink-soft",
        )}
      />
      <p
        id={`${id}-count`}
        className="flex flex-wrap gap-x-3 text-sm tabular-nums"
      >
        <span>{t("words", { count, min, max })}</span>
        <span
          aria-live="polite"
          className={cx("font-semibold", STATUS_CLASS[status])}
        >
          {t(`status.${status}`)}
        </span>
      </p>
    </div>
  );
}
