import { describe, expect, it } from "vitest";
import {
  entriesVisibleTo,
  isVisible,
  tierFromRow,
  visibleTo,
  type SubscriptionRow,
} from "./rule";

const NOW = Date.parse("2026-10-21T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const row = (patch: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  tier: "b2",
  status: "active",
  current_period_end: new Date(NOW + DAY).toISOString(),
  ...patch,
});

describe("tierFromRow", () => {
  it("gives the free tier without a subscription", () => {
    expect(tierFromRow(null, NOW)).toBe("free");
  });

  it("keeps the tier while the subscription is live, including a failed payment being retried", () => {
    for (const status of ["active", "trialing", "past_due"])
      expect(tierFromRow(row({ status }), NOW)).toBe("b2");
  });

  it("drops to free for any other status", () => {
    for (const status of [
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ])
      expect(tierFromRow(row({ status }), NOW)).toBe("free");
  });

  it("drops to free when the paid period is over, even before the row is updated", () => {
    expect(
      tierFromRow(
        row({ current_period_end: new Date(NOW - 1000).toISOString() }),
        NOW,
      ),
    ).toBe("free");
  });

  it("drops to free when the period end cannot be read", () => {
    expect(tierFromRow(row({ current_period_end: "soon" }), NOW)).toBe("free");
  });
});

describe("visibility", () => {
  const a2 = { id: "a2", cefrLevel: "A2" as const };
  const b1 = { id: "b1", cefrLevel: "B1" as const };
  const b1Placement = {
    id: "b1-placement",
    cefrLevel: "B1" as const,
    placement: true as const,
  };

  it("shows free learners A2 and the placement pool only", () => {
    expect(visibleTo("free", [a2, b1, b1Placement]).map((e) => e.id)).toEqual([
      "a2",
      "b1-placement",
    ]);
    expect(isVisible("free", b1)).toBe(false);
  });

  it("shows a tier its own level and below", () => {
    expect(visibleTo("b1", [a2, b1, b1Placement])).toHaveLength(3);
  });

  it("leaves nothing of a locked task for a mistakes-bank session after a downgrade", () => {
    expect(visibleTo("free", [b1])).toEqual([]);
  });

  it("filters lessons, entries and phrases by their level", () => {
    const entries = (["A2", "B1", "B2"] as const).map((level) => ({ level }));
    expect(entriesVisibleTo("b1", entries).map((e) => e.level)).toEqual([
      "A2",
      "B1",
    ]);
  });
});
