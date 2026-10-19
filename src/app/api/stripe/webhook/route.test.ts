import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "whsec_test";
const USER = "4f0f7d6e-2b1a-4c3d-9e8f-1a2b3c4d5e6f";
const retrieve = vi.fn();
const upsert = vi.fn();
let selectResult: { data: unknown; error: unknown };

const real = new Stripe("sk_test_dummy");
vi.mock("@/lib/stripe/server", () => ({
  stripeServer: () => ({
    webhooks: real.webhooks,
    subscriptions: { retrieve },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => selectResult }) }),
      upsert,
    }),
  }),
}));

const { POST } = await import("./route");

function signed(type: string, object: unknown) {
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type,
    data: { object },
  });
  const header = real.webhooks.generateTestHeaderString({
    payload,
    secret: SECRET,
  });
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": header },
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
    vi.spyOn(console, "error").mockImplementation(() => {});
    retrieve.mockReset();
    upsert.mockReset().mockResolvedValue({ error: null });
    retrieve.mockResolvedValue({
      id: "sub_old",
      status: "canceled",
      cancel_at_period_end: false,
      customer: "cus_1",
      metadata: { user_id: USER },
      items: {
        data: [
          {
            price: { lookup_key: "sello_b1_month" },
            current_period_end: 1893456000,
          },
        ],
      },
    });
  });

  it("asks Stripe to retry when the current row cannot be read, instead of overwriting it", async () => {
    selectResult = {
      data: null,
      error: { code: "08006", message: "connection failure" },
    };
    const response = await POST(
      signed("customer.subscription.deleted", { id: "sub_old" }),
    );
    expect(response.status).toBe(500);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("writes the row when there is none", async () => {
    selectResult = { data: null, error: null };
    const response = await POST(
      signed("customer.subscription.deleted", { id: "sub_old" }),
    );
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("rejects a bad signature", async () => {
    const request = signed("customer.subscription.deleted", { id: "sub_old" });
    request.headers.set("stripe-signature", "t=1,v1=bad");
    expect((await POST(request)).status).toBe(400);
  });
});
