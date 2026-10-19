import { describe, expect, it } from "vitest";
import { claimOwner, releaseOwner } from "./owner";

const memoryStore = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

describe("sync owner", () => {
  it("lets the first account and the same account keep the local data", () => {
    const store = memoryStore();
    expect(claimOwner("a", store)).toBe(false);
    expect(claimOwner("a", store)).toBe(false);
  });

  it("reports data that belongs to another account, then hands it over", () => {
    const store = memoryStore();
    claimOwner("a", store);
    expect(claimOwner("b", store)).toBe(true);
    expect(claimOwner("b", store)).toBe(false);
  });

  it("treats released data as anonymous", () => {
    const store = memoryStore();
    claimOwner("a", store);
    releaseOwner(store);
    expect(claimOwner("b", store)).toBe(false);
  });

  it("does nothing when storage is blocked", () => {
    const blocked = {
      getItem: (): string | null => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(claimOwner("a", blocked)).toBe(false);
    expect(() => releaseOwner(blocked)).not.toThrow();
  });
});
