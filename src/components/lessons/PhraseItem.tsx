import { useLocale, useTranslations } from "next-intl";
import { LevelBadge } from "@/components/content/LevelBadge";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { localized } from "@/lib/content/localize";

/** A functional phrase with its level, register, example and note. */
export function PhraseItem({ phrase }: { phrase: FunctionalPhrase }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <li className="py-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span lang="en" className="font-semibold">
          {phrase.phrase}
        </span>
        <LevelBadge level={phrase.level} />
        {phrase.register !== "neutral" ? (
          <span className="text-sm text-ink-soft">
            {t(`Vocab.${phrase.register}`)}
          </span>
        ) : null}
      </p>
      <p lang="en" className="prose-reading mt-1">
        {phrase.example}
      </p>
      {phrase.note ? (
        <p className="mt-1 text-sm text-ink-soft">
          {localized(phrase.note, locale)}
        </p>
      ) : null}
    </li>
  );
}
