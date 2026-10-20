import type { AchievementLevel } from "@/components/progress/Achievement";
import { SKILLS, type Skill } from "@/lib/exam/format";
import type { Progress } from "@/lib/progress/schema";
import { estimateAll } from "./level";

const RANK: Record<AchievementLevel, number> = { A2: 1, B1: 2, B2: 3, C: 4 };

export type PassportSkill = {
  skill: Skill;
  level: AchievementLevel | null;
  /** Weighted share of right answers, 0–100; null without enough data. */
  percent: number | null;
  selfAssessed: boolean;
};

export type PassportSummary = {
  /** The highest estimated level across the skills (an app estimate, not an official result). */
  highest: AchievementLevel | null;
  skills: PassportSkill[];
  /** When the latest exam-mode attempt (placement test, mock exam or exam-mode practice) ended. */
  lastTestAt: number | null;
  hasData: boolean;
};

/** What the language passport shows: built from the same estimates as the dashboard. */
export function passportSummary(progress: Progress): PassportSummary {
  const estimates = estimateAll(progress);
  const skills = SKILLS.map((skill): PassportSkill => {
    const estimate = estimates.skills[skill];
    return {
      skill,
      level: estimate?.level ?? null,
      percent: estimate ? Math.round(estimate.ratio * 100) : null,
      selfAssessed: estimate?.selfAssessed ?? false,
    };
  });
  const highest = skills.reduce<AchievementLevel | null>(
    (best, { level }) =>
      level && (!best || RANK[level] > RANK[best]) ? level : best,
    null,
  );
  const exams = progress.attempts.filter((a) => a.mode === "exam");
  return {
    highest,
    skills,
    lastTestAt: exams.length
      ? Math.max(...exams.map((a) => a.finishedAt))
      : null,
    hasData: skills.some((s) => s.percent !== null),
  };
}
