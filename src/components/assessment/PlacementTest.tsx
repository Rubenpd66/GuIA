"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SkillMark } from "@/components/passport/SkillMark";
import { Stamp } from "@/components/passport/Stamp";
import { usePartName } from "@/components/sections/usePartName";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { loadBank } from "@/lib/content/useBank";
import { createRng, randomSeed } from "@/lib/trainer/random";
import { AssessmentRunner } from "./AssessmentRunner";
import {
  buildPlacementSteps,
  placementLevels,
  placementPlan,
} from "./placement";
import type { Step, StepResult } from "./steps";

const H2 = "text-xl font-bold font-semi-expanded";

export function PlacementTest() {
  const t = useTranslations("Placement");
  const tAll = useTranslations();
  const partName = usePartName();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [loading, setLoading] = useState<"idle" | "loading" | "error">("idle");

  if (results) {
    const levels = placementLevels(results);
    const plan = placementPlan(results);
    return (
      <div className="max-w-[68ch] space-y-10">
        <section aria-labelledby="placement-result" className="space-y-4">
          <h2 id="placement-result" className={H2}>
            {t("resultTitle")}
          </h2>
          <p className="text-sm text-ink-soft">{t("estimateNote")}</p>
          <ul className="grid gap-4 sm:grid-cols-3">
            {levels.map(({ skill, ratio, level }) => (
              <li
                key={skill}
                className="flex flex-col items-center gap-2 rounded-page border-[1.5px] border-hairline p-4 text-center"
              >
                {level ? (
                  <Stamp
                    skill={skill}
                    level={level}
                    caption={tAll(`Skills.${skill}`)}
                    tone={level === "C" ? "foil" : "entry"}
                    label={t("stampLabel", {
                      level,
                      skill: tAll(`Skills.${skill}`),
                    })}
                    className="size-24"
                    animate
                  />
                ) : (
                  <SkillMark skill={skill} className="size-12 text-ink-soft" />
                )}
                <span className="font-semibold">{tAll(`Skills.${skill}`)}</span>
                <span className="text-sm text-ink-soft tabular-nums">
                  {level ?? t("noStamp")} ·{" "}
                  {t("percent", { value: Math.round(ratio * 100) })}
                </span>
              </li>
            ))}
          </ul>
          <p>
            {t("notEstimated")}{" "}
            <Link href="/writing" className="underline underline-offset-4">
              {tAll("Skills.writing")}
            </Link>
            {" · "}
            <Link href="/speaking" className="underline underline-offset-4">
              {tAll("Skills.speaking")}
            </Link>
          </p>
        </section>
        <section aria-labelledby="placement-plan" className="space-y-3">
          <h2 id="placement-plan" className={H2}>
            {t("planTitle")}
          </h2>
          <ol className="list-decimal space-y-2 pl-6">
            {plan.map((part) => (
              <li key={part}>
                <Link
                  href={{ pathname: "/practice/[part]", params: { part } }}
                  className="underline underline-offset-4"
                >
                  {partName(part)}
                </Link>
              </li>
            ))}
          </ol>
          <ButtonLink variant="primary" href="/dashboard">
            {t("toDashboard")}
          </ButtonLink>
        </section>
      </div>
    );
  }

  if (steps)
    return (
      <AssessmentRunner
        steps={steps}
        secondsOf={() => null}
        onComplete={setResults}
      />
    );

  return (
    <section
      aria-labelledby="placement-intro"
      className="max-w-[68ch] space-y-4"
    >
      <h2 id="placement-intro" className={H2}>
        {t("introTitle")}
      </h2>
      <p>{t("introBody")}</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>{t("sections.core")}</li>
        <li>{t("sections.reading")}</li>
        <li>{t("sections.listening")}</li>
      </ul>
      <p className="text-sm text-ink-soft">{t("introNote")}</p>
      <Button
        variant="primary"
        size="lg"
        disabled={loading === "loading"}
        onClick={() => {
          setLoading("loading");
          loadBank("placement").then(
            (bank) =>
              setSteps(buildPlacementSteps(bank, createRng(randomSeed()))),
            () => setLoading("error"),
          );
        }}
      >
        {t("start")}
      </Button>
      {loading === "error" ? (
        <p role="alert" className="text-refusal">
          {tAll("Bank.error")}
        </p>
      ) : null}
    </section>
  );
}
