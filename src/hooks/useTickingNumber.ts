import { useEffect, useRef, useState } from "react";

// Smoothly interpolate a displayed integer from its current value to `target`
// over `durationMs` whenever the target changes. Uses requestAnimationFrame
// + cubic ease-out so the count "ticks up" instead of snapping.
//
// The displayed value is rounded to integer at every frame — this hook is
// meant for whole-number figures like cash totals.
export function useTickingNumber(target: number, durationMs: number): number {
  const [displayed, setDisplayed] = useState(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (displayed === target) return;

    const from = displayed;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // `displayed` is captured intentionally as `from` only when target
    // changes — adding it to deps would re-fire on every interpolation step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return displayed;
}
