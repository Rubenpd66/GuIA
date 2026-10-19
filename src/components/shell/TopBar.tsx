import { getTranslations } from "next-intl/server";
import { AccountLink } from "@/components/account/AccountLink";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { Wordmark } from "@/components/passport/Wordmark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Link } from "@/i18n/navigation";

/** Mobile header: brand, language and theme. */
export async function TopBar() {
  const t = await getTranslations("Nav");
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-hairline bg-paper px-2 sm:px-4 lg:hidden">
      <Link
        href="/"
        aria-label={t("home")}
        className="inline-flex rounded-control px-2 text-cover dark:text-foil"
      >
        <Wordmark />
      </Link>
      <div className="flex items-center">
        <Link
          href="/plans"
          className="inline-flex min-h-12 items-center rounded-control px-2 text-sm font-medium max-[479px]:hidden"
        >
          {t("plans")}
        </Link>
        <AccountLink className="inline-flex min-h-12 items-center rounded-control px-2 text-sm font-medium max-[359px]:hidden" />
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
