import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * A client with the secret key: it bypasses RLS, so it only runs on the server, only after
 * the caller's identity and rights have been checked, and only for what RLS cannot express
 * (deleting an auth user, the admin panel). The key lives only in Vercel's environment.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
