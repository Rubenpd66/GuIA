import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  hasSessionCookie,
  supabaseConfigured,
} from "./env";

/**
 * Refreshes an expiring Supabase session on the way through, writing the new tokens to both
 * the request (for Server Components) and the response (for the browser). Visitors without a
 * session cookie skip it entirely, so static pages stay as fast as before.
 */
export async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  if (
    !supabaseConfigured ||
    !hasSessionCookie(request.cookies.getAll().map((c) => c.name))
  )
    return response;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });
  // Nothing may run between creating the client and this call (Supabase's guidance).
  await supabase.auth.getClaims();
  return response;
}
