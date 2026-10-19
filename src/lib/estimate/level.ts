/**
 * The app's own level estimate (not an official conversion): a weighted share of right
 * answers from recent attempts, mapped to fixed bands. Every screen that shows it says so.
 */
import type { StampLevel } from "@/components/passport/Stamp";
import {
  EXAM_PARTS,
  SKILLS,
  SKILL_OF_PART,
  type ExamPart,
  type Skill,
} from "@/lib/exam/format";
import type { Attempt, Progress } from "@/lib/progress/schema";

/** app decision: lowest share of right answers for each stamp, highest first. */
export const LEVEL_BANDS: readonly { level: StampLevel; min: number }[] = [
  { level: "C", min: 0.85 },
  { level: "B2", min: 0.7 },
  { level: "B1", min: 0.55 },
  { level: "A2", min: 0.4 },
];

/** app decision: how much history counts, and how much more recent and exam attempts weigh. */
const RECENT = 10;
const RECENT_HEAVY = 5;
const MIN_ATTEMPTS = 2;
const MIN_CORE_ITEMS = 10;

/** Writing and Speaking come from the learner's own rubric, which is less reliable. */
const SELF_ASSESSED: ReadonlySet<Skill> = new Set(["writing", "speaking"]);

export type Estimate = {
  /** Weighted share of right answers, 0–1. */
  ratio: number;
  /** null below the lowest band ("no stamp"). */
  level: StampLevel | null;
  attempts: number;
  selfAssessed: boolean;
};

export function bandOf(ratio: number): StampLevel | null {
  return LEVEL_BANDS.find((band) => ratio >= band.min)?.level ?? null;
}

/** The estimate for one part, or null when there is not enough data to say anything. */
export function estimatePart(
  attempts: readonly Attempt[],
  part: ExamPart,
): Estimate | null {
  const recent = attempts
    .filter((a) => a.part === part && a.total > 0)
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, RECENT);
  const items = recent.reduce((sum, a) => sum + a.total, 0);
  const isCore = SKILL_OF_PART[part] === "core";
  if (recent.length < MIN_ATTEMPTS && !(isCore && items >= MIN_CORE_ITEMS))
    return null;
  let weighted = 0;
  let weights = 0;
  recent.forEach((attempt, i) => {
    const weight =
      (i < RECENT_HEAVY ? 2 : 1) * (attempt.mode === "exam" ? 2 : 1);
    weighted += weight * (attempt.correct / attempt.total);
    weights += weight;
  });
  const ratio = weighted / weights;
  return {
    ratio,
    level: bandOf(ratio),
    attempts: recent.length,
    selfAssessed: SELF_ASSESSED.has(SKILL_OF_PART[part]),
  };
}

export type Estimates = {
  parts: Record<ExamPart, Estimate | null>;
  skills: Record<Skill, Estimate | null>;
};

/** Every part, and each skill as the plain average of its parts that have data. */
export function estimateAll(progress: Progress): Estimates {
  const parts = Object.fromEntries(
    EXAM_PARTS.map((part) => [part, estimatePart(progress.attempts, part)]),
  ) as Estimates["parts"];
  const skills = Object.fromEntries(
    SKILLS.map((skill) => {
      const known = EXAM_PARTS.filter(
        (part) => SKILL_OF_PART[part] === skill,
      ).flatMap((part) => (parts[part] ? [parts[part]] : []));
      if (known.length === 0) return [skill, null];
      const ratio = known.reduce((sum, e) => sum + e.ratio, 0) / known.length;
      return [
        skill,
        {
          ratio,
          level: bandOf(ratio),
          attempts: known.reduce((sum, e) => sum + e.attempts, 0),
          selfAssessed: SELF_ASSESSED.has(skill),
        },
      ];
    }),
  ) as Estimates["skills"];
  return { parts, skills };
}

const RANK: Record<StampLevel, number> = { A2: 1, B1: 2, B2: 3, C: 4 };

/** True when the part now carries a higher stamp than before (drives the stamp animation). */
export function leveledUp(
  before: Estimate | null,
  after: Estimate | null,
): boolean {
  if (!after?.level) return false;
  return !before?.level || RANK[after.level] > RANK[before.level];
}
