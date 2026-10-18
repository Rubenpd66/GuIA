import { cx } from "@/lib/cx";

type PerforationsProps = {
  /** One hole per question, like the punched page numbers of a passport. */
  states: readonly ("answered" | "current" | "open" | "right" | "wrong")[];
};

/** Visual progress only; the text counter next to it carries the information. */
export function Perforations({ states }: PerforationsProps) {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-1.5">
      {states.map((state, i) => (
        <span
          key={i}
          className={cx(
            "size-2.5 rounded-full",
            state === "answered" && "bg-ink",
            state === "current" &&
              "bg-cover ring-2 ring-cover ring-offset-2 ring-offset-paper dark:bg-foil dark:ring-foil",
            state === "open" && "border border-line",
            state === "right" && "bg-entry",
            state === "wrong" && "bg-refusal",
          )}
        />
      ))}
    </div>
  );
}
