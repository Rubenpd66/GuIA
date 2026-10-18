import type { LocalizedText } from "@/lib/content/schemas/common";
import { RichText } from "./RichText";

/** An explanation in English, with the Spanish note underneath when the interface is in Spanish. */
export function Explanation({
  text,
  locale,
}: {
  text: LocalizedText;
  locale: string;
}) {
  return (
    <>
      <p>
        <RichText text={text.en} />
      </p>
      {locale === "es" && text.es ? (
        <p lang="es" className="mt-1 text-ink-soft">
          <RichText text={text.es} />
        </p>
      ) : null}
    </>
  );
}
