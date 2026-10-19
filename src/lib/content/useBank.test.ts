import { afterEach, describe, expect, it, vi } from "vitest";
import { forgetBanks, loadBank } from "./useBank";

describe("loadBank", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    forgetBanks();
  });

  it("asks the server again after the banks are forgotten (a new session)", async () => {
    const fetchMock = vi.fn(async () => Response.json({ grammar: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await loadBank("mock");
    await loadBank("mock");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    forgetBanks();
    await loadBank("mock");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
