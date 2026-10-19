import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
let rowResult: { data: unknown; error: unknown };

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "http://localhost:3000" }),
}));
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href }: { href: string }) => `/es${href}`,
}));
vi.mock("@/lib/supabase/env", () => ({ supabaseConfigured: true }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({
    auth: {
      getClaims: async () => ({
        data: { claims: { sub: "user-1", email: "a@b.c" } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => rowResult }) }),
    }),
  }),
}));
vi.mock("./server", () => ({
  stripeServer: () => ({
    prices: { list: async () => ({ data: [{ id: "price_1" }] }) },
    checkout: { sessions: { create } },
    billingPortal: { sessions: { create } },
  }),
}));

const { startCheckout } = await import("./actions");

describe("startCheckout", () => {
  beforeEach(() => {
    create.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("stops when the learner's plan cannot be read, rather than offering a second one", async () => {
    rowResult = { data: null, error: { code: "08006", message: "down" } };
    expect(await startCheckout("b1", "month", "es")).toEqual({
      status: "error",
      message: "failed",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects arguments outside the catalogue", async () => {
    rowResult = { data: null, error: null };
    expect(await startCheckout("a2" as "b1", "month", "es")).toEqual({
      status: "error",
      message: "unavailable",
    });
    expect(create).not.toHaveBeenCalled();
  });
});
