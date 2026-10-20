import { SITE } from "@/config/site";
import { cx } from "@/lib/cx";

/**
 * The name set as a wordmark: "Gu" in ink, "IA" in the accent. Inherits the text size.
 * `inverse` is for accent backgrounds: both halves in the on-accent colour, "IA" underlined in amber.
 */
export function Wordmark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={SITE.name}
      className={cx("text-xl font-extrabold tracking-tight", className)}
    >
      <span aria-hidden="true">Gu</span>
      <span
        aria-hidden="true"
        className={
          inverse
            ? "underline decoration-reward decoration-[0.12em] underline-offset-[0.12em]"
            : "text-accent"
        }
      >
        IA
      </span>
    </span>
  );
}
