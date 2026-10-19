/**
 * Geometry for the guilloche patterns printed on passports and banknotes, generated here
 * so the artwork is original and needs no image files.
 */

// A tenth of a unit is below a pixel at the sizes these patterns are drawn, and keeps every
// page's markup small (the band is in the navigation of every page).
const round = (value: number) => Math.round(value * 10) / 10;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

type GuillocheOptions = {
  cx: number;
  cy: number;
  /** Radius of the fixed circle. Use whole numbers so the curve closes. */
  R: number;
  /** Radius of the rolling circle. Use whole numbers so the curve closes. */
  r: number;
  /** Distance of the pen from the rolling circle's centre. */
  d: number;
  steps: number;
};

/** A closed hypotrochoid (spirograph curve) as an SVG path. */
export function guillochePath({
  cx,
  cy,
  R,
  r,
  d,
  steps,
}: GuillocheOptions): string {
  const ratio = (R - r) / r;
  const end = 2 * Math.PI * (r / gcd(R, r));
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (end * i) / steps;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(ratio * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(ratio * t);
    points.push(`${round(x)} ${round(y)}`);
  }
  const [first, ...rest] = points;
  // After one "L", SVG repeats the line command for every further pair of numbers.
  return `M${first} L${rest.join(" ")} Z`;
}

type WaveOptions = {
  width: number;
  y: number;
  amplitude: number;
  wavelength: number;
  steps: number;
  phase?: number;
};

/** An open sine wave across `width`, for guilloche bands. */
export function wavePath({
  width,
  y,
  amplitude,
  wavelength,
  steps,
  phase = 0,
}: WaveOptions): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (width * i) / steps;
    const waveY =
      y + amplitude * Math.sin((2 * Math.PI * x) / wavelength + phase);
    points.push(`${round(x)} ${round(waveY)}`);
  }
  const [first, ...rest] = points;
  return `M${first} L${rest.join(" ")}`;
}
