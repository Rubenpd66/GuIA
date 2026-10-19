import { describe, expect, it } from "vitest";
import { buttonFor, parseLevelParam, type Viewer } from "./plan-button";
import type { Tier } from "./tiers";

const signedIn = (tier: Tier): Viewer => ({ user: "signedIn", tier });

describe("buttonFor", () => {
  it("shows nothing until the viewer is known", () => {
    expect(buttonFor("b1", { user: "unknown" })).toBeNull();
    expect(buttonFor("free", { user: "unknown" })).toBeNull();
  });

  it("always offers the free plan as a start", () => {
    for (const viewer of [
      { user: "signedOut" } as Viewer,
      signedIn("free"),
      signedIn("c1"),
    ])
      expect(buttonFor("free", viewer)).toBe("start");
  });

  it("asks a visitor to create an account for any paid plan", () => {
    for (const card of ["b1", "b2", "c1"] as const)
      expect(buttonFor(card, { user: "signedOut" })).toBe("createAccount");
  });

  it("lets a signed-in learner without a plan subscribe", () => {
    for (const card of ["b1", "b2", "c1"] as const)
      expect(buttonFor(card, signedIn("free"))).toBe("subscribe");
  });

  it("marks the current plan, the ones it includes and the ones to change to", () => {
    expect(buttonFor("b2", signedIn("b2"))).toBe("current");
    expect(buttonFor("b1", signedIn("b2"))).toBe("included");
    expect(buttonFor("c1", signedIn("b2"))).toBe("change");
  });
});

describe("parseLevelParam", () => {
  it("maps a level to its plan, case-insensitively, first value first", () => {
    expect(parseLevelParam("B2")).toBe("b2");
    expect(parseLevelParam("b2")).toBe("b2");
    expect(parseLevelParam(["C1", "A2"])).toBe("c1");
  });

  it("ignores anything else", () => {
    for (const value of ["Z9", "", null, undefined, [], ["nope"]])
      expect(parseLevelParam(value as string)).toBeNull();
  });
});
