/**
 * Building blocks for the Speaking scenes: monoline drawings in the theme's ink, filled with
 * theme tokens so every scene follows light and dark mode. Coordinates use a 480×320 canvas.
 */

export const C = {
  bg: "var(--sheet)",
  ground: "var(--hairline)",
  ink: "var(--ink)",
  soft: "var(--ink-soft)",
  paper: "var(--paper)",
  green: "var(--guilloche)",
  gold: "var(--foil)",
  wine: "var(--cover)",
  leaf: "var(--entry)",
  red: "var(--refusal)",
} as const;

export const LINE = {
  stroke: C.ink,
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type Pose = "down" | "up" | "phone" | "forward" | "hold";
type PersonProps = {
  x: number;
  /** Feet for a standing person, seat for a seated one. */
  y: number;
  h?: number;
  shirt?: string;
  pose?: Pose;
  /** Mirror so the person faces left. */
  flip?: boolean;
};

const mirror = (flip: boolean | undefined, x: number) =>
  flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined;

function arms(
  x: number,
  w: number,
  shoulder: number,
  hip: number,
  headY: number,
  h: number,
  pose: Pose,
) {
  const left = `${x - w},${shoulder} ${x - w - 5},${hip + h * 0.04}`;
  const right = {
    down: `${x + w},${shoulder} ${x + w + 5},${hip + h * 0.04}`,
    up: `${x + w},${shoulder} ${x + w + h * 0.1},${shoulder - h * 0.12} ${x + w + h * 0.12},${headY - h * 0.08}`,
    phone: `${x + w},${shoulder} ${x + w + h * 0.08},${shoulder + h * 0.12} ${x + w * 0.4},${headY + h * 0.03}`,
    forward: `${x + w},${shoulder} ${x + w + h * 0.14},${shoulder + h * 0.14} ${x + w + h * 0.26},${shoulder + h * 0.1}`,
    hold: `${x + w},${shoulder} ${x + w + h * 0.06},${shoulder + h * 0.16} ${x + w + h * 0.16},${shoulder + h * 0.2}`,
  }[pose];
  const leftArm =
    pose === "forward"
      ? `${x - w},${shoulder} ${x + w * 0.2},${shoulder + h * 0.16} ${x + w + h * 0.24},${shoulder + h * 0.14}`
      : left;
  return (
    <>
      <polyline points={leftArm} fill="none" {...LINE} />
      <polyline points={right} fill="none" {...LINE} />
      {pose === "phone" ? (
        <rect
          x={x + w * 0.2}
          y={headY - h * 0.02}
          width={h * 0.05}
          height={h * 0.09}
          rx={1.5}
          fill={C.soft}
          {...LINE}
          strokeWidth={1.5}
        />
      ) : null}
    </>
  );
}

export function Person({
  x,
  y,
  h = 100,
  shirt = C.green,
  pose = "down",
  flip,
}: PersonProps) {
  const r = h * 0.1;
  const headY = y - h + r;
  const neck = headY + r + 1;
  const hip = y - h * 0.42;
  const shoulder = neck + h * 0.05;
  const w = h * 0.15;
  return (
    <g transform={mirror(flip, x)}>
      <line x1={x - w * 0.5} y1={hip} x2={x - w * 0.6} y2={y} {...LINE} />
      <line x1={x + w * 0.5} y1={hip} x2={x + w * 0.6} y2={y} {...LINE} />
      <rect
        x={x - w}
        y={neck}
        width={w * 2}
        height={hip - neck}
        rx={w * 0.6}
        fill={shirt}
        {...LINE}
      />
      {arms(x, w, shoulder, hip, headY, h, pose)}
      <circle cx={x} cy={headY} r={r} fill={C.paper} {...LINE} />
    </g>
  );
}

export function Seated({
  x,
  y,
  h = 100,
  shirt = C.green,
  pose = "down",
  flip,
}: PersonProps) {
  const r = h * 0.1;
  const neck = y - h * 0.34;
  const headY = neck - r - 1;
  const shoulder = neck + h * 0.05;
  const w = h * 0.14;
  return (
    <g transform={mirror(flip, x)}>
      <polyline
        points={`${x},${y} ${x + h * 0.24},${y} ${x + h * 0.25},${y + h * 0.26}`}
        fill="none"
        {...LINE}
      />
      <rect
        x={x - w}
        y={neck}
        width={w * 2}
        height={y - neck + 2}
        rx={w * 0.6}
        fill={shirt}
        {...LINE}
      />
      {arms(x, w, shoulder, y - h * 0.06, headY, h, pose)}
      <circle cx={x} cy={headY} r={r} fill={C.paper} {...LINE} />
    </g>
  );
}

export function Sky({ ground = 250 }: { ground?: number }) {
  return (
    <>
      <rect width={480} height={320} fill={C.bg} />
      <rect y={ground} width={480} height={320 - ground} fill={C.ground} />
      <line x1={0} y1={ground} x2={480} y2={ground} {...LINE} />
    </>
  );
}

export function Room({ floor = 240 }: { floor?: number }) {
  return (
    <>
      <rect width={480} height={320} fill={C.paper} />
      <rect y={floor} width={480} height={320 - floor} fill={C.ground} />
      <line x1={0} y1={floor} x2={480} y2={floor} {...LINE} />
    </>
  );
}

export function Sun({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={C.gold} {...LINE} />;
}

export function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} a14 14 0 0 1 26 -8 a16 16 0 0 1 30 4 a11 11 0 0 1 2 22 h-54 a10 10 0 0 1 -4 -18 z`}
      fill={C.paper}
      {...LINE}
    />
  );
}

export function Tree({ x, y, h = 110 }: { x: number; y: number; h?: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h * 0.5} {...LINE} strokeWidth={5} />
      <circle cx={x} cy={y - h * 0.68} r={h * 0.3} fill={C.leaf} {...LINE} />
    </g>
  );
}

export function Window({
  x,
  y,
  w,
  h,
  fill = C.bg,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} {...LINE} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} {...LINE} />
    </g>
  );
}

/** A building with a grid of windows; `y` is its base. */
export function Building({
  x,
  y,
  w,
  h,
  fill = C.green,
  rows,
  cols,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  rows: number;
  cols: number;
}) {
  const cellW = w / cols;
  const cellH = (h - 10) / rows;
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill={fill} {...LINE} />
      {Array.from({ length: rows * cols }, (_, i) => (
        <rect
          key={i}
          x={x + (i % cols) * cellW + cellW * 0.25}
          y={y - h + 8 + Math.floor(i / cols) * cellH + cellH * 0.2}
          width={cellW * 0.5}
          height={cellH * 0.55}
          fill={C.bg}
          {...LINE}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

/** A table seen from the side; `y` is the top. */
export function Table({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={8} fill={C.gold} {...LINE} />
      <line x1={x + 10} y1={y + 8} x2={x + 10} y2={y + 50} {...LINE} />
      <line x1={x + w - 10} y1={y + 8} x2={x + w - 10} y2={y + 50} {...LINE} />
    </g>
  );
}

export function Cup({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M${x} ${y} h14 l-2 14 h-10 z`}
        fill={C.paper}
        {...LINE}
        strokeWidth={2}
      />
      <path
        d={`M${x + 14} ${y + 3} a4 4 0 0 1 0 8`}
        fill="none"
        {...LINE}
        strokeWidth={2}
      />
    </g>
  );
}

