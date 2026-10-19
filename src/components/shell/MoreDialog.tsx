"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import { MORE_NAV, hrefOf, isActive } from "./nav-items";

/**
 * The "More" tab of the bottom bar. A native modal <dialog>: it traps focus, closes with
 * Escape and gives focus back to the button that opened it.
 */
export function MoreDialog({
  tabClassName,
}: {
  tabClassName: (active: boolean) => string;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  const moreActive = MORE_NAV.some(({ key }) =>
    isActive(pathname, hrefOf(key)),
  );

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className={cx("w-full", tabClassName(moreActive))}
      >
        <Icon name="more" />
        <span>{t("more")}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="more-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-card bg-surface p-0 text-ink"
      >
        <div className="px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <h2 id="more-dialog-title" className="text-lg font-bold">
              {t("moreTitle")}
            </h2>
            <IconButton label={t("close")} onClick={close}>
              <Icon name="close" />
            </IconButton>
          </div>
          <ul className="mt-2 divide-y divide-hairline">
            {MORE_NAV.map(({ key, icon }) => {
              const href = hrefOf(key);
              const active = isActive(pathname, href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex min-h-14 items-center gap-4 px-2 text-lg font-medium",
                      active && "text-accent",
                    )}
                  >
                    <Icon name={icon} />
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </>
  );
}
