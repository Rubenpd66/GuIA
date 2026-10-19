"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { usePartName } from "@/components/sections/usePartName";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { EXAM_PARTS } from "@/lib/exam/format";
import { STREAK_TO_CLEAR } from "@/lib/progress/progress";
import { saveProgress, useProgress } from "@/lib/progress/useProgress";

/** Mistakes waiting per part, with a way into each trainer's "review mistakes" session. */
export function MistakesBank() {
  const t = useTranslations("Mistakes");
  const partName = usePartName();
  const progress = useProgress();
  const dialog = useRef<HTMLDialogElement>(null);
  const entries = Object.values(progress.mistakes);
  const parts = EXAM_PARTS.map((part) => {
    const mine = entries.filter((entry) => entry.part === part);
    return {
      part,
      count: mine.length,
      onTheWay: mine.filter((entry) => entry.streak > 0).length,
    };
  }).filter((row) => row.count > 0);

  if (parts.length === 0)
    return (
      <section className="max-w-[68ch] space-y-3 rounded-card bg-surface p-6">
        <h2 className="text-xl font-bold">
          {t("emptyTitle")}
        </h2>
        <p>{t("emptyBody", { streak: STREAK_TO_CLEAR })}</p>
      </section>
    );

  return (
    <div className="max-w-[68ch] space-y-6">
      <p>{t("lead", { count: entries.length, streak: STREAK_TO_CLEAR })}</p>
      <ul className="divide-y divide-hairline border-y border-hairline">
        {parts.map((row) => (
          <li
            key={row.part}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <span>
              <span className="block font-semibold">{partName(row.part)}</span>
              <span className="text-sm text-ink-soft">
                {t("counts", { count: row.count, onTheWay: row.onTheWay })}
              </span>
            </span>
            <Link
              href={{
                pathname: "/practice/[part]",
                params: { part: row.part },
              }}
              className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {t("review")}
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={() => dialog.current?.showModal()}>
        {t("clear")}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="mistakes-clear-title"
        className="backdrop:bg-black/40 m-auto max-w-sm rounded-card bg-canvas p-6 text-ink"
      >
        <p id="mistakes-clear-title" className="font-semibold">
          {t("clearConfirm")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => {
              saveProgress({ ...progress, mistakes: {} });
              dialog.current?.close();
            }}
          >
            {t("clearButton")}
          </Button>
          <Button onClick={() => dialog.current?.close()}>{t("cancel")}</Button>
        </div>
      </dialog>
    </div>
  );
}