export function Laptop({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y - 26}
        width={38}
        height={26}
        rx={2}
        fill={C.soft}
        {...LINE}
      />
      <line x1={x - 6} y1={y} x2={x + 44} y2={y} {...LINE} strokeWidth={4} />
    </g>
  );
}

export function Box({
  x,
  y,
  w = 34,
  h = 26,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
}) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} fill={C.gold} {...LINE} />
      <line x1={x + w / 2} y1={y - h} x2={x + w / 2} y2={y - h + 9} {...LINE} />
    </g>
  );
}

export function Bag({
  x,
  y,
  fill = C.wine,
}: {
  x: number;
  y: number;
  fill?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={16}
        height={18}
        rx={2}
        fill={fill}
        {...LINE}
        strokeWidth={2}
      />
      <path
        d={`M${x + 4} ${y} a4 5 0 0 1 8 0`}
        fill="none"
        {...LINE}
        strokeWidth={2}
      />
    </g>
  );
}

export function Bike({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y - 14} r={14} fill="none" {...LINE} />
      <circle cx={x + 48} cy={y - 14} r={14} fill="none" {...LINE} />
      <polyline
        points={`${x},${y - 14} ${x + 18},${y - 36} ${x + 40},${y - 36} ${x + 48},${y - 14} ${x + 24},${y - 14} ${x + 18},${y - 36}`}
        fill="none"
        {...LINE}
      />
    </g>
  );
}

export function Mountain({
  x,
  y,
  w,
  h,
  snow = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  snow?: boolean;
}) {
  const peak = x + w / 2;
  return (
    <g>
      <polygon
        points={`${x},${y} ${peak},${y - h} ${x + w},${y}`}
        fill={C.green}
        {...LINE}
      />
      {snow ? (
        <polygon
          points={`${peak - w * 0.12},${y - h * 0.76} ${peak},${y - h} ${peak + w * 0.12},${y - h * 0.76} ${peak + w * 0.04},${y - h * 0.7} ${peak - w * 0.04},${y - h * 0.74}`}
          fill={C.paper}
          {...LINE}
          strokeWidth={2}
        />
      ) : null}
    </g>
  );
}

export function Book({
  x,
  y,
  fill = C.wine,
}: {
  x: number;
  y: number;
  fill?: string;
}) {
  return (
    <g>
      <path
        d={`M${x} ${y} l14 -4 l14 4 v-16 l-14 -4 l-14 4 z`}
        fill={fill}
        {...LINE}
        strokeWidth={2}
      />
      <line
        x1={x + 14}
        y1={y - 4}
        x2={x + 14}
        y2={y - 20}
        {...LINE}
        strokeWidth={2}
      />
    </g>
  );
}
