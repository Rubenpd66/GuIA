import { describe, expect, it } from "vitest";
import {
  isAdminClaims,
  summarise,
  summariseSubscriptions,
  type AdminUser,
} from "./stats";

const NOW = Date.parse("2026-10-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const user = (
  id: string,
  createdDaysAgo: number,
  seenDaysAgo: number | null,
): AdminUser => ({
  id,
  email: `${id}@example.com`,
  createdAt: new Date(NOW - createdDaysAgo * DAY).toISOString(),
  lastSignInAt:
    seenDaysAgo === null
      ? null
      : new Date(NOW - seenDaysAgo * DAY).toISOString(),
});

describe("summarise", () => {
  it("counts accounts, activity windows and signups per week", () => {
    const stats = summarise(
      [
        user("a", 1, 0),
        user("b", 10, 8),
        user("c", 100, 40),
        user("d", 3, null),
      ],
      ["core-grammar", "reading-1", "core-grammar"],
      NOW,
    );
    expect(stats.total).toBe(4);
    expect(stats.active7).toBe(1);
    expect(stats.active30).toBe(2);
    expect(stats.signupsByWeek).toEqual([2, 1, 0, 0, 0, 0, 0, 0]);
    expect(stats.attemptsByPart).toEqual({ "core-grammar": 2, "reading-1": 1 });
  });
});

describe("isAdminClaims", () => {
  it("trusts app_metadata only", () => {
    expect(isAdminClaims({ app_metadata: { role: "admin" } })).toBe(true);
    expect(isAdminClaims({ user_metadata: { role: "admin" } })).toBe(false);
    expect(isAdminClaims({ app_metadata: { role: "user" } })).toBe(false);
    expect(isAdminClaims(null)).toBe(false);
  });
});

describe("summariseSubscriptions", () => {
  const live = "2030-01-01T00:00:00.000Z";
  const row = (
    tier: "b1" | "b2" | "c1",
    interval: "month" | "year",
    status = "active",
    end = live,
  ) => ({
    tier,
    interval,
    status,
    current_period_end: end,
  });

  it("counts only plans that still grant access and estimates monthly income", () => {
    const stats = summariseSubscriptions(
      [
        row("b1", "month"),
        row("b1", "month"),
        row("c1", "year"),
        row("b2", "month", "canceled"),
        row("b2", "month", "active", "2020-01-01T00:00:00.000Z"),
      ],
      Date.parse("2029-06-01T00:00:00Z"),
    );
    expect(stats.counts.b1.month).toBe(2);
    expect(stats.counts.c1.year).toBe(1);
    expect(stats.counts.b2).toEqual({ month: 0, year: 0 });
    expect(stats.monthlyCents).toBe(2 * 999 + Math.round(19190 / 12));
  });
});
