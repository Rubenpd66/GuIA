import { SITE } from "@/config/site";
import { cx } from "@/lib/cx";

/** Brand mark: a small postmark next to the name. Inherits the text colour. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="size-8 -rotate-12"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="14" strokeWidth="2.25" />
        <circle cx="16" cy="16" r="9.5" strokeWidth="1.25" />
        <path d="M9.5 16h13" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className="text-xl font-black tracking-tight font-expanded">
        {SITE.name}
      </span>
    </span>
  );
}
