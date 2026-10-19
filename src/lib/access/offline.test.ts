import { describe, expect, it, vi } from "vitest";
import { clearCachedPages } from "./offline";

describe("clearCachedPages", () => {
  it("drops the service worker's pages cache, where paid pages and banks live", async () => {
    const store = { delete: vi.fn(async () => true) };
    await clearCachedPages(store);
    expect(store.delete).toHaveBeenCalledWith("sello-pages-v1");
  });

  it("never throws, so signing out always finishes", async () => {
    const store = {
      delete: vi.fn(async () => {
        throw new Error("blocked");
      }),
    };
    await expect(clearCachedPages(store)).resolves.toBeUndefined();
  });
});
