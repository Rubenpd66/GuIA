"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Ref } from "react";
import { Explanation } from "@/components/content/Explanation";
import { Icon } from "@/components/icons/Icon";
import type { LocalizedText } from "@/lib/content/schemas/common";
import { cx } from "@/lib/cx";

type AnswerSelectProps = {
  id: string;
  value: number | undefined;
  options: readonly string[];
  placeholder: string;
  /** Study mode: the answer is locked and marked right or wrong. */
  revealed: boolean;
  right: boolean;
  onChange: (choice: number) => void;
  selectRef?: Ref<HTMLSelectElement>;
  className?: string;
};

/** A native select for one marked item, with its right/wrong mark once checked. */
export function AnswerSelect({
  id,
  value,
  options,
  placeholder,
  revealed,
  right,
  onChange,
  selectRef,
  className,
}: AnswerSelectProps) {
  return (
    <div className="flex items-center gap-3">
      <select
        ref={selectRef}
        id={id}
        lang="en"
        value={value ?? ""}
        disabled={revealed}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cx(
          "min-h-12 w-full min-w-0 rounded-control border-[1.5px] bg-canvas px-3 disabled:opacity-100",
          className ?? "max-w-xs",
          !revealed && "border-line",
          revealed && right && "border-success",
          revealed && !right && "border-danger",
        )}
      >
        <option value="" disabled lang="es">
          {placeholder}
        </option>
        {options.map((option, i) => (
          <option key={i} value={i}>
            {option}
          </option>
        ))}
      </select>
      {revealed ? (
        <Icon
          name={right ? "check" : "cross"}
          className={cx("shrink-0", right ? "text-success" : "text-danger")}
        />
      ) : null}
    </div>
  );
}

/** Study-mode feedback under a checked item. */
export function Feedback({
  right,
  answer,
  explanation,
}: {
  right: boolean;
  answer: string;
  explanation: LocalizedText;
}) {
  const t = useTranslations("Trainer");
  const locale = useLocale();
  return (
    <div role="status" className="rounded-control bg-surface p-3 text-sm">
      <p className={cx("font-semibold", right ? "text-success" : "text-danger")}>
        {right ? t("correct") : t("correctAnswer", { answer })}
      </p>
      <div className="mt-1">
        <Explanation text={explanation} locale={locale} />
      </div>
    </div>
  );
}
