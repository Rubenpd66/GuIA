import { CEFR_LEVELS } from "@/lib/content/schemas/common";
import { TIERS, tierFor, type Tier } from "./tiers";

export type Viewer =
  | { user: "unknown" }
  | { user: "signedOut" }
  | { user: "signedIn"; tier: Tier };

export type PlanButton =
  "start" | "createAccount" | "subscribe" | "current" | "change" | "included";

/** The button a plan card shows to this viewer; null while we do not know who it is. */
export function buttonFor(card: Tier, viewer: Viewer): PlanButton | null {
  if (viewer.user === "unknown") return null;
  if (card === "free") return "start";
  if (viewer.user === "signedOut") return "createAccount";
  if (viewer.tier === "free") return "subscribe";
  if (viewer.tier === card) return "current";
  return TIERS.indexOf(viewer.tier) > TIERS.indexOf(card)
    ? "included"
    : "change";
}

/** `?nivel=B2` highlights the plan that opens that level; anything unknown highlights nothing. */
export function parseLevelParam(
  value: string | string[] | null | undefined,
): Tier | null {
  const first = (Array.isArray(value) ? value[0] : value)?.toUpperCase();
  const level = CEFR_LEVELS.find((l) => l === first);
  return level ? tierFor(level) : null;
}
