"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AnnotatedText } from "@/lib/content/schemas/writing";
import { localized } from "@/lib/content/localize";
import { countWords } from "@/lib/content/text";
import type { CefrLevel } from "@/lib/content/schemas/common";
import { annotatedSegments, modelLabelKey } from "@/lib/trainer/writing";

const MARK =
  "rounded-sm bg-[color-mix(in_srgb,var(--foil)_35%,transparent)] px-0.5 text-ink";

/** The B2 and C model answers, with numbered highlights that match the notes below each text. */
export function ModelAnswers({
  models,
  level,
}: {
  models: { b2: AnnotatedText; c: AnnotatedText };
  level: CefrLevel;
}) {
  const t = useTranslations("Writing.trainer");
  const locale = useLocale();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["b2", "c"] as const).map((model) => {
        const text = models[model];
        return (
          <section
            key={model}
            aria-label={t(`model.${modelLabelKey(model, level)}`)}
            className="space-y-3 rounded-page bg-sheet p-4"
          >
            <h3 className="flex flex-wrap justify-between gap-2 font-semibold">
              <span>{t(`model.${modelLabelKey(model, level)}`)}</span>
              <span className="text-sm font-normal text-ink-soft tabular-nums">
                {t("modelWords", { count: countWords(text.text) })}
              </span>
            </h3>
            <p lang="en" className="prose-reading whitespace-pre-line">
              {annotatedSegments(text).map((segment, i) =>
                segment.annotation === undefined ? (
                  segment.text
                ) : (
                  <mark key={i} className={MARK}>
                    {segment.text}
                    <sup className="ml-0.5 font-sans text-xs font-bold">
                      {segment.annotation + 1}
                    </sup>
                  </mark>
                ),
              )}
            </p>
            {text.annotations.length > 0 ? (
              <ol className="space-y-2 text-sm">
                {text.annotations.map((annotation, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold tabular-nums">{i + 1}.</span>
                    <span>
                      <span className="font-semibold">
                        {t(`kind.${annotation.kind}`)}:
                      </span>{" "}
                      <span lang="en" className="italic">
                        {annotation.quote}
                      </span>
                      {" — "}
                      {localized(annotation.note, locale)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
