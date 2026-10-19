import { Fragment } from "react";
import { parseInline } from "@/lib/content/markup";

/** Renders content strings with **bold**, _italic_ and ==highlight==. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((node, i) => {
        switch (node.type) {
          case "strong":
            return (
              <strong key={i} className="font-semibold">
                {node.text}
              </strong>
            );
          case "em":
            return <em key={i}>{node.text}</em>;
          case "mark":
            return (
              <mark
                key={i}
                className="rounded-sm bg-[color-mix(in_srgb,var(--reward)_35%,transparent)] px-0.5 text-ink"
              >
                {node.text}
              </mark>
            );
          default:
            return <Fragment key={i}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}
