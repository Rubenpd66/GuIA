"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useUser } from "@/lib/auth/useUser";
import { supabaseConfigured } from "@/lib/supabase/env";

/** "Sign in" or "Account" depending on the session; hidden until known so the static page does not flash. */
export function AccountLink({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const user = useUser();
  if (!supabaseConfigured || user === undefined) return null;
  return (
    <Link href={user ? "/account" : "/sign-in"} className={className}>
      {user ? t("account") : t("signIn")}
    </Link>
  );
}
