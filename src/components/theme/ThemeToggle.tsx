"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Icon } from "@/components/icons/Icon";
import { IconButton } from "@/components/ui/IconButton";

/** Flips between light and dark. The icon is chosen by CSS, so server and client markup match. */
export function ThemeToggle() {
  const t = useTranslations("Theme");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <IconButton
      label={t("toggle")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Icon name="moon" className="dark:hidden" />
      <Icon name="sun" className="hidden dark:block" />
    </IconButton>
  );
}
