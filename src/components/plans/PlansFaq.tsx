import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const QUESTIONS = [
  "vat",
  "cancel",
  "change",
  "progress",
  "withdrawal",
  "affiliation",
] as const;

/** Native disclosure elements: keyboard and screen-reader support come with the browser. */
export function PlansFaq() {
  const t = useTranslations("Plans.faq");
  return (
    <section aria-labelledby="faq-heading" className="max-w-[68ch] space-y-3">
      <h2 id="faq-heading" className="text-xl font-bold font-semi-expanded">
        {t("title")}
      </h2>
      <div className="border-t border-hairline">
        {QUESTIONS.map((key) => (
          <details key={key} className="group border-b border-hairline py-3">
            <summary className="min-h-12 cursor-pointer py-2 font-semibold">
              {t(`${key}.q`)}
            </summary>
            <p className="prose-reading mt-1">
              {t.rich(`${key}.a`, {
                terms: (chunks) => (
                  <Link href="/terms" className="underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
