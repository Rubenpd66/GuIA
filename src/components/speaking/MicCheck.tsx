"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useRecorder } from "@/lib/speaking/useRecorder";
import { RecordingPlayer } from "./RecordingPlayer";

const TEST_MS = 3000;

/** Records three seconds so the learner can check the microphone before a session. */
export function MicCheck() {
  const t = useTranslations();
  const { status, recordings, recorder } = useRecorder();

  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setTimeout(() => recorder.stop(), TEST_MS);
    return () => window.clearTimeout(id);
  }, [status, recorder]);

  return (
    <div className="space-y-3">
      <Button
        onClick={() => void recorder.start("mic-test")}
        disabled={status === "recording" || status === "requesting"}
      >
        {t("SpeakingPage.micTest")}
      </Button>
      <p role="status" className="text-sm">
        {status === "recording"
          ? t("SpeakingPage.micTesting")
          : status === "denied"
            ? t("Speaking.trainer.micDenied")
            : status === "unavailable"
              ? t("Speaking.trainer.micUnavailable")
              : status === "requesting"
                ? t("Speaking.trainer.micRequesting")
                : ""}
      </p>
      {recordings["mic-test"] ? (
        <RecordingPlayer
          label={t("SpeakingPage.micResult")}
          name="mic-test"
          recording={recordings["mic-test"]}
        />
      ) : null}
    </div>
  );
}
