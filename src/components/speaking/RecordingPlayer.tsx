"use client";

import { useTranslations } from "next-intl";
import { buttonClasses } from "@/components/ui/button-styles";
import { recordingExtension, type Recording } from "@/lib/speaking/recorder";

/** Plays back one answer; the download is the only way the audio leaves the page. */
export function RecordingPlayer({
  label,
  name,
  recording,
}: {
  label: string;
  name: string;
  recording: Recording | undefined;
}) {
  const t = useTranslations("Speaking.trainer");
  if (!recording)
    return <p className="text-sm text-ink-soft">{t("noRecording")}</p>;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <audio
        controls
        src={recording.url}
        aria-label={label}
        className="w-full max-w-md"
      />
      <a
        href={recording.url}
        download={`sello-${name}.${recordingExtension(recording.mimeType)}`}
        className={buttonClasses("ghost")}
      >
        {t("download")}
      </a>
    </div>
  );
}
