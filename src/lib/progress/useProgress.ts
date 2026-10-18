"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, parseProgress } from "./progress";
import type { Progress } from "./schema";

const STORAGE_KEY = "sello:progress";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Progress } = {
  raw: null,
  value: EMPTY_PROGRESS,
};

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Progress {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, value: parseProgress(raw) };
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

/** Saves progress and updates every component that reads it. Fails silently if storage is blocked. */
export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or blocked storage: progress lives only for this page view.
  }
  listeners.forEach((listener) => listener());
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  listeners.forEach((listener) => listener());
}

/** The learner's progress; empty on the server and during the first render. */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_PROGRESS);
}

/** The latest stored progress, read at the moment it is needed (e.g. when a session ends). */
export function readProgress(): Progress {
  return getSnapshot();
}
