import { cx } from "@/lib/cx";

type QuestionProgressProps = {
  /** One segment per question. */
  states: readonly ("answered" | "current" | "open" | "right" | "wrong")[];
};

/** Visual progress only; the text counter next to it carries the information. */
export function QuestionProgress({ states }: QuestionProgressProps) {
  return (
    <div aria-hidden="true" className="flex gap-1">
      {states.map((state, i) => (
        <span
          key={i}
          className={cx(
            "h-2 min-w-0 flex-1 rounded-full transition-colors duration-[var(--dur-base)]",
            state === "answered" && "bg-accent",
            state === "current" && "bg-ink-soft",
            state === "open" && "bg-hairline",
            state === "right" && "bg-success",
            state === "wrong" && "bg-danger",
          )}
        />
      ))}
    </div>
  );
}
