import { beforeAll, describe, expect, it } from "vitest";
import type { Attempt } from "@/lib/progress/schema";
import {
  daysBetween,
  localDay,
  minutesThisWeek,
  shiftDay,
  streak,
} from "./activity";

// Spain changes to summer time on the last Sunday of March (29 March 2026).
beforeAll(() => {
  process.env.TZ = "Europe/Madrid";
});

const at = (iso: string) => new Date(iso).getTime();
const done = (start: string, end: string): Attempt => ({
  id: start,
  part: "core-grammar",
  mode: "study",
  startedAt: at(start),
  finishedAt: at(end),
  correct: 1,
  total: 1,
});

describe("local days", () => {
  it("uses the local date, not UTC", () => {
    // 23:30 UTC on 31 January is already 1 February in Madrid.
    expect(localDay(at("2026-01-31T23:30:00Z"))).toBe("2026-02-01");
  });

  it("steps over the daylight saving change", () => {
    expect(shiftDay("2026-03-29", -1)).toBe("2026-03-28");
    expect(shiftDay("2026-03-28", 1)).toBe("2026-03-29");
    expect(shiftDay("2026-03-31", 1)).toBe("2026-04-01");
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});

describe("streak", () => {
  const days = ["2026-03-27", "2026-03-28", "2026-03-29", "2026-03-30"].map(
    (day) => done(`${day}T08:00:00Z`, `${day}T08:10:00Z`),
  );

  it("counts consecutive days across the clock change", () => {
    expect(streak(days, at("2026-03-30T20:00:00Z"))).toBe(4);
  });

  it("keeps the streak alive until the day is over", () => {
    expect(streak(days, at("2026-03-31T10:00:00Z"))).toBe(4);
    expect(streak(days, at("2026-04-01T10:00:00Z"))).toBe(0);
  });

  it("breaks on a missed day", () => {
    const gap = days.filter((_, i) => i !== 1);
    expect(streak(gap, at("2026-03-30T20:00:00Z"))).toBe(2);
    expect(streak([], at("2026-03-30T20:00:00Z"))).toBe(0);
  });
});

describe("minutesThisWeek", () => {
  it("adds the time since Monday and caps each attempt at an hour", () => {
    const attempts = [
      // Sunday the week before: ignored.
      done("2026-03-29T09:00:00Z", "2026-03-29T09:30:00Z"),
      // Monday 30 March: 20 minutes.
      done("2026-03-30T09:00:00Z", "2026-03-30T09:20:00Z"),
      // Tuesday: a tab left open for three hours counts as one.
      done("2026-03-31T09:00:00Z", "2026-03-31T12:00:00Z"),
    ];
    expect(minutesThisWeek(attempts, at("2026-04-01T10:00:00Z"))).toBe(80);
  });
});
