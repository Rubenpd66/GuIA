import { describe, expect, it, vi } from "vitest";
import { createRowCache } from "./row-cache";

describe("createRowCache", () => {
  it("shares one read per user within the time limit", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ data: { tier: "b1" }, error: null });
    const read = createRowCache(fetch, 30_000);
    expect(await read("u1", 0)).toEqual({ row: { tier: "b1" } });
    expect(await read("u1", 10_000)).toEqual({ row: { tier: "b1" } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reads again once the time limit has passed", async () => {
    const fetch = vi.fn().mockResolvedValue({ data: null, error: null });
    const read = createRowCache(fetch, 30_000);
    await read("u1", 0);
    await read("u1", 30_001);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reports a failed read as unknown and does not keep it", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "down" } })
      .mockResolvedValueOnce({ data: { tier: "b2" }, error: null });
    const read = createRowCache(fetch, 30_000);
    expect(await read("u1", 0)).toBeNull();
    expect(await read("u1", 1)).toEqual({ row: { tier: "b2" } });
  });

  it("reports a thrown read as unknown too", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("offline"));
    const read = createRowCache(fetch, 30_000);
    expect(await read("u1", 0)).toBeNull();
  });
});
