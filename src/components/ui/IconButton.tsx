import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

type IconButtonProps = ComponentProps<"button"> & { label: string };

/** A 48×48 icon-only button. `label` is its accessible name and tooltip. */
export function IconButton({
  label,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-12 shrink-0 items-center justify-center rounded-control transition-colors duration-150 hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
