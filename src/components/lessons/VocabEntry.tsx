import { useLocale, useTranslations } from "next-intl";
import { LevelBadge } from "@/components/content/LevelBadge";
import type { VocabularyEntry } from "@/lib/content/schemas/lessons";
import { localized } from "@/lib/content/localize";

/** One vocabulary entry in full: definition, examples, collocations, synonyms, false friend. */
export function VocabEntry({ entry }: { entry: VocabularyEntry }) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <li key={entry.id} lang="en" className="py-5">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xl font-bold">{entry.headword}</span>
        <span lang={locale} className="text-sm text-ink-soft italic">
          {t(`Vocab.${entry.pos}`)}
        </span>
        <LevelBadge level={entry.level} className="h-6 min-w-8 text-xs" />
        {entry.register && entry.register !== "neutral" ? (
          <span lang={locale} className="text-sm text-ink-soft">
            {t(`Vocab.${entry.register}`)}
          </span>
        ) : null}
      </p>
      <p className="prose-reading mt-2">{entry.definition}</p>
      <ul className="prose-reading mt-2 space-y-1 text-ink-soft italic">
        {entry.examples.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
      {entry.collocations?.length ? (
        <p className="mt-3 text-sm">
          <span lang={locale} className="font-semibold">
            {t("Vocab.collocations")}:{" "}
          </span>
          {entry.collocations.join(", ")}
        </p>
      ) : null}
      {entry.synonyms?.length ? (
        <p className="mt-1 text-sm">
          <span lang={locale} className="font-semibold">
            {t("Vocab.synonyms")}:{" "}
          </span>
          {entry.synonyms.join(", ")}
        </p>
      ) : null}
      {entry.falseFriend ? (
        <div
          lang={locale}
          className="mt-3 rounded-control border-l-[3px] border-reward-ink bg-surface px-4 py-3"
        >
          <p className="font-semibold text-reward-ink">
            {t("Vocab.falseFriend")}:{" "}
            {t("Vocab.looksLike", { spanish: entry.falseFriend.spanish })}
          </p>
          <p className="mt-1 text-ink-soft">
            {localized(entry.falseFriend.trap, locale)}
          </p>
        </div>
      ) : null}
    </li>
  );
}
