"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser client, loaded on demand: the Supabase library is large and most visits never
 * sign in, so the shell does not ship it with every page.
 */
export function loadSupabaseBrowser(): Promise<SupabaseClient> {
  return import("./client").then(({ supabaseBrowser }) => supabaseBrowser());
}
