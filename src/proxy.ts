import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

/** Locale routing first, then a Supabase session refresh for signed-in visitors only. */
export default async function proxy(request: NextRequest) {
  // The admin panel is not localised: only the session refresh applies.
  if (request.nextUrl.pathname.startsWith("/admin"))
    return refreshSession(request, NextResponse.next());
  return refreshSession(request, intl(request));
}

export const config = {
  // Everything except API routes, content banks, the auth callbacks (route handlers that set
  // their own cookies), Next.js internals and files with an extension.
  matcher: "/((?!api|banks|auth|_next|_vercel|.*\\..*).*)",
};
