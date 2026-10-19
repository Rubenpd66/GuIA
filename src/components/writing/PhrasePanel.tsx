"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { localized } from "@/lib/content/localize";

type RegisterFilter = "all" | "informal" | "formal";

/** Useful phrases for study mode; neutral phrases show under both registers. */
export function PhrasePanel({
  phrases,
  initialRegister,
}: {
  phrases: FunctionalPhrase[];
  initialRegister: RegisterFilter;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [register, setRegister] = useState<RegisterFilter>(initialRegister);
  const shown = phrases.filter(
    (phrase) =>
      register === "all" ||
      phrase.register === "neutral" ||
      phrase.register === register,
  );
  const functions = [...new Set(shown.map((phrase) => phrase.function))];

  return (
    <details className="rounded-card bg-surface p-4">
      <summary className="min-h-11 cursor-pointer content-center font-semibold">
        {t("Writing.trainer.phrases")}
      </summary>
      <div className="mt-3 space-y-4">
        <div>
          <label
            htmlFor="phrase-register"
            className="block text-sm font-semibold"
          >
            {t("Writing.trainer.register")}
          </label>
          <select
            id="phrase-register"
            value={register}
            onChange={(event) =>
              setRegister(event.target.value as RegisterFilter)
            }
            className="mt-1 min-h-11 rounded-control border-[1.5px] border-line bg-canvas px-3"
          >
            <option value="all">{t("Writing.trainer.registerAll")}</option>
            <option value="informal">{t("Vocab.informal")}</option>
            <option value="formal">{t("Vocab.formal")}</option>
          </select>
        </div>
        {functions.map((fn) => (
          <section key={fn} className="space-y-1">
            <h3 className="text-sm font-bold">{t(`Functional.${fn}`)}</h3>
            <ul className="space-y-1">
              {shown
                .filter((phrase) => phrase.function === fn)
                .map((phrase) => (
                  <li key={phrase.id} className="text-sm">
                    <span lang="en" className="font-semibold">
                      {phrase.phrase}
                    </span>{" "}
                    <span lang="en" className="text-ink-soft">
                      {phrase.example}
                    </span>
                    {phrase.note ? (
                      <span className="block text-ink-soft">
                        {localized(phrase.note, locale)}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
