"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import { MoreDialog } from "./MoreDialog";
import { PRIMARY_NAV, hrefOf, isActive } from "./nav-items";

const tabClassName = (active: boolean) =>
  cx(
    "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
    active
      ? "text-cover before:absolute before:top-0 before:h-[3px] before:w-8 before:rounded-b-sm before:bg-current dark:text-foil"
      : "text-ink-soft",
  );

/** Mobile navigation, within thumb reach. */
export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-sheet pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map(({ key, icon }) => {
          const href = hrefOf(key);
          const active = isActive(pathname, href);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={tabClassName(active)}
              >
                <Icon name={icon} />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <MoreDialog tabClassName={tabClassName} />
        </li>
      </ul>
    </nav>
  );
}
