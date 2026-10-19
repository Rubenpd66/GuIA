"use client";

import { useSyncExternalStore } from "react";

export type SyncStatus = "syncing" | "synced" | "offline";

let current: SyncStatus = "syncing";
const listeners = new Set<() => void>();

export function setSyncStatus(next: SyncStatus) {
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener());
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => "syncing",
  );
}
