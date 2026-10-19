import type { ReactNode } from "react";

type EmptyStateProps = { title: string; body: string; action?: ReactNode };

/** Nothing here yet: says so, and offers the next step. */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="max-w-[68ch] rounded-card border border-dashed border-line p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-ink-soft">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
