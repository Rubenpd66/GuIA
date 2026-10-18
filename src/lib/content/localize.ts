import type { LocalizedText } from "./schemas/common";

/** The Spanish version when the interface is in Spanish and one exists; English otherwise. */
export function localized(text: LocalizedText, locale: string): string {
  return locale === "es" && text.es ? text.es : text.en;
}
