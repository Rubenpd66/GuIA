import type { CSSProperties } from "react";

/** Whole percent for a 0..1 value; anything out of range or not a number is clamped. */
export function progressPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

/** A thin progress bar. The fill grows with `transform`, never `width`. */
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const percent = progressPercent(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 w-full overflow-hidden rounded-full bg-hairline"
    >
      <div
        className="progress-fill h-full w-full rounded-full bg-accent"
        style={{ "--value": percent / 100 } as CSSProperties}
      />
    </div>
  );
}
