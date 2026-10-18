import type { Skill } from "@/lib/exam/format";
import { cx } from "@/lib/cx";
import { STAMP_SHAPES } from "./stamp-shapes";

/** The skill's stamp outline at icon size. */
export function SkillMark({
  skill,
  className,
}: {
  skill: Skill;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cx("size-5 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="11"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={STAMP_SHAPES[skill].outer} />
    </svg>
  );
}
