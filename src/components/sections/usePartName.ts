"use client";

import { useTranslations } from "next-intl";
import { SKILL_OF_PART, partNumber, type ExamPart } from "@/lib/exam/format";

/** "Reading, part 2: Text cohesion" or "Core: Grammar", as the practice pages title them. */
export function usePartName() {
  const t = useTranslations();
  return (part: ExamPart) => {
    const name = t(`Parts.${part}`);
    const number = partNumber(part);
    return number === null
      ? t("Practice.coreTitle", { name })
      : t("Practice.title", {
          skill: t(`Skills.${SKILL_OF_PART[part]}`),
          number,
          name,
        });
  };
}
