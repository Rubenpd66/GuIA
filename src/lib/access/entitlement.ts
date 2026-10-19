import "server-only";
import { cache } from "react";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { tierFromRow, type SubscriptionRow } from "./rule";
import type { Tier } from "./tiers";

/**
 * The tier of whoever made this request, checked once per request. It reads the session, so
 * every caller must sit inside <Suspense>. Without accounts, a session or a readable row, the
 * answer is the free tier: a failure never unlocks anything.
 */
export const getEntitlement = cache(async (): Promise<Tier> => {
  if (!supabaseConfigured) return "free";
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return "free";
  const { data: row, error } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionRow>();
  if (error) {
    console.warn("sello: could not read the subscription", error.message);
    return "free";
  }
  return tierFromRow(row, Date.now());
});
