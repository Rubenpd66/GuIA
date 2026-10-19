"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  RATES,
  saveVoiceSettings,
  useVoiceSettings,
} from "@/lib/audio/settings";
import { useSpeech } from "@/lib/audio/useSpeech";
import type { Script } from "@/lib/content/schemas/listening";

const SAMPLE: Script = [
  { speaker: "woman", text: "Hello, this is a test of the woman's voice." },
  {
    speaker: "man",
    text: "And this is the man's voice. Can you hear the difference?",
  },
];

const RATE_KEYS = { 0.8: "slow", 1: "normal", 1.2: "fast" } as const;

const SELECT =
  "min-h-12 w-full max-w-xs rounded-control border-[1.5px] border-line bg-canvas px-3";

/** Speed and voices for the Listening trainers, with a button to hear them. */
export function VoiceSettings() {
  const t = useTranslations("Settings");
  const settings = useVoiceSettings();
  const speech = useSpeech();
  const english = speech.voices.filter((v) => /^en([-_]|$)/i.test(v.lang));

  if (!speech.supported) return <p>{t("unsupported")}</p>;

  const voiceSelect = (role: "man" | "woman") => (
    <label className="block space-y-1">
      <span className="font-semibold">
        {t(role === "man" ? "voiceMan" : "voiceWoman")}
      </span>
      <select
        value={settings[role] ?? ""}
        onChange={(event) =>
          saveVoiceSettings({
            ...settings,
            [role]: event.target.value || undefined,
          })
        }
        className={SELECT}
      >
        <option value="">{t("automatic")}</option>
        {english.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-5">
      <p>{t("voiceLead")}</p>
      <label className="block space-y-1">
        <span className="font-semibold">{t("rate")}</span>
        <select
          value={settings.rate}
          onChange={(event) =>
            saveVoiceSettings({ ...settings, rate: Number(event.target.value) })
          }
          className={SELECT}
        >
          {RATES.map((rate) => (
            <option key={rate} value={rate}>
              {t(`rates.${RATE_KEYS[rate]}`)}
            </option>
          ))}
        </select>
      </label>
      {voiceSelect("man")}
      {voiceSelect("woman")}
      {english.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("noVoices")}</p>
      ) : null}
      {speech.status === "idle" ? (
        <Button onClick={() => speech.play("sample", SAMPLE)}>
          {t("test")}
        </Button>
      ) : (
        <Button onClick={speech.stop}>{t("stopTest")}</Button>
      )}
    </div>
  );
}
