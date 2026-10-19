"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { useSpeech } from "@/lib/audio/useSpeech";
import type { SpeakingQuestion } from "@/lib/content/schemas/speaking";
import type { CefrLevel } from "@/lib/content/schemas/common";
import { countWords } from "@/lib/content/text";
import { modelLabelKey } from "@/lib/trainer/writing";

/** The B2 and C model answers, segment by segment, with a button to hear each one. */
export function SpeakingModels({
  id,
  question,
  level,
  speech,
}: {
  id: string;
  question: SpeakingQuestion;
  level: CefrLevel;
  speech: ReturnType<typeof useSpeech>;
}) {
  const t = useTranslations("Speaking.trainer");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["b2", "c"] as const).map((model) => {
        const segments = question.models[model].segments;
        const text = segments.map((segment) => segment.text).join(" ");
        const speechId = `${id}:${model}`;
        const playing = speech.playingId === speechId;
        return (
          <section
            key={model}
            aria-label={t(`model.${modelLabelKey(model, level)}`)}
            className="space-y-3 rounded-card bg-surface p-4"
          >
            <h3 className="flex flex-wrap items-center justify-between gap-2 font-semibold">
              <span>{t(`model.${modelLabelKey(model, level)}`)}</span>
              <span className="text-sm font-normal text-ink-soft tabular-nums">
                {t("modelWords", { count: countWords(text) })}
              </span>
            </h3>
            <ol className="space-y-2">
              {segments.map((segment, i) => (
                <li key={i}>
                  <span className="block text-xs font-bold tracking-wide text-ink-soft uppercase">
                    {t(`role.${segment.role}`)}
                  </span>
                  <span lang="en" className="prose-reading">
                    {segment.text}
                  </span>
                </li>
              ))}
            </ol>
            {speech.supported ? (
              <Button
                variant="ghost"
                onClick={() =>
                  playing
                    ? speech.stop()
                    : speech.play(speechId, [{ speaker: "woman", text }])
                }
              >
                {playing ? t("stopModel") : t("listenModel")}
              </Button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
