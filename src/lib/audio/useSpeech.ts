"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Script } from "@/lib/content/schemas/listening";
import { pickVoices, planUtterances, type VoiceInfo } from "./plan";
import { useVoiceSettings } from "./settings";

const supportsSpeech = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

// Browsers fill the voice list late and fire `voiceschanged`; keep one stable snapshot.
let voiceCache: SpeechSynthesisVoice[] = [];
function readVoices(): SpeechSynthesisVoice[] {
  if (!supportsSpeech()) return voiceCache;
  const list = window.speechSynthesis.getVoices();
  if (list.length !== voiceCache.length) voiceCache = list;
  return voiceCache;
}
function subscribeVoices(onChange: () => void) {
  if (!supportsSpeech()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

/** The device's voices; empty on the server and while the browser is still loading them. */
export function useVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, readVoices, () => []);
}

export type SpeechStatus = "idle" | "playing" | "paused";

/** Reads scripts aloud with the browser's voices; only one thing speaks at a time. */
export function useSpeech() {
  const voices = useVoices();
  const settings = useVoiceSettings();
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [playingId, setPlayingId] = useState<string | null>(null);
  // A new run id makes events from a cancelled run harmless.
  const run = useRef(0);
  const supported = supportsSpeech();

  const stop = useCallback(() => {
    run.current += 1;
    if (supportsSpeech()) window.speechSynthesis.cancel();
    setStatus("idle");
    setPlayingId(null);
  }, []);

  const play = useCallback(
    (id: string, script: Script, onEnd?: () => void) => {
      if (!supportsSpeech()) return;
      stop();
      const mine = run.current;
      const picked = pickVoices(voices as VoiceInfo[], settings);
      const plan = planUtterances(script);
      plan.forEach((part, i) => {
        const utterance = new SpeechSynthesisUtterance(part.text);
        const choice = part.speaker === "man" ? picked.man : picked.woman;
        utterance.lang = "en-GB";
        utterance.rate = settings.rate;
        utterance.pitch = choice.pitch;
        const voice = voices.find((v) => v.voiceURI === choice.voiceURI);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }
        const done = () => {
          if (run.current !== mine) return;
          if (i === plan.length - 1) {
            setStatus("idle");
            setPlayingId(null);
            onEnd?.();
          }
        };
        utterance.onend = done;
        utterance.onerror = done;
        window.speechSynthesis.speak(utterance);
      });
      setPlayingId(id);
      setStatus("playing");
    },
    [stop, voices, settings],
  );

  const pause = useCallback(() => {
    if (!supportsSpeech()) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (!supportsSpeech()) return;
    window.speechSynthesis.resume();
    setStatus("playing");
  }, []);

  // Leaving the page or the task must silence the voice.
  useEffect(() => stop, [stop]);

  return { supported, voices, status, playingId, play, pause, resume, stop };
}
