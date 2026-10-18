import { cx } from "@/lib/cx";

/** CEFR level as a small passport-style tag; C1 gets the gold border of the C stamp. */
export function LevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-7 min-w-10 items-center justify-center rounded-control border-[1.5px] px-2 text-sm font-bold font-semi-expanded",
        level === "C1"
          ? "border-foil-ink text-foil-ink"
          : "border-line text-ink-soft",
        className,
      )}
    >
      {level}
    </span>
  );
}
