import { describe, expect, it } from "vitest";
import { lookupKeyFor, planFromLookupKey } from "./plans";

describe("lookup keys", () => {
  it.each([
    ["b1", "month"],
    ["b1", "year"],
    ["b2", "month"],
    ["b2", "year"],
    ["c1", "month"],
    ["c1", "year"],
  ] as const)("round-trips %s %s", (tier, interval) => {
    const key = lookupKeyFor(tier, interval);
    expect(key).toBe(`sello_${tier}_${interval}`);
    expect(planFromLookupKey(key)).toEqual({ tier, interval });
  });

  it.each([
    null,
    undefined,
    "",
    "sello_a2_month",
    "sello_b1_week",
    "other_b1_month",
    "sello_b1_month_extra",
  ])("rejects %s", (key) => {
    expect(planFromLookupKey(key)).toBeNull();
  });
});
