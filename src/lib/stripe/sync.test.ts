import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  rowFromSubscription,
  shouldReplace,
  subscriptionIdOf,
  type SubscriptionUpsert,
} from "./sync";

const USER = "4f0f7d6e-2b1a-4c3d-9e8f-1a2b3c4d5e6f";
const NOW = Date.parse("2029-06-01T00:00:00Z");

function sub(
  over: Record<string, unknown> = {},
  lookupKey: string | null = "sello_b2_year",
) {
  return {
    id: "sub_1",
    status: "active",
    cancel_at_period_end: false,
    customer: "cus_1",
    metadata: { user_id: USER },
    items: {
      data: [
        { price: { lookup_key: lookupKey }, current_period_end: 1893456000 },
      ],
    },
    ...over,
  } as unknown as Stripe.Subscription;
}

function row(over: Partial<SubscriptionUpsert> = {}): SubscriptionUpsert {
  return {
    user_id: USER,
    tier: "b2",
    interval: "year",
    status: "active",
    current_period_end: "2030-01-01T00:00:00.000Z",
    cancel_at_period_end: false,
    stripe_customer_id: "cus_1",
    stripe_subscription_id: "sub_1",
    updated_at: new Date(NOW).toISOString(),
    ...over,
  };
}

describe("rowFromSubscription", () => {
  it("maps a live yearly B2 subscription", () => {
    expect(rowFromSubscription(sub(), NOW)).toEqual(row());
  });

  it("reads the customer id from an expanded customer", () => {
    expect(
      rowFromSubscription(sub({ customer: { id: "cus_1" } }), NOW)
        ?.stripe_customer_id,
    ).toBe("cus_1");
  });

  it.each([
    ["no user id", sub({ metadata: {} })],
    ["a user id that is not a uuid", sub({ metadata: { user_id: "nope" } })],
    ["an unknown lookup key", sub({}, "sello_a2_month")],
    ["no lookup key", sub({}, null)],
  ])("ignores %s", (_name, input) => {
    expect(rowFromSubscription(input, NOW)).toBeNull();
  });
});

describe("shouldReplace", () => {
  const live = {
    stripe_subscription_id: "sub_old",
    tier: "b1" as const,
    status: "active",
    current_period_end: "2030-01-01T00:00:00.000Z",
  };

  it("writes when there is no row", () => {
    expect(shouldReplace(null, row(), NOW)).toBe(true);
  });

  it("updates the same subscription, even to canceled", () => {
    expect(
      shouldReplace(
        { ...live, stripe_subscription_id: "sub_1" },
        row({ status: "canceled" }),
        NOW,
      ),
    ).toBe(true);
  });

  it("keeps a live newer subscription when an old one ends", () => {
    expect(shouldReplace(live, row({ status: "canceled" }), NOW)).toBe(false);
  });

  it("replaces a finished subscription with a live one", () => {
    expect(shouldReplace({ ...live, status: "canceled" }, row(), NOW)).toBe(
      true,
    );
  });

  it("replaces a row whose period is over", () => {
    expect(
      shouldReplace(
        { ...live, current_period_end: "2029-01-01T00:00:00.000Z" },
        row({ status: "canceled" }),
        NOW,
      ),
    ).toBe(true);
  });
});

describe("subscriptionIdOf", () => {
  const event = (type: string, object: unknown) =>
    ({ type, data: { object } }) as unknown as Stripe.Event;

  it("reads a completed subscription checkout", () => {
    expect(
      subscriptionIdOf(
        event("checkout.session.completed", {
          mode: "subscription",
          subscription: "sub_1",
        }),
      ),
    ).toBe("sub_1");
  });

  it("ignores a payment-mode checkout", () => {
    expect(
      subscriptionIdOf(
        event("checkout.session.completed", {
          mode: "payment",
          subscription: null,
        }),
      ),
    ).toBeNull();
  });

  it("reads subscription events", () => {
    expect(
      subscriptionIdOf(event("customer.subscription.deleted", { id: "sub_2" })),
    ).toBe("sub_2");
  });

  it("ignores other events", () => {
    expect(subscriptionIdOf(event("invoice.paid", { id: "in_1" }))).toBeNull();
  });
});
