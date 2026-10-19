"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { canAccess } from "@/lib/access/tiers";
import { useTier } from "@/lib/access/useTier";
import type { CefrLevel } from "@/lib/content/schemas/common";

/** A lock beside content the learner's plan does not open. Cosmetic: the server filters. */
export function LockMark({ level }: { level: CefrLevel }) {
  const t = useTranslations("Locked");
  const tier = useTier();
  if (tier === undefined || canAccess(tier, level)) return null;
  return (
    <span className="inline-flex items-center text-ink-soft">
      <Icon name="lock" className="size-4" />
      <span className="sr-only">{t("mark")}</span>
    </span>
  );
}
