import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";

type CardProps = {
  as?: "div" | "section" | "article" | "li";
  href?: ComponentProps<typeof Link>["href"];
  className?: string;
  children: ReactNode;
};

const BASE =
  "block rounded-card bg-surface p-5 shadow-card sm:p-6 dark:border dark:border-hairline";

/** A surface for one group of content. With `href` the whole card is the link and lifts on hover. */
export function Card({ as: Tag = "div", href, className, children }: CardProps) {
  if (href !== undefined) {
    return (
      <Link
        href={href}
        className={cx(
          BASE,
          "pressable hover-fine:-translate-y-0.5 hover-fine:shadow-md",
          className,
        )}
      >
        {children}
      </Link>
    );
  }
  return <Tag className={cx(BASE, className)}>{children}</Tag>;
}
