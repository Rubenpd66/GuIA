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
  const rest = useRef<DOMRect | null>(null);
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    rest.current ??= el.getBoundingClientRect();
    const box = rest.current;
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
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
