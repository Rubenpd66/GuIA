"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId, useRef, useState, type PointerEvent } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/icons/Icon";
import { LevelBadge } from "@/components/content/LevelBadge";
import { Achievement } from "@/components/progress/Achievement";
import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import { passportSummary } from "@/lib/estimate/passport";
import type { Skill } from "@/lib/exam/format";
import { useProgress } from "@/lib/progress/useProgress";

/** The CEFR chip colours use the content levels; the app's top band "C" shows as C1's chip. */
const CHIP_LEVEL = { A2: "A2", B1: "B1", B2: "B2", C: "C1" } as const;

const MAX_TILT = 8;

/**
 * The learner's language passport. Closed, it floats and tilts towards the pointer; pressed,
 * the cover swings open on its spine and shows the highest level reached in the tests.
 * `defaultOpen` opens it as soon as there is something to show (the dashboard).
 */
export function LevelPassport({
  defaultOpen = false,
  context = "home",
  className,
}: {
  defaultOpen?: boolean;
  /** Which link the inside page offers: the dashboard (home) or the placement test. */
  context?: "home" | "dashboard";
  className?: string;
}) {
  const t = useTranslations("Passport");
  const tAll = useTranslations();
  const format = useFormatter();
  const summary = passportSummary(useProgress());
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [opens, setOpens] = useState(0);
  const open = chosen ?? (defaultOpen && summary.hasData);
  const tilt = useRef<HTMLDivElement>(null);
  const insideId = useId();

  const toggle = () => {
    if (!open) setOpens((n) => n + 1);
    setChosen(!open);
    if (tilt.current) tilt.current.style.transform = "";
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = tilt.current;
    if (!el || open || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT * 1.5).toFixed(2)}deg)`;
  };
  const onPointerLeave = () => {
    if (tilt.current) tilt.current.style.transform = "";
  };

  return (
    <div
      className={cx("passport-scene", className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="passport-float">
        <div ref={tilt} className="passport-tilt">
          <div className="passport" data-open={open}>
            <section
              id={insideId}
              aria-label={t("insideLabel")}
              inert={!open}
              className="passport-inside"
            >
              <PassportInside
                key={opens}
                summary={summary}
                context={context}
                animate={open && opens > 0}
                onClose={toggle}
                lastTest={
                  summary.lastTestAt
                    ? format.dateTime(new Date(summary.lastTestAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null
                }
                skillName={(skill) => tAll(`Skills.${skill}`)}
              />
            </section>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={insideId}
              onClick={toggle}
              className="passport-cover"
            >
              <span className="sr-only">{open ? t("close") : t("open")}</span>
              <span aria-hidden="true" className="passport-face passport-front">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase">
                  {t("coverTitle")}
                </span>
                <Globe />
                <Wordmark inverse className="text-4xl" />
                <span className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase">
                    {t("coverSubtitle")}
                  </span>
                  <Chip />
                </span>
              </span>
              <span aria-hidden="true" className="passport-face passport-back">
                <Wordmark className="text-lg opacity-70" />
              </span>
            </button>
          </div>
        </div>
      </div>
      <p className="passport-hint" aria-hidden="true">
        {open ? t("tapToClose") : t("tapToOpen")}
      </p>
    </div>
  );
}

function PassportInside({
  summary,
  context,
  animate,
  onClose,
  lastTest,
  skillName,
}: {
  summary: ReturnType<typeof passportSummary>;
  context: "home" | "dashboard";
  animate: boolean;
  onClose: () => void;
  lastTest: string | null;
  skillName: (skill: Skill) => string;
}) {
  const t = useTranslations("Passport");
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
          {t("coverTitle")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="pressable -mt-2 -mr-2 inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover-fine:bg-hairline"
        >
          <Icon name="close" className="size-5" />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>
      {summary.highest ? (
        <div className="flex items-center gap-3">
          <Achievement
            level={summary.highest}
            label={t("highestLabel", { level: summary.highest })}
            animate={animate}
            className="shrink-0"
          />
          <p className="text-sm leading-tight">
            <span className="block text-ink-soft">{t("highest")}</span>
            <span className="text-2xl font-extrabold">{summary.highest}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          {summary.hasData ? t("belowA2") : t("noData")}
        </p>
      )}
      <dl className="space-y-1 text-sm">
        {summary.skills.map(({ skill, level, percent }) => (
          <div
            key={skill}
            className="flex min-h-6 items-center justify-between gap-2 border-b border-hairline pb-1 last:border-b-0"
          >
            <dt className="font-medium">{skillName(skill)}</dt>
            <dd className="flex items-center gap-2 tabular-nums">
              {percent !== null ? (
                <span className="text-xs text-ink-soft">{percent} %</span>
              ) : null}
              {level ? (
                <LevelBadge
                  level={CHIP_LEVEL[level]}
                  className="h-6 min-w-9 text-xs"
                />
              ) : (
                <span className="text-ink-soft">{t("noLevel")}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto space-y-2">
        <p className="text-xs leading-snug text-ink-soft">
          {lastTest ? `${t("lastTest", { date: lastTest })} · ` : null}
          {t("estimate")}
        </p>
        <Link
          href={
            context === "home" && summary.hasData
              ? "/dashboard"
              : "/placement-test"
          }
          className="pressable flex min-h-12 items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover-fine:bg-[color-mix(in_srgb,var(--accent)_82%,var(--ink))]"
        >
          {context === "home" && summary.hasData
            ? t("toDashboard")
            : summary.hasData
              ? t("retake")
              : t("takeTest")}
        </Link>
      </div>
    </div>
  );
}

/** A globe drawn from a circle and meridians, the classic passport emblem. */
function Globe() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="32" cy="32" r="26" />
      <ellipse cx="32" cy="32" rx="11" ry="26" />
      <path d="M6 32h52M10 19h44M10 45h44M32 6v52" />
    </svg>
  );
}

/** The e-passport symbol: a chip inside a rounded frame. */
function Chip() {
  return (
    <svg
      viewBox="0 0 28 18"
      className="h-4 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="1" width="26" height="16" rx="3" />
      <circle cx="14" cy="9" r="4" />
      <path d="M1 9h9M18 9h9" />
    </svg>
  );
}
