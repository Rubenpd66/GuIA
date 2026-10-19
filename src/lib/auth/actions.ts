"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { SITE } from "@/config/site";
import { cancelStripeFor } from "@/lib/stripe/cancel";
import { safeNext } from "@/lib/auth/redirect";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/** What a form shows after submitting: never says whether an email has an account. */
export type AuthResult =
  | { status: "idle" }
  | { status: "ok"; message: AuthMessage }
  | { status: "error"; message: AuthMessage };

export type AuthMessage =
  | "signedIn"
  | "checkEmail"
  | "passwordUpdated"
  | "accountDeleted"
  | "invalid"
  | "credentials"
  | "consent"
  | "weakPassword"
  | "rateLimited"
  | "unavailable"
  | "failed";

const Email = z.email().max(254);
// Supabase's minimum is 6; asking for 10 protects learners' accounts a little more.
const Password = z.string().min(10).max(72);
const Locale = z.enum(["es", "en"]);

async function callbackUrl(locale: "es" | "en", next: string) {
  const origin = (await headers()).get("origin") ?? SITE.url;
  const params = new URLSearchParams({ locale, next });
  return `${origin}/auth/callback?${params}`;
}

const accountPath = (locale: "es" | "en") =>
  locale === "en" ? "/en/account" : "/es/cuenta";

function failure(error: { status?: number; code?: string } | null): AuthResult {
  if (error?.status === 429) return { status: "error", message: "rateLimited" };
  if (error?.code === "weak_password")
    return { status: "error", message: "weakPassword" };
  return { status: "error", message: "failed" };
}

export async function signInWithPassword(
  _prev: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (!supabaseConfigured) return { status: "error", message: "unavailable" };
  const parsed = z
    .object({ email: Email, password: z.string().min(1).max(72) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: "invalid" };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    return error.status === 429
      ? { status: "error", message: "rateLimited" }
      : { status: "error", message: "credentials" };
  return { status: "ok", message: "signedIn" };
}

export async function signUp(
  _prev: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (!supabaseConfigured) return { status: "error", message: "unavailable" };
  const parsed = z
    .object({
      email: Email,
      password: Password,
      locale: Locale,
      next: z.string().max(200).optional(),
      consent: z.literal("on"),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: form.get("consent") === "on" ? "invalid" : "consent",
    };
  const { email, password, locale, next } = parsed.data;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await callbackUrl(
        locale,
        safeNext(next, accountPath(locale)),
      ),
      // Recorded once, for the consent register (not used for authorisation).
      data: { consented_at: new Date().toISOString(), locale },
    },
  });
  // An existing email gets the same answer as a new one.
  return error ? failure(error) : { status: "ok", message: "checkEmail" };
}

export async function sendMagicLink(
  _prev: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (!supabaseConfigured) return { status: "error", message: "unavailable" };
  const parsed = z
    .object({ email: Email, locale: Locale, next: z.string().max(200).optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: "invalid" };
  const { email, locale, next } = parsed.data;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // A magic link only signs in: new accounts go through the form with consent.
    options: {
      shouldCreateUser: false,
      emailRedirectTo: await callbackUrl(
        locale,
        safeNext(next, accountPath(locale)),
      ),
    },
  });
  // "No such user" is answered like success, so the form does not reveal accounts.
  return error && error.status === 429
    ? { status: "error", message: "rateLimited" }
    : { status: "ok", message: "checkEmail" };
}

export async function requestPasswordReset(
  _prev: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (!supabaseConfigured) return { status: "error", message: "unavailable" };
  const parsed = z
    .object({ email: Email, locale: Locale })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: "invalid" };
  const { email, locale } = parsed.data;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await callbackUrl(locale, `${accountPath(locale)}#password`),
  });
  return error && error.status === 429
    ? { status: "error", message: "rateLimited" }
    : { status: "ok", message: "checkEmail" };
}

export async function updatePassword(
  _prev: AuthResult,
  form: FormData,
): Promise<AuthResult> {
  if (!supabaseConfigured) return { status: "error", message: "unavailable" };
  const parsed = z
    .object({ password: Password })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: "weakPassword" };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { status: "error", message: "failed" };
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  return error ? failure(error) : { status: "ok", message: "passwordUpdated" };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
}

/**
 * Deletes the signed-in learner's account and, through the foreign key, every row of their
 * study data. Sessions are revoked first, since deleting a user does not expire live tokens.
 */
export async function deleteMyAccount(): Promise<AuthResult> {
  const admin = supabaseAdmin();
  if (!admin) return { status: "error", message: "unavailable" };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { status: "error", message: "failed" };
  // A live plan is cancelled first: if that fails, the account stays so billing never outlives it.
  if (!(await cancelStripeFor(userId)))
    return { status: "error", message: "failed" };
  await supabase.auth.signOut({ scope: "global" });
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error
    ? { status: "error", message: "failed" }
    : { status: "ok", message: "accountDeleted" };
}
