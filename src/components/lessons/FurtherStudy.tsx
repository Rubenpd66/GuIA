import { getTranslations } from "next-intl/server";
import { BOOKS } from "@/config/books";
import type { Reference } from "@/lib/content/schemas/lessons";

/** "Further study": the matching units of the reference books. Book and unit only. */
export async function FurtherStudy({
  references,
}: {
  references: readonly Reference[];
}) {
  if (references.length === 0) return null;
  const t = await getTranslations("Lesson");
  return (
    <aside
      aria-labelledby="further-study"
      className="rounded-card border border-hairline p-5"
    >
      <h2 id="further-study" className="text-lg font-bold">
        {t("furtherStudy")}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">{t("furtherStudyLead")}</p>
      <ul className="mt-3 space-y-1">
        {references.map(({ book, unit }) => (
          <li key={`${book}-${unit}`}>
            {t("unit", { book: BOOKS[book].title, unit })}
          </li>
        ))}
      </ul>
    </aside>
  );
}
