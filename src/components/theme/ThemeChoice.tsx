"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";

const OPTIONS = ["system", "light", "dark"] as const;

const subscribe = () => () => {};

/** Radio group for the settings page. The stored choice is only known in the browser. */
export function ThemeChoice() {
  const t = useTranslations("Theme");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <fieldset>
      <legend className="sr-only">{t("choose")}</legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <label
            key={option}
            className={cx(
              "inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-[1.5px] px-4 font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
              current === option
                ? "border-cover bg-cover text-on-cover dark:border-foil"
                : "border-line",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={current === option}
              onChange={() => setTheme(option)}
              className="sr-only"
            />
            {t(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
