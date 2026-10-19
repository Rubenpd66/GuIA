"use client";

import { Icon } from "@/components/icons/Icon";
import { cx } from "@/lib/cx";

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

type OptionButtonProps = {
  index: number;
  label: string;
  state: OptionState;
  onSelect: () => void;
  disabled?: boolean;
  /** Spoken after the option when it is marked right or wrong. */
  stateLabel?: string;
};

/** A full-width answer option (at least 56 px), numbered for the 1-2-3 shortcut. */
export function OptionButton({
  index,
  label,
  state,
  onSelect,
  disabled,
  stateLabel,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cx(
        "flex min-h-14 w-full items-center gap-4 rounded-control border-[1.5px] px-4 py-3 text-left text-lg transition-colors duration-150 disabled:cursor-default",
        state === "idle" &&
          "border-line hover:bg-[color-mix(in_srgb,var(--canvas)_90%,var(--ink))]",
        state === "selected" &&
          "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
        state === "correct" &&
          "border-success bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
        state === "wrong" &&
          "border-danger bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
        state === "dimmed" && "border-hairline text-ink-soft",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-sm font-bold"
      >
        {index + 1}
      </span>
      <span className="flex-1">{label}</span>
      {state === "correct" ? (
        <Icon name="check" className="text-success" />
      ) : null}
      {state === "wrong" ? (
        <Icon name="cross" className="text-danger" />
      ) : null}
      {stateLabel ? <span className="sr-only">{stateLabel}</span> : null}
    </button>
  );
}

/** Visual state of an option once the answer is shown (or not). */
export function optionState(
  index: number,
  {
    chosen,
    answer,
    revealed,
  }: { chosen: number | undefined; answer: number; revealed: boolean },
): OptionState {
  if (!revealed) return chosen === index ? "selected" : "idle";
  if (index === answer) return "correct";
  if (index === chosen) return "wrong";
  return "dimmed";
}
