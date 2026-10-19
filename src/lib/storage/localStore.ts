"use client";

import { useSyncExternalStore } from "react";

/**
 * One value kept in localStorage and shared by every component that reads it. Blocked or
 * corrupt storage falls back to `fallback`, and a save still reaches this page view.
 */
export function createLocalStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  fallback: T,
) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T } = { raw: null, value: fallback };
  // Only used when storage is blocked, so the page still reflects what was saved.
  let memory: string | null | undefined;

  const readRaw = (): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory ?? null;
    }
  };
  const read = (): T => {
    const raw = readRaw();
    if (raw !== cache.raw) cache = { raw, value: parse(raw) };
    return cache.value;
  };
  const subscribe = (onChange: () => void) => {
    listeners.add(onChange);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  };
  /** null removes the value. */
  const save = (value: T | null) => {
    const raw = value === null ? null : JSON.stringify(value);
    try {
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
    } catch {
      memory = raw;
    }
    listeners.forEach((listener) => listener());
  };
  const useValue = (): T =>
    useSyncExternalStore(subscribe, read, () => fallback);

  return { read, save, useValue };
}

/** JSON.parse that returns undefined instead of throwing. */
export function parseJson(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
