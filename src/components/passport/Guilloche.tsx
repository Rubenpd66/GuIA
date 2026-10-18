import { guillochePath, wavePath } from "@/lib/passport/guilloche";
import { cx } from "@/lib/cx";

const ROSETTE = [18, 24, 30, 36].map((d) =>
  guillochePath({ cx: 100, cy: 100, R: 80, r: 28, d, steps: 840 }),
);

const BAND = [0, 1, 2, 3, 4, 5].map((i) =>
  wavePath({
    width: 400,
    y: 20,
    amplitude: 9 - i,
    wavelength: 50,
    steps: 400,
    phase: (i * Math.PI) / 3,
  }),
);

type GuillocheProps = { variant: "rosette" | "band"; className?: string };

/** Decorative security-print pattern. Never place it behind text people need to read. */
export function Guilloche({ variant, className }: GuillocheProps) {
  if (variant === "rosette") {
    return (
      <svg
        viewBox="0 0 200 200"
        className={cx("block", className)}
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.6">
          {ROSETTE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className={cx("block", className)}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        vectorEffect="non-scaling-stroke"
      >
        {BAND.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
