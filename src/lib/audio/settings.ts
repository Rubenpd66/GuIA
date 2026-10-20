"use client";

import { useSyncExternalStore } from "react";
import * as z from "zod/mini";

export const RATES = [0.8, 1, 1.2] as const;

const VoiceSettings = z.object({
  rate: z
    .number()
    .check(z.refine((n) => (RATES as readonly number[]).includes(n))),
  man: z.optional(z.string()),
  woman: z.optional(z.string()),
});
export type VoiceSettings = z.infer<typeof VoiceSettings>;

const DEFAULTS: VoiceSettings = { rate: 1 };
const STORAGE_KEY = "sello:listening-voice";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: VoiceSettings } = {
  raw: null,
  value: DEFAULTS,
};

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Anything unreadable or out of range falls back to the defaults. */
export function parseVoiceSettings(raw: string | null): VoiceSettings {
  if (!raw) return DEFAULTS;
  try {
    const result = VoiceSettings.safeParse(JSON.parse(raw));
    return result.success ? result.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function getSnapshot(): VoiceSettings {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, value: parseVoiceSettings(raw) };
  return cache.value;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveVoiceSettings(settings: VoiceSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Blocked storage: the choice lasts until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

export function useVoiceSettings(): VoiceSettings {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULTS);
}
