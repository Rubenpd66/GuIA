import type { IconName } from "@/components/icons/Icon";
import { SECTIONS, type SectionKey } from "@/config/sections";

export type NavKey = Extract<
  SectionKey,
  | "dashboard"
  | "syllabus"
  | "practice"
  | "mockExam"
  | "placementTest"
  | "flashcards"
  | "mistakes"
  | "examGuide"
  | "settings"
>;

export type NavItem = { key: NavKey; icon: IconName };

/** Always visible: the bottom bar on mobile and the top of the spine on desktop. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { key: "dashboard", icon: "dashboard" },
  { key: "syllabus", icon: "syllabus" },
  { key: "practice", icon: "practice" },
  { key: "mockExam", icon: "mockExam" },
];

/** Behind "More" on mobile, below a divider on desktop. */
export const MORE_NAV: readonly NavItem[] = [
  { key: "placementTest", icon: "placementTest" },
  { key: "flashcards", icon: "flashcards" },
  { key: "mistakes", icon: "mistakes" },
  { key: "examGuide", icon: "examGuide" },
  { key: "settings", icon: "settings" },
];

export function hrefOf(key: NavKey) {
  return SECTIONS[key].pathname;
}

/** True when `current` is the target section or one of its sub-pages. */
export function isActive(current: string, target: string): boolean {
  return current === target || current.startsWith(`${target}/`);
}
