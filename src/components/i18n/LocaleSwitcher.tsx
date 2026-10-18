"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buttonClasses } from "@/components/ui/button-styles";
import { cx } from "@/lib/cx";

type LocaleSwitcherProps = { variant?: "compact" | "full" };

/**
 * Links to the same page in each language. Plain links, so they work without JavaScript
 * and search engines can follow them.
 */
export function LocaleSwitcher({ variant = "compact" }: LocaleSwitcherProps) {
  const t = useTranslations("Locale");
  const current = useLocale();
  const pathname = usePathname();
  const params = useParams();
  // The pathname and params always belong to the current route, so they match.
  const href = { pathname, params } as never;

  return (
    <nav aria-label={t("label")}>
      <ul className="flex gap-1">
        {routing.locales.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={href}
                locale={locale}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                aria-label={variant === "compact" ? t(locale) : undefined}
                className={
                  variant === "compact"
                    ? cx(
                        "inline-flex min-h-12 min-w-12 items-center justify-center rounded-control px-2 text-sm font-semibold",
                        active
                          ? "underline decoration-2 underline-offset-[6px]"
                          : "hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]",
                      )
                    : buttonClasses(active ? "primary" : "secondary")
                }
              >
                {variant === "compact" ? t(`${locale}Short`) : t(locale)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
