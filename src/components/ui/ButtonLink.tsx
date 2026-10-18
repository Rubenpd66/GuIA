import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** A link that looks like a button: for navigation, never for actions. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses(variant, size), className)} {...props} />
  );
}
