"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { getPathname } from "@/i18n/navigation";
import type { AuthResult } from "@/lib/auth/actions";

export const fieldClass =
  "mt-2 min-h-12 w-full rounded-control border-[1.5px] border-line bg-paper px-3";

type Props = {
  action: (prev: AuthResult, form: FormData) => Promise<AuthResult>;
  locale: string;
  submit: string;
  /** Where to go once the action reports success without needing an email step. */
  goToAccount?: boolean;
  /** A same-site path to come back to after signing in (already checked by the page). */
  next?: string;
  children: ReactNode;
};

/** A server-action form with a polite status line; the message never says whether an email exists. */
export function AuthForm({
  action,
  locale,
  submit,
  goToAccount,
  next,
  children,
}: Props) {
  const t = useTranslations("Account.messages");
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    { status: "idle" },
  );
  useEffect(() => {
    // A full load, so banks loaded before signing in are fetched again for this plan.
    if (goToAccount && state.status === "ok")
      window.location.assign(
        next ??
          getPathname({
            href: "/account",
            locale: locale === "en" ? "en" : "es",
          }),
      );
  }, [goToAccount, state, locale, next]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {children}
      <Button type="submit" variant="primary" disabled={pending}>
        {submit}
      </Button>
      <p
        role={state.status === "error" ? "alert" : "status"}
        className={
          state.status === "error"
            ? "font-semibold text-refusal"
            : "text-ink-soft"
        }
      >
        {state.status === "idle" ? null : t(state.message)}
      </p>
    </form>
  );
}
