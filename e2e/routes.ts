import { routing } from "../src/i18n/routing";

/** One sample of every page in both locales, for the accessibility sweep. */
const SAMPLES: Record<string, string> = {
  "[slug]@/grammar/[slug]": "ability-and-permission",
  "[slug]@/vocabulary/[slug]": "work",
  "[part]@/practice/[part]": "core-grammar",
};

export function sampleUrls(): string[] {
  return routing.locales.flatMap((locale) =>
    Object.entries(routing.pathnames).flatMap(([internal, localized]) => {
      if (internal === "/design") return [];
      let path: string =
        typeof localized === "string" ? localized : localized[locale];
      for (const [key, value] of Object.entries(SAMPLES)) {
        const [param, owner] = key.split("@") as [string, string];
        if (owner === internal) path = path.replace(param, value);
      }
      return [`/${locale}${path === "/" ? "" : path}`];
    }),
  );
}

export const PRACTICE_PARTS = [
  "core-grammar",
  "core-vocabulary",
  "reading-1",
  "reading-2",
  "reading-3",
  "reading-4",
  "listening-1",
  "listening-2",
  "listening-3",
  "listening-4",
  "writing-1",
  "writing-2",
  "writing-3",
  "writing-4",
  "speaking-1",
  "speaking-2",
  "speaking-3",
  "speaking-4",
] as const;
