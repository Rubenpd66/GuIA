"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { BankState } from "@/lib/content/useBank";

/** Placeholder while a content bank loads, or a retry button if it failed. */
export function BankStatus({ state }: { state: BankState<unknown> }) {
  const t = useTranslations("Bank");
  if (state.status === "error")
    return (
      <div
        role="alert"
        className="max-w-md space-y-3 rounded-control bg-sheet p-4"
      >
        <p>{t("error")}</p>
        <Button onClick={state.retry}>{t("retry")}</Button>
      </div>
    );
  return (
    <div role="status" className="h-24 max-w-md rounded-control bg-hairline">
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
