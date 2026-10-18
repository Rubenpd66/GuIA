import type { StaticPathname } from "@/i18n/routing";
import type { Skill } from "@/lib/exam/format";

export type SectionKey =
  | "dashboard"
  | "placementTest"
  | "syllabus"
  | "grammar"
  | "vocabulary"
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "practice"
  | "mockExam"
  | "flashcards"
  | "mistakes"
  | "examGuide"
  | "settings";

/** Every section of the app, its internal path and the project phase that delivers it. */
export const SECTIONS: Record<
  SectionKey,
  { pathname: StaticPathname; phase: number }
> = {
  dashboard: { pathname: "/dashboard", phase: 7 },
  placementTest: { pathname: "/placement-test", phase: 7 },
  syllabus: { pathname: "/syllabus", phase: 2 },
  grammar: { pathname: "/grammar", phase: 2 },
  vocabulary: { pathname: "/vocabulary", phase: 2 },
  reading: { pathname: "/reading", phase: 3 },
  listening: { pathname: "/listening", phase: 4 },
  writing: { pathname: "/writing", phase: 5 },
  speaking: { pathname: "/speaking", phase: 6 },
  practice: { pathname: "/practice", phase: 2 },
  mockExam: { pathname: "/mock-exam", phase: 7 },
  flashcards: { pathname: "/flashcards", phase: 7 },
  mistakes: { pathname: "/mistakes", phase: 7 },
  examGuide: { pathname: "/exam-guide", phase: 2 },
  settings: { pathname: "/settings", phase: 1 },
};

/** Phase in which each skill's trainers arrive. */
export const PHASE_OF_SKILL: Record<Skill, number> = {
  core: 2,
  reading: 3,
  listening: 4,
  writing: 5,
  speaking: 6,
};
