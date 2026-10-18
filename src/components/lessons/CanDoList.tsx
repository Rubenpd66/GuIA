import { getLocale, getTranslations } from "next-intl/server";
import { localized } from "@/lib/content/localize";
import type { CanDo } from "@/lib/content/schemas/lessons";

/** "I can…" objectives with their skill; the caller passes them already ordered by skill. */
export async function CanDoList({ items }: { items: CanDo[] }) {
  const [t, locale] = await Promise.all([
    getTranslations("CanDo"),
    getLocale(),
  ]);
  return (
    <ul className="divide-y divide-hairline border-y border-hairline">
      {items.map((canDo) => (
        <li key={canDo.id} className="py-3">
          <p className="text-sm font-semibold text-ink-soft">
            {t(canDo.skill)}
          </p>
          <p className="mt-0.5">{localized(canDo.text, locale)}</p>
        </li>
      ))}
    </ul>
  );
}
