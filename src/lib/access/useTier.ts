"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth/useUser";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createRowCache } from "./row-cache";
import { describePlan, tierFromRow, type PlanState, type SubscriptionRow } from "./rule";
import type { Tier } from "./tiers";

type OwnRow = SubscriptionRow & {
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
};

// Shared by every lock mark and plan card on the page; see createRowCache for the rules.
const readRow = createRowCache(
  (userId) =>
    supabaseBrowser()
      .from("subscriptions")
      .select(
        "tier, status, current_period_end, cancel_at_period_end, stripe_customer_id",
      )
      .eq("user_id", userId)
      .maybeSingle<OwnRow>(),
  30_000,
);

function useOwnRow():
  | { userId: string; row: OwnRow | null; at: number }
  | null
  | undefined {
  const user = useUser();
  // `at` is read here, in the effect, because rendering must not call Date.now().
  const [loaded, setLoaded] = useState<{
    userId: string;
    row: OwnRow | null;
    at: number;
  }>();

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void readRow(user.id, Date.now()).then((result) => {
      // A failed read leaves the plan unknown: nothing is offered rather than the wrong thing.
      if (alive && result)
        setLoaded({ userId: user.id, row: result.row, at: Date.now() });
    });
    return () => {
      alive = false;
    };
  }, [user]);

  if (user === undefined) return undefined;
  if (user === null) return null;
  return loaded?.userId === user.id ? loaded : undefined;
}

/**
 * The signed-in learner's tier, for lock icons only: content is filtered on the server.
 * Undefined while it is not known yet.
 */
export function useTier(): Tier | undefined {
  const own = useOwnRow();
  if (own === undefined) return undefined;
  return own === null ? "free" : tierFromRow(own.row, own.at);
}

/** The learner's plan as the account page shows it; undefined until known. */
export function useSubscriptionState():
  | { tier: Tier; state: PlanState; endsOn: string | null; hasCustomer: boolean }
  | undefined {
  const own = useOwnRow();
  if (own === undefined) return undefined;
  if (own === null)
    return { tier: "free", state: "none", endsOn: null, hasCustomer: false };
  return {
    tier: tierFromRow(own.row, own.at),
    state: describePlan(own.row, own.at),
    endsOn: own.row?.current_period_end ?? null,
    hasCustomer: Boolean(own.row?.stripe_customer_id),
  };
}
