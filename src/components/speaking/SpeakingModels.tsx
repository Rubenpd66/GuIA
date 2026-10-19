"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { useSpeech } from "@/lib/audio/useSpeech";
import type { SpeakingQuestion } from "@/lib/content/schemas/speaking";
import { countWords } from "@/lib/content/text";

/** The B2 and C model answers, segment by segment, with a button to hear each one. */
export function SpeakingModels({
  id,
  question,
  speech,
}: {
  id: string;
  question: SpeakingQuestion;
  speech: ReturnType<typeof useSpeech>;
}) {
  const t = useTranslations("Speaking.trainer");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["b2", "c"] as const).map((level) => {
        const segments = question.models[level].segments;
        const text = segments.map((segment) => segment.text).join(" ");
        const speechId = `${id}:${level}`;
        const playing = speech.playingId === speechId;
        return (
          <section
            key={level}
            aria-label={t(`model.${level}`)}
            className="space-y-3 rounded-page bg-sheet p-4"
          >
            <h3 className="flex flex-wrap items-center justify-between gap-2 font-semibold">
              <span>{t(`model.${level}`)}</span>
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
