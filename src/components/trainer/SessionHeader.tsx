"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { formatClock } from "@/lib/trainer/config";

type SessionHeaderProps = {
  counter: string;
  remaining?: number;
  progress: ReactNode;
  actions?: ReactNode;
};

/** Counter, timer and segmented progress bar above every question. */
export function SessionHeader({
  counter,
  remaining,
  progress,
  actions,
}: SessionHeaderProps) {
  const t = useTranslations("Trainer");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">{counter}</p>
        <div className="flex items-center gap-3">
          {remaining !== undefined ? (
            <p className="flex items-center gap-1.5 font-semibold tabular-nums">
              <Icon name="clock" className="size-5" />
              <span className="sr-only">
                {t("timeLeftLabel", { time: formatClock(remaining) })}
              </span>
              <span aria-hidden="true">{formatClock(remaining)}</span>
            </p>
          ) : null}
          {actions}
        </div>
      </div>
      {progress}
    </div>
  );
}
