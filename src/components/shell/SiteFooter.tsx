import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const LINK =
  "inline-block py-2 underline decoration-1 underline-offset-4 hover:decoration-2";

/** The non-affiliation notice appears on every page. */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="border-t border-hairline px-4 py-8 sm:px-6 lg:px-12">
      <p className="max-w-[68ch] text-sm text-ink-soft">{t("disclaimer")}</p>
      <ul className="mt-3 flex flex-wrap gap-x-6 text-sm">
        <li>
          <Link href="/legal-notice" className={LINK}>
            {t("legalNotice")}
          </Link>
        </li>
        <li>
          <Link href="/privacy" className={LINK}>
            {t("privacy")}
          </Link>
        </li>
      </ul>
    </footer>
  );
}
