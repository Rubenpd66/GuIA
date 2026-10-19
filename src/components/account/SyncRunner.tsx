"use client";

import { useEffect } from "react";
import { supabaseConfigured } from "@/lib/supabase/env";
import { startSync } from "@/lib/sync/engine";

/** Mounts the sync engine once for the whole app; renders nothing. */
export function SyncRunner() {
  useEffect(() => (supabaseConfigured ? startSync() : undefined), []);
  return null;
}
