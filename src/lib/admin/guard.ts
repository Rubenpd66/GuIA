import "server-only";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdminClaims } from "./stats";

/**
 * Every admin page and action starts here. The session is verified against the signing keys
 * (`getClaims`) and the role read from `app_metadata`; anything else gets the 404 page, so
 * the panel's existence is not revealed.
 */
export async function requireAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || !isAdminClaims(data.claims)) notFound();
  return { id: data.claims.sub, email: data.claims.email as string | undefined };
}
