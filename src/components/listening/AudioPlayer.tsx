"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { Script } from "@/lib/content/schemas/listening";
import type { useSpeech } from "@/lib/audio/useSpeech";
import { EXAM_FORMAT } from "@/lib/exam/format";
import { playsLeft } from "@/lib/trainer/listening";
import type { TrainerMode } from "@/lib/trainer/reducer";

/** What every task needs to play its recordings; one speech instance per session. */
export type AudioControl = {
  speech: ReturnType<typeof useSpeech>;
  mode: TrainerMode;
  /** Plays used so far, by recording id. */
  plays: Record<string, number>;
  onPlay: (id: string) => void;
};

type AudioPlayerProps = {
  id: string;
  script: Script;
  audio: AudioControl;
  label?: string;
};

/** Play, pause and replay one recording; in exam mode it can be played twice at most. */
export function AudioPlayer({ id, script, audio, label }: AudioPlayerProps) {
  const t = useTranslations("Listening.trainer");
  const { speech, mode, plays } = audio;
  const played = plays[id] ?? 0;
  const left = playsLeft(mode, played);
  const mine = speech.playingId === id;
  const status = mine ? speech.status : "idle";
  const hasEnglish = speech.voices.some((v) => /^en([-_]|$)/i.test(v.lang));

  if (!speech.supported)
    return (
      <p role="status" className="rounded-control bg-sheet px-4 py-3">
        {t("unsupported")}
      </p>
    );

  return (
    <div className="space-y-2 rounded-control border-[1.5px] border-hairline p-3">
      <div className="flex flex-wrap items-center gap-3">
        {label ? <span className="font-semibold">{label}</span> : null}
        {status === "playing" ? (
          <Button onClick={speech.pause}>{t("pause")}</Button>
        ) : status === "paused" ? (
          <Button variant="primary" onClick={speech.resume}>
            {t("resume")}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={left === 0}
            onClick={() => {
              audio.onPlay(id);
              speech.play(id, script);
            }}
          >
            {played > 0 ? t("playAgain") : t("play")}
          </Button>
        )}
        <span role="status" className="text-sm text-ink-soft">
          {status === "playing"
            ? t("playing")
            : status === "paused"
              ? t("paused")
              : left === 0
                ? t("noPlaysLeft")
                : mode === "exam"
                  ? t("playsUsed", {
                      used: played,
                      max: EXAM_FORMAT.listening.maxPlays,
                    })
                  : ""}
        </span>
      </div>
      {speech.voices.length > 0 && !hasEnglish ? (
        <p className="text-sm text-ink-soft">{t("noEnglishVoice")}</p>
      ) : null}
    </div>
  );
}
