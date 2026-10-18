import { describe, expect, it } from "vitest";
import { MORE_NAV, PRIMARY_NAV, isActive } from "./nav-items";

describe("isActive", () => {
  it("matches the section and its sub-pages", () => {
    expect(isActive("/practice", "/practice")).toBe(true);
    expect(isActive("/practice/[part]", "/practice")).toBe(true);
  });

  it("does not match paths that only share a prefix", () => {
    expect(isActive("/practice-old", "/practice")).toBe(false);
    expect(isActive("/", "/dashboard")).toBe(false);
  });
});

describe("navigation items", () => {
  it("list nine distinct sections: four primary and five under More", () => {
    expect(PRIMARY_NAV).toHaveLength(4);
    expect(MORE_NAV).toHaveLength(5);
    expect(
      new Set([...PRIMARY_NAV, ...MORE_NAV].map((item) => item.key)).size,
    ).toBe(9);
  });
});
