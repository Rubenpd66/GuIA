import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";

/** Pages that must not be indexed. */
const HIDDEN = new Set(["/design"]);

type DynamicValues = Record<string, readonly string[]>;

function localizedPath(internal: string, locale: Locale): string {
  const entry = routing.pathnames[internal as keyof typeof routing.pathnames];
  const path = typeof entry === "string" ? entry : entry[locale];
  return `/${locale}${path === "/" ? "" : path}`;
}

/**
 * Every public URL in both languages, each with its counterpart as hreflang alternates.
 * Dynamic segments are filled from `values` (for example every grammar lesson slug).
 */
export function sitemapEntries(
  baseUrl: string,
  values: DynamicValues,
): MetadataRoute.Sitemap {
  const pages = Object.keys(routing.pathnames)
    .filter((internal) => !HIDDEN.has(internal))
    .flatMap((internal) => {
      const param = internal.match(/\[(\w+)\]/)?.[1];
      if (!param) return [{ internal, fill: (path: string) => path }];
      return (values[internal] ?? []).map((value) => ({
        internal,
        fill: (path: string) => path.replace(`[${param}]`, value),
      }));
    });
  return pages.flatMap(({ internal, fill }) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        baseUrl + fill(localizedPath(internal, locale)),
      ]),
    );
    return routing.locales.map((locale) => ({
      url: languages[locale]!,
      alternates: { languages },
    }));
  });
}
