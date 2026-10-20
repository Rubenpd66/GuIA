import { cx } from "@/lib/cx";

export type AchievementLevel = "A2" | "B1" | "B2" | "C";

const TONES: Record<AchievementLevel, string> = {
  A2: "bg-level-a2 text-on-accent",
  B1: "bg-level-b1 text-on-accent",
  B2: "bg-level-b2 text-on-accent",
  C: "bg-reward text-on-reward",
};

type AchievementProps = {
  level: AchievementLevel;
  /** Short text under the badge, e.g. "Reading part 4". */
  caption?: string;
  /** Accessible name, e.g. "C achievement: Reading part 4". */
  label: string;
  className?: string;
  /** Plays the reward animation once on mount (levelling up, finishing a test). */
  animate?: boolean;
};

/** A level badge: the reward for reaching a level in a part. */
export function Achievement({
  level,
  caption,
  label,
  className,
  animate = false,
}: AchievementProps) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cx("flex flex-col items-center gap-2 text-center", className)}
    >
      <span className="relative flex size-16 items-center justify-center">
        {animate ? (
          <span
            aria-hidden="true"
            className="achievement-ring absolute inset-0 rounded-full bg-reward"
          />
        ) : null}
        <span
          aria-hidden="true"
          className={cx(
            "relative flex size-full items-center justify-center rounded-full text-xl font-extrabold shadow-card",
            TONES[level],
            animate && "achievement",
          )}
        >
          {level}
        </span>
      </span>
      {caption ? (
        <figcaption
          aria-hidden="true"
          className={cx(
            "text-xs font-semibold text-ink-soft",
            animate && "achievement-caption",
          )}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
