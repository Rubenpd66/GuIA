"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth/useUser";
import { supabaseBrowser } from "@/lib/supabase/client";
import { tierFromRow, type SubscriptionRow } from "./rule";
import type { Tier } from "./tiers";

/**
 * The signed-in learner's tier, for lock icons only: content is filtered on the server.
 * Undefined while it is not known yet.
 */
export function useTier(): Tier | undefined {
  const user = useUser();
  const [paid, setPaid] = useState<{ userId: string; tier: Tier }>();

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void supabaseBrowser()
      .from("subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle<SubscriptionRow>()
      .then(({ data }) => {
        if (alive)
          setPaid({ userId: user.id, tier: tierFromRow(data, Date.now()) });
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (user === undefined) return undefined;
  if (user === null) return "free";
  return paid?.userId === user.id ? paid.tier : undefined;
}
