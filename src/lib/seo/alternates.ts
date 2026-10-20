import { getLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

type Internal = string;

function pathFor(
  internal: Internal,
  locale: Locale,
  params: Record<string, string>,
): string {
  const entry = routing.pathnames[internal as keyof typeof routing.pathnames];
  if (!entry) throw new Error(`Unknown pathname: ${internal}`);
  let path: string = typeof entry === "string" ? entry : entry[locale];
  for (const [name, value] of Object.entries(params))
    path = path.replace(`[${name}]`, value);
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Canonical URL and hreflang alternates (relative; `metadataBase` makes them absolute). */
export function buildAlternates(
  internal: Internal,
  locale: Locale,
  params: Record<string, string> = {},
) {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, pathFor(internal, l, params)]),
  );
  return {
    canonical: pathFor(internal, locale, params),
    languages: { ...languages, "x-default": languages[routing.defaultLocale]! },
  };
}

/** The same, for the language of the current request. */
export async function alternatesFor(
  internal: Internal,
  params: Record<string, string> = {},
) {
  return buildAlternates(internal, (await getLocale()) as Locale, params);
}
