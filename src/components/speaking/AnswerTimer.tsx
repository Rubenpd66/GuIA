"use client";

import { useTranslations } from "next-intl";
import { formatClock } from "@/lib/trainer/config";

/** Countdown bar for preparing or answering; screen readers hear it at the start, at 10 s and at zero. */
export function AnswerTimer({
  label,
  remainingMs,
  totalMs,
}: {
  label: string;
  remainingMs: number;
  totalMs: number;
}) {
  const t = useTranslations("Speaking.trainer");
  const announcement =
    remainingMs <= 0
      ? t("announce.timeUp")
      : remainingMs <= 10_000
        ? t("announce.tenLeft")
        : t("announce.start", { seconds: Math.round(totalMs / 1000) });
  const share = Math.max(0, Math.min(1, remainingMs / totalMs));
  return (
    <div className="space-y-2">
      <p className="flex items-baseline justify-between gap-3 font-semibold">
        <span>{label}</span>
        <span aria-hidden="true" className="text-2xl tabular-nums">
          {formatClock(remainingMs)}
        </span>
      </p>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-hairline"
      >
        <div
          className="h-full rounded-full bg-cover dark:bg-foil"
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
