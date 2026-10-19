"use client";

import { useSyncExternalStore } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";

/** Who is signed in on this device, for the interface only (the server checks for itself). */
export type SessionUser = { id: string; email: string | undefined };

// undefined: not known yet; null: signed out.
let current: SessionUser | null | undefined;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || !supabaseConfigured) return;
  started = true;
  // Fires INITIAL_SESSION straight away, then on every sign-in, sign-out and refresh.
  supabaseBrowser().auth.onAuthStateChange((_event, session) => {
    const next = session?.user
      ? { id: session.user.id, email: session.user.email }
      : null;
    if (next?.id === current?.id && next?.email === current?.email) {
      if (current !== undefined) return;
    }
    current = next;
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

/** The signed-in user, null when signed out, undefined while unknown or on the server. */
export function useUser(): SessionUser | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => (supabaseConfigured ? current : null),
    () => undefined,
  );
}

/** For non-React code (the sync engine). */
export function onUserChange(listener: (user: SessionUser | null) => void) {
  return subscribe(() => {
    if (current !== undefined) listener(current);
  });
}
