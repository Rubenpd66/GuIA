import type { Skill } from "@/lib/exam/format";
import { cx } from "@/lib/cx";
import { STAMP_SHAPES } from "./stamp-shapes";

export type StampLevel = "A2" | "B1" | "B2" | "C";

const TONES = {
  entry: "text-entry",
  foil: "text-foil-ink",
  ink: "text-ink",
} as const;

type StampProps = {
  skill: Skill;
  level: StampLevel;
  /** Short text along the bottom, e.g. "Reading part 4". Shown in capitals, like a real stamp. */
  caption: string;
  date?: string;
  tone?: keyof typeof TONES;
  rotate?: number;
  /** Accessible name, e.g. "C stamp: Reading part 4". */
  label: string;
  className?: string;
};

export function Stamp({
  skill,
  level,
  caption,
  date,
  tone = "entry",
  rotate = -8,
  label,
  className,
}: StampProps) {
  const shape = STAMP_SHAPES[skill];
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
      className={cx("size-28", TONES[tone], className)}
    >
      <g transform={`rotate(${rotate} 60 60)`} opacity="0.92">
        <g fill="none" stroke="currentColor" strokeLinejoin="round">
          <path d={shape.outer} strokeWidth="3.5" />
          <path d={shape.inner} strokeWidth="1.25" />
        </g>
        <g fill="currentColor" textAnchor="middle">
          {date && shape.dateY ? (
            <text
              x="60"
              y={shape.dateY}
              fontSize="7.5"
              fontWeight="600"
              letterSpacing="1"
            >
              {date.toUpperCase()}
            </text>
          ) : null}
          <text
            x="60"
            y={shape.levelY}
            fontSize={shape.levelSize}
            fontWeight="800"
            style={{ fontStretch: "125%" }}
          >
            {level}
          </text>
          <text
            x="60"
            y={shape.captionY}
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.2"
          >
            {caption.toUpperCase()}
          </text>
        </g>
      </g>
    </svg>
  );
}
