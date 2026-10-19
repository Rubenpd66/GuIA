"use client";

import { useTranslations } from "next-intl";
import { Achievement } from "@/components/progress/Achievement";
import { usePartName } from "@/components/sections/usePartName";
import { Button } from "@/components/ui/Button";
import { partNumber } from "@/lib/exam/format";
import { dismissLevelUps, useLevelUps } from "@/lib/estimate/levelUps";

/** Shown after an attempt that raises a part's level; stays until the learner closes it. */
export function LevelUpNotice() {
  const t = useTranslations("Dashboard");
  const tAll = useTranslations();
  const partName = usePartName();
  const levelUps = useLevelUps();
  const first = levelUps[0];
  if (!first?.estimate.level) return null;
  const number = partNumber(first.part);
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-4 rounded-card bg-canvas p-4 shadow-lg ring-1 ring-hairline lg:bottom-6"
    >
      <Achievement
        level={first.estimate.level}
        caption={
          number === null
            ? tAll(`Parts.${first.part}`)
            : tAll("Practice.partNumber", { number })
        }
        label={t("stampLabel", {
          level: first.estimate.level,
          part: partName(first.part),
        })}
        className="shrink-0"
        animate
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">{t("levelUpTitle")}</p>
        <p className="text-sm">
          {t("levelUpBody", {
            level: first.estimate.level,
            part: partName(first.part),
            more: levelUps.length - 1,
          })}
        </p>
        <Button variant="ghost" onClick={dismissLevelUps}>
          {t("levelUpClose")}
        </Button>
      </div>
    </div>
  );
}
