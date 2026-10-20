import { describe, expect, it } from "vitest";
import {
  WAIVER,
  checkoutCustomer,
  checkoutOrPortal,
  needsCancelling,
  subscriptionsToCancel,
} from "./checkout";

const NOW = Date.parse("2029-06-01T00:00:00Z");
const live = {
  tier: "b1" as const,
  status: "active",
  current_period_end: "2030-01-01T00:00:00.000Z",
};

describe("checkoutOrPortal", () => {
  it("sends a new learner to checkout", () => {
    expect(checkoutOrPortal(null, NOW)).toBe("checkout");
  });

  it("sends a live subscriber to the portal", () => {
    expect(checkoutOrPortal(live, NOW)).toBe("portal");
  });

  it("sends a finished subscriber back to checkout", () => {
    expect(checkoutOrPortal({ ...live, status: "canceled" }, NOW)).toBe(
      "checkout",
    );
    expect(
      checkoutOrPortal(
        { ...live, current_period_end: "2029-01-01T00:00:00.000Z" },
        NOW,
      ),
    ).toBe("checkout");
  });
});

describe("checkoutCustomer", () => {
  it("lets checkout create the customer only on payment", () => {
    expect(checkoutCustomer(null, "a@b.c")).toEqual({
      customer_email: "a@b.c",
    });
  });

  it("reuses a known customer", () => {
    expect(checkoutCustomer("cus_1", "a@b.c")).toEqual({
      customer: "cus_1",
      customer_update: { address: "auto", name: "auto" },
    });
  });
});

describe("needsCancelling", () => {
  it("is false without a row or a subscription id", () => {
    expect(needsCancelling(null)).toBe(false);
    expect(
      needsCancelling({ status: "active", stripe_subscription_id: null }),
    ).toBe(false);
  });

  it("is true while Stripe may still bill", () => {
    expect(
      needsCancelling({ status: "active", stripe_subscription_id: "sub_1" }),
    ).toBe(true);
    expect(
      needsCancelling({ status: "past_due", stripe_subscription_id: "sub_1" }),
    ).toBe(true);
  });

  it("is false for finished subscriptions", () => {
    expect(
      needsCancelling({ status: "canceled", stripe_subscription_id: "sub_1" }),
    ).toBe(false);
    expect(
      needsCancelling({
        status: "incomplete_expired",
        stripe_subscription_id: "sub_1",
      }),
    ).toBe(false);
  });
});

describe("WAIVER", () => {
  it("links the terms and states the loss of the withdrawal right", () => {
    const es = WAIVER.es("https://x/es/terminos");
    expect(es).toContain("](https://x/es/terminos)");
    expect(es).toContain("14 días");
    expect(WAIVER.en("https://x/en/terms")).toContain("14-day");
  });
});

describe("subscriptionsToCancel", () => {
  const row = { status: "active", stripe_subscription_id: "sub_row" };

  it("cancels the row's subscription and every other live one, each once", () => {
    expect(
      subscriptionsToCancel(row, [
        { id: "sub_row", status: "active" },
        { id: "sub_tab2", status: "trialing" },
        { id: "sub_old", status: "canceled" },
        { id: "sub_dead", status: "incomplete_expired" },
      ]),
    ).toEqual(["sub_row", "sub_tab2"]);
  });

  it("still finds a live one when the row is already cancelled", () => {
    expect(
      subscriptionsToCancel({ ...row, status: "canceled" }, [
        { id: "sub_tab2", status: "past_due" },
      ]),
    ).toEqual(["sub_tab2"]);
  });

  it("has nothing to cancel without a row or live subscriptions", () => {
    expect(subscriptionsToCancel(null, [])).toEqual([]);
  });
});
