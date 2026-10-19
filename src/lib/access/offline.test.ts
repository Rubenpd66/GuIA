import { describe, expect, it, vi } from "vitest";
import { clearCachedPages, sessionWatcher } from "./offline";

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

describe("sessionWatcher", () => {
  it("fires when the signed-in user changes or signs out, never on the first report", () => {
    const changed = vi.fn();
    const watch = sessionWatcher(changed);
    watch({ id: "a" });
    watch({ id: "a" });
    expect(changed).not.toHaveBeenCalled();
    watch(null);
    expect(changed).toHaveBeenCalledTimes(1);
    watch({ id: "b" });
    expect(changed).toHaveBeenCalledTimes(2);
  });
});
