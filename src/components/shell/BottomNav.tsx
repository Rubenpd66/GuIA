"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import { MoreDialog } from "./MoreDialog";
import { MORE_NAV, PRIMARY_NAV, hrefOf, isActive } from "./nav-items";

const tabClassName = (active: boolean) =>
  cx(
    "pressable flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
    active ? "text-accent" : "text-ink-soft",
  );

/** Mobile navigation, within thumb reach. */
export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const primaryIndex = PRIMARY_NAV.findIndex(({ key }) =>
    isActive(pathname, hrefOf(key)),
  );
  const moreActive = MORE_NAV.some(({ key }) =>
    isActive(pathname, hrefOf(key)),
  );
  const activeIndex =
    primaryIndex >= 0 ? primaryIndex : moreActive ? PRIMARY_NAV.length : -1;

  return (
    <nav
      aria-label={t("mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <span
        data-nav-indicator
        aria-hidden="true"
        className="nav-indicator absolute top-0 left-0 h-[3px] w-1/5"
        style={{
          transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          opacity: activeIndex < 0 ? 0 : 1,
        }}
      >
        <span className="mx-auto block h-full w-8 rounded-b-sm bg-accent" />
      </span>
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
