"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Milliseconds left until `deadline` (null = no timer). Calls `onExpire` once when it
 * reaches zero. The clock only ticks from the interval, never during render.
 */
export function useCountdown(
  deadline: number | null,
  durationMs: number,
  onExpire: () => void,
): number {
  const [remaining, setRemaining] = useState(durationMs);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (deadline === null) return;
    const id = window.setInterval(() => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(id);
        onExpireRef.current();
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [deadline]);

  return remaining;
}
