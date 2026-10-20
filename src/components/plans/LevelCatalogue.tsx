"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type KeyboardEvent } from "react";
import { LockMark } from "@/components/access/LockMark";
import { Link } from "@/i18n/navigation";
import type { levelCatalogue } from "@/lib/access/figures";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/content/levels";
import { cx } from "@/lib/cx";
import type { ExamPart } from "@/lib/exam/format";

type Catalogue = ReturnType<typeof levelCatalogue>;

/**
 * What each level holds: titles and counts only (the shop window), with a lock beside the
 * levels the learner's plan does not open. Tabs follow the ARIA pattern: arrows move focus.
 */
export function LevelCatalogue({
  catalogue,
}: {
  catalogue: Record<CefrLevel, Catalogue>;
}) {
  const t = useTranslations("Plans.catalogue");
  const parts = useTranslations("Parts");
  const [level, setLevel] = useState<CefrLevel>("A2");
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: KeyboardEvent, current: number) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next =
      CEFR_LEVELS[(current + step + CEFR_LEVELS.length) % CEFR_LEVELS.length]!;
    setLevel(next);
    tabs.current[next]?.focus();
  }

  const data = catalogue[level];
  const partEntries = Object.entries(data.tasksByPart) as [ExamPart, number][];

  return (
    <section aria-labelledby="catalogue-heading" className="space-y-5">
      <h2 id="catalogue-heading" className="text-xl font-bold">
        {t("title")}
      </h2>
      <div
        role="tablist"
        aria-label={t("title")}
        className="flex flex-wrap gap-2"
      >
        {CEFR_LEVELS.map((value, i) => (
          <button
            key={value}
            ref={(el) => {
              tabs.current[value] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={level === value}
            aria-controls="catalogue-panel"
            tabIndex={level === value ? 0 : -1}
            onClick={() => setLevel(value)}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={cx(
              "pressable inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] px-5 font-semibold",
              level === value
                ? "border-accent bg-accent text-on-accent"
                : "border-line",
            )}
          >
            {value}
            <LockMark level={value} />
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="catalogue-panel"
        aria-labelledby={`tab-${level}`}
        className="grid gap-8 md:grid-cols-3"
      >
        <div>
          <h3 className="font-bold">
            {t("lessons", { count: data.lessons.length })}
          </h3>
          <ul className="mt-2">
            {data.lessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link
                  href={{
                    pathname: "/grammar/[slug]",
                    params: { slug: lesson.slug },
                  }}
                  className="inline-block py-2 underline"
                >
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">
            {t("vocabulary", { count: data.groups.length })}
          </h3>
          <ul className="mt-2">
            {data.groups.map((group) => (
              <li key={group.slug}>
                <Link
                  href={{
                    pathname: "/vocabulary/[slug]",
                    params: { slug: group.slug },
                  }}
                  className="inline-block py-2 underline"
                >
                  {group.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">{t("tasks")}</h3>
          <ul className="mt-2">
            {partEntries.map(([part, count]) => (
              <li
                key={part}
                className="flex justify-between gap-4 border-b border-hairline py-2"
              >
                <span>{parts(part)}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
