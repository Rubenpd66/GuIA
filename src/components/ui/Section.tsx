import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Vertical rhythm between page sections: 64 px, 80 px from `lg`. Pages never set their own. */
export function SectionStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-16 lg:gap-20", className)}>
      {children}
    </div>
  );
}

type SectionProps = {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  headingLevel?: 2 | 3;
  children: ReactNode;
};

/** A titled page section: heading, optional lead, then the content 24 px below. */
export function Section({
  id,
  title,
  lead,
  headingLevel = 2,
  children,
}: SectionProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={id}>
      <Heading
        id={id}
        className={cx(
          "font-bold text-balance",
          headingLevel === 2 ? "text-xl" : "text-lg",
        )}
      >
        {title}
      </Heading>
      {lead ? (
        <p className="mt-2 max-w-[68ch] text-pretty text-ink-soft">{lead}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
