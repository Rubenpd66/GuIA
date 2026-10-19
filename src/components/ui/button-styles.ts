export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 pressable rounded-control font-semibold leading-tight select-none disabled:cursor-not-allowed disabled:opacity-60";

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

/* Hover mixes the colour towards the ink, so it darkens in light mode and lightens in dark mode. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover-fine:bg-[color-mix(in_srgb,var(--accent)_82%,var(--ink))]",
  secondary:
    "border-[1.5px] border-line text-ink hover-fine:bg-[color-mix(in_srgb,var(--canvas)_88%,var(--ink))]",
  ghost:
    "text-ink underline decoration-1 underline-offset-4 hover-fine:decoration-2 hover-fine:bg-[color-mix(in_srgb,var(--canvas)_92%,var(--ink))]",
};

export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
) {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
}
