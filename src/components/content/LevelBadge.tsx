import { cx } from "@/lib/cx";

const TONES: Record<string, string> = {
  A2: "border-level-a2 text-level-a2 bg-[color-mix(in_srgb,var(--level-a2)_10%,transparent)]",
  B1: "border-level-b1 text-level-b1 bg-[color-mix(in_srgb,var(--level-b1)_10%,transparent)]",
  B2: "border-level-b2 text-level-b2 bg-[color-mix(in_srgb,var(--level-b2)_10%,transparent)]",
  C1: "border-level-c1 text-level-c1 bg-[color-mix(in_srgb,var(--level-c1)_10%,transparent)]",
};

/** CEFR level as a small chip in the level's colour. */
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
        "inline-flex h-7 min-w-10 items-center justify-center rounded-full border px-2.5 text-sm font-bold",
        TONES[level] ?? "border-line text-ink-soft",
        className,
      )}
    >
      {level}
    </span>
  );
}
