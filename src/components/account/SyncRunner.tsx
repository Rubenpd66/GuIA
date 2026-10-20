"use client";

import { useEffect } from "react";
import { supabaseConfigured } from "@/lib/supabase/env";

/** Mounts the sync engine once for the whole app; renders nothing. The engine loads on demand. */
export function SyncRunner() {
  useEffect(() => {
    if (!supabaseConfigured) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void import("@/lib/sync/engine").then(({ startSync }) => {
      if (!cancelled) stop = startSync();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
