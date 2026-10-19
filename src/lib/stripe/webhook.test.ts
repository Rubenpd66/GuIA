import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { isGoneUser } from "./sync";

describe("isGoneUser", () => {
  it("is true for a foreign key violation (the account was deleted)", () => {
    expect(isGoneUser({ code: "23503" })).toBe(true);
  });

  it("is false for other errors and for none", () => {
    expect(isGoneUser({ code: "42501" })).toBe(false);
    expect(isGoneUser(null)).toBe(false);
  });
});

describe("webhook signature", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test";
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type: "customer.subscription.updated",
    data: { object: { id: "sub_1" } },
  });

  it("accepts a payload signed with the secret", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(stripe.webhooks.constructEvent(payload, header, secret).id).toBe(
      "evt_1",
    );
  });

  it("rejects a tampered payload", () => {
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(() =>
      stripe.webhooks.constructEvent(payload + " ", header, secret),
    ).toThrow();
  });
});
