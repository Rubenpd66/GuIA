"use client";

import { useTranslations } from "next-intl";
import { Stamp } from "@/components/passport/Stamp";
import { usePartName } from "@/components/sections/usePartName";
import { Button } from "@/components/ui/Button";
import { SKILL_OF_PART, partNumber } from "@/lib/exam/format";
import { dismissLevelUps, useLevelUps } from "@/lib/estimate/levelUps";

/** Shown after an attempt that raises a part's stamp; stays until the learner closes it. */
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
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-4 rounded-card border-[1.5px] border-line bg-canvas p-4 shadow-none lg:bottom-6"
    >
      <Stamp
        skill={SKILL_OF_PART[first.part]}
        level={first.estimate.level}
        caption={
          number === null
            ? tAll(`Parts.${first.part}`)
            : tAll("Practice.partNumber", { number })
        }
        tone={first.estimate.level === "C" ? "foil" : "entry"}
        label={t("stampLabel", {
          level: first.estimate.level,
          part: partName(first.part),
        })}
        className="size-20 shrink-0"
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
