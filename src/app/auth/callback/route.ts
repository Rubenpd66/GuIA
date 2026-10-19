import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { safeNext } from "@/lib/auth/redirect";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Where Supabase sends people back after Google sign-in, an email confirmation, a magic link
 * or a password reset. PKCE links carry `code`; older-style email links carry `token_hash`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const locale =
    searchParams.get("locale") === "en" ? "en" : routing.defaultLocale;
  const signIn = locale === "en" ? "/en/sign-in" : "/es/acceso";
  const next = safeNext(
    searchParams.get("next"),
    locale === "en" ? "/en/account" : "/es/cuenta",
  );
  const supabase = await supabaseServer();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("missing code") };

  return NextResponse.redirect(
    new URL(error ? `${signIn}?error=link` : next, origin),
  );
}
