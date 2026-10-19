"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { SkillMark } from "@/components/passport/SkillMark";
import { Stamp } from "@/components/passport/Stamp";
import { usePartName } from "@/components/sections/usePartName";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { SKILLS, type Skill } from "@/lib/exam/format";
import { useToday } from "@/lib/estimate/useToday";
import type { MockState } from "@/lib/mock/state";
import { mockStore } from "@/lib/mock/store";
import { randomSeed } from "@/lib/trainer/random";
import { AssessmentRunner } from "./AssessmentRunner";
import {
  COMPONENT_MINUTES,
  buildMockSteps,
  mockSeconds,
  type MockBank,
} from "./mock";
import { placementPlan } from "./placement";
import { levelsBySkill } from "./steps";

const H2 = "text-xl font-bold font-semi-expanded";
const SELF_ASSESSED: ReadonlySet<Skill> = new Set(["writing", "speaking"]);

// Only called from event handlers; the purity lint misreads them as render code.
const now = () => Date.now();

export function MockExam({ bank }: { bank: MockBank }) {
  const today = useToday();
  const state = mockStore.useValue();
  // Progress lives in the browser; render nothing on the server.
  if (today === null) return null;
  if (!state) return <MockSetup />;
  if (state.finishedAt !== null) return <MockReport state={state} />;
  return <MockRun key={state.startedAt} state={state} bank={bank} />;
}

function MockSetup() {
  const t = useTranslations("Mock");
  const tAll = useTranslations();
  const [chosen, setChosen] = useState<Set<Skill>>(() => new Set(SKILLS));
  const minutes = [...chosen].reduce((sum, s) => sum + COMPONENT_MINUTES[s], 0);
  return (
    <section aria-labelledby="mock-setup" className="max-w-[68ch] space-y-5">
      <h2 id="mock-setup" className={H2}>
        {t("setupTitle")}
      </h2>
      <p>{t("setupBody")}</p>
      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("components")}</legend>
        {SKILLS.map((skill) => (
          <label
            key={skill}
            className="flex min-h-11 cursor-pointer items-center gap-3"
          >
            <input
              type="checkbox"
              checked={chosen.has(skill)}
              onChange={(event) =>
                setChosen((current) => {
                  const next = new Set(current);
                  if (event.target.checked) next.add(skill);
                  else next.delete(skill);
                  return next;
                })
              }
              className="size-5"
            />
            <SkillMark skill={skill} className="text-cover dark:text-foil" />
            <span>
              {tAll(`Skills.${skill}`)}{" "}
              <span className="text-sm text-ink-soft">
                {t("minutes", { count: COMPONENT_MINUTES[skill] })}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-ink-soft">{t("setupNote")}</p>
      <Button
        variant="primary"
        size="lg"
        disabled={chosen.size === 0}
        onClick={() =>
          mockStore.save({
            version: 1,
            seed: randomSeed(),
            components: SKILLS.filter((skill) => chosen.has(skill)),
            startedAt: now(),
            index: 0,
            results: [],
            runningSince: null,
            finishedAt: null,
          })
        }
      >
        {t("start", { count: minutes })}
      </Button>
    </section>
  );
}

function MockRun({ state, bank }: { state: MockState; bank: MockBank }) {
  const t = useTranslations("Mock");
  const dialog = useRef<HTMLDialogElement>(null);
  const steps = useMemo(
    () => buildMockSteps(bank, state.components, state.seed),
    [bank, state.components, state.seed],
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{t("inProgress")}</p>
        <Button variant="ghost" onClick={() => dialog.current?.showModal()}>
          {t("discard")}
        </Button>
      </div>
      <AssessmentRunner
        steps={steps}
        secondsOf={mockSeconds}
        resume={{
          index: state.index,
          results: state.results,
          runningSince: state.runningSince,
        }}
        onProgress={(progress) =>
          mockStore.save({ ...(mockStore.read() ?? state), ...progress })
        }
        onComplete={(results) =>
          mockStore.save({
            ...(mockStore.read() ?? state),
            results,
            runningSince: null,
            finishedAt: now(),
          })
        }
      />
      <dialog
        ref={dialog}
        aria-labelledby="mock-discard-title"
        className="m-auto max-w-md rounded-page bg-sheet p-6 text-ink backdrop:bg-[color-mix(in_srgb,var(--ink)_45%,transparent)]"
      >
        <p id="mock-discard-title" className="font-semibold">
          {t("discardConfirm")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => mockStore.save(null)}>
            {t("discardButton")}
          </Button>
          <Button onClick={() => dialog.current?.close()}>{t("cancel")}</Button>
        </div>
      </dialog>
    </div>
  );
}

function MockReport({ state }: { state: MockState }) {
  const t = useTranslations("Mock");
  const tAll = useTranslations();
  const partName = usePartName();
  const levels = levelsBySkill(state.results);
  const weak = placementPlan(state.results);
  return (
    <div className="max-w-[68ch] space-y-10">
      <section aria-labelledby="mock-report" className="space-y-4">
        <h2 id="mock-report" className={H2}>
          {t("reportTitle")}
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
              {SELF_ASSESSED.has(skill) ? (
                <span className="text-xs text-ink-soft">
                  {t("selfAssessed")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mock-parts" className="space-y-3">
        <h2 id="mock-parts" className={H2}>
          {t("partsTitle")}
        </h2>
        <ul className="divide-y divide-hairline border-y border-hairline">
          {state.results.map((result) => (
            <li
              key={result.part}
              className="flex min-h-12 items-center justify-between gap-3 py-2"
            >
              <span>{partName(result.part)}</span>
              <span className="shrink-0 text-sm tabular-nums">
                {t("score", result)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="mock-gv"
        className="space-y-2 rounded-page bg-sheet p-5"
      >
        <h2 id="mock-gv" className="font-semibold">
          {t("gvTitle")}
        </h2>
        <p>{t("gvBody")}</p>
      </section>

      <section aria-labelledby="mock-weak" className="space-y-3">
        <h2 id="mock-weak" className={H2}>
          {t("weakTitle")}
        </h2>
        <ol className="list-decimal space-y-2 pl-6">
          {weak.map((part) => (
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
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="primary" onClick={() => mockStore.save(null)}>
          {t("again")}
        </Button>
        <ButtonLink href="/dashboard">{t("toDashboard")}</ButtonLink>
      </div>
    </div>
  );
}
