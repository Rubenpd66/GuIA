import { describe, expect, it } from "vitest";
import { MAX_DRAFTS, clearDrafts, readDraft, saveDraft } from "./drafts";

const memoryStore = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

const throwingStore = {
  getItem: (): string | null => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

describe("drafts", () => {
  it("saves, reads and clears drafts by item key", () => {
    const store = memoryStore();
    saveDraft("w2-a#0", "Hello there", 1, store);
    saveDraft("w2-a#1", "Second", 2, store);
    expect(readDraft("w2-a#0", store)).toBe("Hello there");
    clearDrafts(["w2-a#0"], store);
    expect(readDraft("w2-a#0", store)).toBe("");
    expect(readDraft("w2-a#1", store)).toBe("Second");
  });

  it("drops a draft saved as empty text", () => {
    const store = memoryStore();
    saveDraft("k", "text", 1, store);
    saveDraft("k", "", 2, store);
    expect(store.getItem("sello:writing-drafts")).toBe("{}");
  });

  it("keeps only the most recent drafts", () => {
    const store = memoryStore();
    for (let i = 0; i <= MAX_DRAFTS; i++) saveDraft(`k${i}`, "x", i, store);
    expect(readDraft("k0", store)).toBe("");
    expect(readDraft(`k${MAX_DRAFTS}`, store)).toBe("x");
  });

  it("survives blocked storage and corrupt data", () => {
    expect(() => saveDraft("k", "text", 1, throwingStore)).not.toThrow();
    expect(readDraft("k", throwingStore)).toBe("");
    expect(() => clearDrafts(["k"], throwingStore)).not.toThrow();
    const store = memoryStore();
    store.setItem("sello:writing-drafts", "{broken");
    expect(readDraft("k", store)).toBe("");
    store.setItem("sello:writing-drafts", '{"k":{"text":5}}');
    expect(readDraft("k", store)).toBe("");
  });

  it("does not throw when there is no localStorage at all", () => {
    expect(readDraft("k")).toBe("");
  });
});
