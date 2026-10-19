import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, content banks, Next.js internals and files with an extension.
  matcher: "/((?!api|banks|_next|_vercel|.*\\..*).*)",
};
