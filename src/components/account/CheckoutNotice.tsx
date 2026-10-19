"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

/** What the learner sees on coming back from Stripe Checkout (access itself comes from the webhook). */
export function CheckoutNotice() {
  const t = useTranslations("Account.checkout");
  const result = useSearchParams().get("checkout");
  if (result !== "success" && result !== "cancel") return null;
  return (
    <p role="status" className="mb-8 max-w-[68ch] font-semibold">
      {t(result)}
    </p>
  );
}
