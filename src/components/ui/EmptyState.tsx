import type { ReactNode } from "react";

type EmptyStateProps = { title: string; body: string; action?: ReactNode };

/** An empty stamp slot: the dashed outline says "nothing here yet, but it has a place". */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="flex max-w-[68ch] items-start gap-5 rounded-card border-[1.5px] border-dashed border-line p-6">
      <svg
        viewBox="0 0 48 48"
        className="size-12 shrink-0 -rotate-6 text-ink-soft"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle
          cx="24"
          cy="24"
          r="14"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-ink-soft">{body}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </section>
  );
}
