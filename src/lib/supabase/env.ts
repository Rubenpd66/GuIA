/**
 * Public Supabase settings. Both values may reach the browser: the publishable key only
 * grants what Row Level Security allows. Without them, accounts are simply switched off and
 * Sello keeps working on this device only.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);

/** Supabase stores the session in cookies named sb-<project ref>-auth-token(.0, .1…). */
export const hasSessionCookie = (names: readonly string[]) =>
  names.some((name) => name.startsWith("sb-") && name.includes("-auth-token"));
