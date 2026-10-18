"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import { splitSentences } from "@/lib/content/text";
import { cx } from "@/lib/cx";

const MARKED =
  "rounded-sm bg-[color-mix(in_srgb,var(--foil)_35%,transparent)] underline decoration-foil decoration-2 underline-offset-4";

type HighlightableTextProps = {
  paragraphs: string[];
  /** Keys `paragraph:sentence` of the highlighted sentences. */
  highlighted: Set<string>;
  onToggle: (key: string) => void;
  /** While on, every sentence is a button that marks or unmarks it. */
  active: boolean;
};

/** A reading text whose sentences can be highlighted while the highlighter is on. */
export function HighlightableText({
  paragraphs,
  highlighted,
  onToggle,
  active,
}: HighlightableTextProps) {
  return (
    <div lang="en" className="prose-reading space-y-3">
      {paragraphs.map((paragraph, p) => (
        <p key={p}>
          {splitSentences(paragraph).map((sentence, s) => {
            const key = `${p}:${s}`;
            const marked = highlighted.has(key);
            return (
              <span key={key}>
                {s > 0 ? " " : null}
                {active ? (
                  <button
                    type="button"
                    aria-pressed={marked}
                    onClick={() => onToggle(key)}
                    className={cx(
                      "inline cursor-pointer rounded-sm text-left hover:bg-[color-mix(in_srgb,var(--foil)_18%,transparent)]",
                      marked && MARKED,
                    )}
                  >
                    {sentence}
                  </button>
                ) : (
                  <span className={cx(marked && MARKED)}>{sentence}</span>
                )}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

/** The highlighter switch and the clear button, shared by every text in a task. */
export function HighlighterControls({
  active,
  onActiveChange,
  count,
  onClear,
}: {
  active: boolean;
  onActiveChange: (active: boolean) => void;
  count: number;
  onClear: () => void;
}) {
  const t = useTranslations("Reading.highlight");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        aria-pressed={active}
        onClick={() => onActiveChange(!active)}
        className="aria-pressed:border-foil aria-pressed:bg-[color-mix(in_srgb,var(--foil)_25%,transparent)]"
      >
        <Icon name="highlighter" className="size-5" />
        {t("toggle")}
      </Button>
      <Button variant="ghost" disabled={count === 0} onClick={onClear}>
        {t("clear")}
      </Button>
      {active ? <p className="text-sm text-ink-soft">{t("hint")}</p> : null}
    </div>
  );
}
