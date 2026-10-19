"use client";

import { useTranslations } from "next-intl";
import { AccountLink } from "@/components/account/AccountLink";
import { Wordmark } from "@/components/brand/Wordmark";
import { Icon } from "@/components/icons/Icon";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import {
  MORE_NAV,
  PRIMARY_NAV,
  hrefOf,
  isActive,
  type NavItem,
} from "./nav-items";

/** Desktop navigation: a fixed side column from 1024 px. */
export function SideNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const renderItem = ({ key, icon }: NavItem) => {
    const href = hrefOf(key);
    const active = isActive(pathname, href);
    return (
      <li key={key}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cx(
            "pressable flex min-h-12 items-center gap-3 rounded-control px-3 font-medium",
            active
              ? "bg-canvas text-accent shadow-card"
              : "text-ink-soft hover-fine:bg-hairline hover-fine:text-ink",
          )}
        >
          <Icon name={icon} />
          {t(key)}
        </Link>
      </li>
    );
  };

  return (
    <aside
      style={{ viewTransitionName: "sidenav" }}
      className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-hairline bg-surface px-6 pt-7 pb-5 text-ink lg:flex"
    >
      <Link
        href="/"
        aria-label={t("home")}
        className="mb-10 inline-flex self-start rounded-control"
      >
        <Wordmark className="text-3xl" />
      </Link>
      <nav aria-label={t("mainNav")} className="flex-1">
        <ul className="space-y-1">{PRIMARY_NAV.map(renderItem)}</ul>
        <div className="my-5 h-px bg-hairline" />
        <ul className="space-y-1">{MORE_NAV.map(renderItem)}</ul>
      </nav>
      <AccountLink className="mb-4 inline-flex min-h-12 items-center rounded-control px-3 font-medium text-ink-soft hover-fine:bg-hairline hover-fine:text-ink" />
      <div className="flex items-center justify-between gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </aside>
  );
}
