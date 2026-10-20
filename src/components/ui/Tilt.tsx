"use client";

import {
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cx } from "@/lib/cx";

/**
 * Tilts its content towards a mouse pointer in 3D, and settles back when it leaves.
 * Touch, pens and reduced motion get the plain content: nothing moves.
 */
export function Tilt({
  children,
  className,
  style,
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Largest rotation in degrees. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The resting box in page coordinates: measured once (a tilted box measures wrong) and still
  // right when the page scrolls under a pointer that has not left.
  const rest = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!rest.current) {
      const r = el.getBoundingClientRect();
      rest.current = {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        width: r.width,
        height: r.height,
      };
    }
    const box = rest.current;
    const x = (event.pageX - box.left) / box.width - 0.5;
    const y = (event.pageY - box.top) / box.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateZ(6px)`;
  };
  const onPointerLeave = () => {
    rest.current = null;
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cx("tilt", className)}
      style={style}
    >
      {children}
    </div>
  );
}
