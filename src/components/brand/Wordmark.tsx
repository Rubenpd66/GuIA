import { SITE } from "@/config/site";
import { cx } from "@/lib/cx";

/** The name set as a wordmark: "Gu" in ink, "IA" in the accent. Inherits the text size. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={SITE.name}
      className={cx("text-xl font-extrabold tracking-tight", className)}
    >
      <span aria-hidden="true">Gu</span>
      <span aria-hidden="true" className="text-accent">
        IA
      </span>
    </span>
  );
}
