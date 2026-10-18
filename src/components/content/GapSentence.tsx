import { Fragment } from "react";
import { splitGaps } from "@/lib/content/markup";
import { cx } from "@/lib/cx";

type GapSentenceProps = {
  text: string;
  /** Word shown in the gap once answered. */
  fill?: string;
  tone?: "neutral" | "entry" | "refusal";
  /** Accessible name of an empty gap, e.g. "blank". */
  gapLabel: string;
};

/** A sentence whose ___ is drawn as a writing line, or filled with the chosen word. */
export function GapSentence({
  text,
  fill,
  tone = "neutral",
  gapLabel,
}: GapSentenceProps) {
  const parts = splitGaps(text);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            fill ? (
              <span
                className={cx(
                  "border-b-2 px-1 font-semibold",
                  tone === "entry" && "border-entry text-entry",
                  tone === "refusal" && "border-refusal text-refusal",
                  tone === "neutral" && "border-ink",
                )}
              >
                {fill}
              </span>
            ) : (
              <span className="inline-block w-16 translate-y-[-0.2em] border-b-2 border-ink align-baseline">
                <span className="sr-only">{gapLabel}</span>
              </span>
            )
          ) : null}
        </Fragment>
      ))}
    </>
  );
}
