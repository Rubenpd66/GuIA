import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link } from "@/i18n/navigation";
import { TIER_LEVEL, tierFor } from "@/lib/access/tiers";
import type { CefrLevel } from "@/lib/content/schemas/common";

/**
 * Stands where paid content would be. `data-paywall` is what the pages' structured data names
 * as the part that is not free.
 */
export function LockedNotice({
  level,
  count,
  compact = false,
}: {
  level: CefrLevel;
  count?: number;
  /** One line, for lists that repeat it (e.g. under each phrase function). */
  compact?: boolean;
}) {
  const t = useTranslations("Locked");
  const plan = TIER_LEVEL[tierFor(level)];
  if (compact)
    return (
      <p
        data-paywall
        className="flex flex-wrap items-center gap-2 text-ink-soft"
      >
        <Icon name="lock" className="size-4" />
        {count === undefined ? t("title", { plan }) : t("more", { count })}{" "}
        <Link
          href={{ pathname: "/plans", query: { nivel: level } }}
          className="font-semibold text-ink underline"
        >
          {t("cta")}
        </Link>
      </p>
    );
  return (
    <section
      data-paywall
      aria-labelledby={`locked-${level}`}
      className="max-w-[68ch] space-y-3 rounded-card border border-dashed border-line bg-surface p-5"
    >
      <h2
        id={`locked-${level}`}
        className="flex items-center gap-2 text-lg font-bold"
      >
        <Icon name="lock" className="size-5" />
        {t("title", { plan })}
      </h2>
      <p className="text-ink-soft">
        {count === undefined ? t("body") : t("more", { count })}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <ButtonLink
          variant="primary"
          href={{ pathname: "/plans", query: { nivel: level } }}
        >
          {t("cta")}
        </ButtonLink>
        <Link href="/sign-in" className="font-semibold underline">
          {t("signIn")}
        </Link>
      </div>
    </section>
  );
}
