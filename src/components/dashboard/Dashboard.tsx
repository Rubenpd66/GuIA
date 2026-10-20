"use client";

import { useTranslations } from "next-intl";
import { LevelPassport } from "@/components/passport/LevelPassport";
import { Achievement } from "@/components/progress/Achievement";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { usePartName } from "@/components/sections/usePartName";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import {
  EXAM_PARTS,
  SKILLS,
  SKILL_OF_PART,
  partNumber,
  type ExamPart,
} from "@/lib/exam/format";
import { daysBetween, minutesThisWeek, streak } from "@/lib/estimate/activity";
import { estimateAll, type Estimate } from "@/lib/estimate/level";
import {
  suggestions,
  weakestParts,
  type Suggestion,
} from "@/lib/estimate/next";
import { middayOf, useToday } from "@/lib/estimate/useToday";
import { dueCount } from "@/lib/flashcards/deck";
import { flashcardsStore } from "@/lib/flashcards/store";
import { examDateStore } from "@/lib/progress/examDate";
import { useProgress } from "@/lib/progress/useProgress";

const H2 = "text-xl font-bold";
const percent = (estimate: Estimate) => Math.round(estimate.ratio * 100);

export function Dashboard() {
  const t = useTranslations("Dashboard");
  const tAll = useTranslations();
  const partName = usePartName();
  const progress = useProgress();
  const examDate = examDateStore.useValue();
  const flashcards = flashcardsStore.useValue();
  const today = useToday();

  // Progress lives in the browser; render nothing on the server rather than an empty dashboard.
  if (today === null) return null;
  const now = middayOf(today);
  const estimates = estimateAll(progress);
  const next = suggestions(progress, estimates, now, examDate);
  const weak = weakestParts(estimates);
  const daysLeft = examDate ? daysBetween(today, examDate) : null;

  if (progress.attempts.length === 0)
    return (
      <div className="flex flex-col gap-12">
        <section className="max-w-[68ch] space-y-4 rounded-card bg-surface p-6">
          <h2 className={H2}>{t("emptyTitle")}</h2>
          <p>{t("emptyBody")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink variant="primary" href="/placement-test">
              {t("emptyPlacement")}
            </ButtonLink>
            <ButtonLink href="/practice">{t("emptyPractice")}</ButtonLink>
          </div>
        </section>
        <div className="flex justify-center overflow-x-clip py-4">
          <LevelPassport context="dashboard" />
        </div>
      </div>
    );

  const suggestionText = (s: Suggestion) => {
    switch (s.kind) {
      case "mock":
        return t("next.mock", { days: s.daysLeft });
      case "start":
        return t("next.start", { part: partName(s.part) });
      case "weakest":
        return t("next.weakest", { part: partName(s.part) });
      case "mistakes":
        return t("next.mistakes", { count: s.count, part: partName(s.part) });
    }
  };
  const suggestionLink = (s: Suggestion) =>
    s.kind === "mock"
      ? ("/mock-exam" as const)
      : { pathname: "/practice/[part]" as const, params: { part: s.part } };

  return (
    <div className="flex flex-col gap-12">
      <p className="text-sm text-ink-soft">{t("estimateNote")}</p>

      <section
        aria-labelledby="dashboard-next"
        className="max-w-[68ch] space-y-4"
      >
        <h2 id="dashboard-next" className={H2}>
          {t("nextTitle")}
        </h2>
        {daysLeft !== null && daysLeft >= 0 ? (
          <p className="text-lg font-semibold">
            {t("countdown", { days: daysLeft })}
          </p>
        ) : null}
        {next[0] ? (
          <div className="space-y-3 rounded-card bg-surface p-5">
            <p className="text-lg">{suggestionText(next[0])}</p>
            <ButtonLink variant="primary" href={suggestionLink(next[0])}>
              {t("go")}
            </ButtonLink>
          </div>
        ) : null}
        {next.length > 1 ? (
          <ul className="space-y-2">
            {next.slice(1).map((s) => (
              <li key={s.kind}>
                <Link
                  href={suggestionLink(s)}
                  className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {suggestionText(s)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="dashboard-level-passport" className="space-y-4">
        <h2 id="dashboard-level-passport" className={H2}>
          {t("levelPassportTitle")}
        </h2>
        <div className="flex justify-center overflow-x-clip py-4">
          <LevelPassport defaultOpen context="dashboard" />
        </div>
      </section>

      <section
        aria-labelledby="dashboard-skills"
        className="max-w-[68ch] space-y-4"
      >
        <h2 id="dashboard-skills" className={H2}>
          {t("skillsTitle")}
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {SKILLS.map((skill) => {
            const estimate = estimates.skills[skill];
            return (
              <div
                key={skill}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-surface p-4"
              >
                <dt className="font-semibold">{tAll(`Skills.${skill}`)}</dt>
                <dd className="min-w-0 flex-1 text-right">
                  {estimate ? (
                    <>
                      <span className="font-bold">
                        {estimate.level ?? t("noStamp")}
                      </span>{" "}
                      <span className="text-sm text-ink-soft tabular-nums">
                        {t("percent", { value: percent(estimate) })}
                      </span>
                      {estimate.selfAssessed ? (
                        <span className="block text-xs text-ink-soft">
                          {t("selfAssessed")}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-sm text-ink-soft">{t("noData")}</span>
                  )}
                  {estimate ? (
                    <div className="mt-2 text-left">
                      <ProgressBar
                        value={percent(estimate) / 100}
                        label={`${tAll(`Skills.${skill}`)}: ${t("percent", { value: percent(estimate) })}`}
                      />
                    </div>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section
        aria-labelledby="dashboard-habit"
        className="max-w-[68ch] space-y-3"
      >
        <h2 id="dashboard-habit" className={H2}>
          {t("habitTitle")}
        </h2>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-control bg-surface p-4">
            <dt className="text-sm text-ink-soft">{t("streakLabel")}</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {t("days", { count: streak(progress.attempts, now) })}
            </dd>
          </div>
          <div className="rounded-control bg-surface p-4">
            <dt className="text-sm text-ink-soft">{t("weekLabel")}</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {t("minutes", {
                count: minutesThisWeek(progress.attempts, now),
              })}
            </dd>
          </div>
        </dl>
        <Link
          href="/flashcards"
          className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          {t("flashcardsDue", { count: dueCount(flashcards, today) })}
        </Link>
      </section>

      {weak.length > 0 ? (
        <section
          aria-labelledby="dashboard-weak"
          className="max-w-[68ch] space-y-3"
        >
          <h2 id="dashboard-weak" className={H2}>
            {t("weakTitle")}
          </h2>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {weak.map((part) => (
              <li key={part}>
                <Link
                  href={{ pathname: "/practice/[part]", params: { part } }}
                  className="flex min-h-12 items-center justify-between gap-3 py-2 hover:bg-surface"
                >
                  <span>{partName(part)}</span>
                  <span className="shrink-0 text-sm text-ink-soft tabular-nums">
                    {t("percent", { value: percent(estimates.parts[part]!) })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="dashboard-passport" className="space-y-4">
        <h2 id="dashboard-passport" className={H2}>
          {t("passportTitle")}
        </h2>
        <p className="max-w-[68ch] text-ink-soft">{t("passportLead")}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {EXAM_PARTS.map((part) => (
            <PassportSlot
              key={part}
              part={part}
              estimate={estimates.parts[part]}
              name={partName(part)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function PassportSlot({
  part,
  estimate,
  name,
}: {
  part: ExamPart;
  estimate: Estimate | null;
  name: string;
}) {
  const t = useTranslations("Dashboard");
  const tAll = useTranslations();
  const skill = SKILL_OF_PART[part];
  const number = partNumber(part);
  const caption =
    number === null
      ? tAll(`Parts.${part}`)
      : tAll("Practice.partNumber", { number });
  return (
    <li className="flex flex-col items-center gap-1 rounded-card bg-surface p-3 text-center">
      <Link
        href={{ pathname: "/practice/[part]", params: { part } }}
        className="flex flex-col items-center gap-1"
      >
        {estimate?.level ? (
          <Achievement
            level={estimate.level}
            caption={caption}
            label={t("stampLabel", { level: estimate.level, part: name })}
          />
        ) : (
          <span
            aria-label={t("emptySlot", { part: name })}
            className="flex size-16 items-center justify-center text-sm text-ink-soft"
          >
            {estimate ? t("noStamp") : "—"}
          </span>
        )}
        <span className="text-xs font-semibold">
          {tAll(`Skills.${skill}`)} · {caption}
        </span>
      </Link>
    </li>
  );
}
