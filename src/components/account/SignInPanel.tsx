"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import {
  requestPasswordReset,
  sendMagicLink,
  signInWithPassword,
  signUp,
} from "@/lib/auth/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AuthForm, fieldClass } from "./AuthForm";

function Field({
  form,
  name,
  type,
  label,
  autoComplete,
  minLength,
}: {
  form: string;
  name: string;
  type: string;
  label: string;
  autoComplete: string;
  minLength?: number;
}) {
  const id = `${form}-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        className={fieldClass}
      />
    </div>
  );
}

/** The ways in: Google, email and password, magic link, new account and password reset. */
export function SignInPanel() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const linkError = useSearchParams().get("error") === "link";

  function google() {
    const params = new URLSearchParams({
      locale,
      next: locale === "en" ? "/en/account" : "/es/cuenta",
    });
    void supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?${params}` },
    });
  }

  return (
    <div className="max-w-[44ch] space-y-10">
      {linkError ? (
        <p role="alert" className="font-semibold text-refusal">
          {t("linkError")}
        </p>
      ) : null}
      <Button onClick={google}>{t("google")}</Button>
      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-lg font-bold">
          {t("signInTitle")}
        </h2>
        <div className="mt-3">
          <AuthForm
            action={signInWithPassword}
            locale={locale}
            submit={t("signIn")}
            goToAccount
          >
            <Field
              form="in"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
            />
            <Field
              form="in"
              name="password"
              type="password"
              label={t("password")}
              autoComplete="current-password"
            />
          </AuthForm>
        </div>
      </section>
      <section aria-labelledby="magic-heading">
        <h2 id="magic-heading" className="text-lg font-bold">
          {t("magicTitle")}
        </h2>
        <p className="mt-1 text-ink-soft">{t("magicLead")}</p>
        <div className="mt-3">
          <AuthForm
            action={sendMagicLink}
            locale={locale}
            submit={t("magicSubmit")}
          >
            <Field
              form="magic"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
            />
          </AuthForm>
        </div>
      </section>
      <section aria-labelledby="signup-heading">
        <h2 id="signup-heading" className="text-lg font-bold">
          {t("signUpTitle")}
        </h2>
        <div className="mt-3">
          <AuthForm action={signUp} locale={locale} submit={t("signUp")}>
            <Field
              form="up"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
            />
            <Field
              form="up"
              name="password"
              type="password"
              label={t("newPassword")}
              autoComplete="new-password"
              minLength={10}
            />
            <p className="text-sm text-ink-soft">{t("passwordHint")}</p>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-1.5 size-5"
              />
              <span>
                {t.rich("consent", {
                  privacy: (chunks) => (
                    <Link href="/privacy" className="underline">
                      {chunks}
                    </Link>
                  ),
                  terms: (chunks) => (
                    <Link href="/terms" className="underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          </AuthForm>
        </div>
      </section>
      <section aria-labelledby="reset-heading">
        <h2 id="reset-heading" className="text-lg font-bold">
          {t("resetTitle")}
        </h2>
        <div className="mt-3">
          <AuthForm
            action={requestPasswordReset}
            locale={locale}
            submit={t("resetSubmit")}
          >
            <Field
              form="reset"
              name="email"
              type="email"
              label={t("email")}
              autoComplete="email"
            />
          </AuthForm>
        </div>
      </section>
    </div>
  );
}
