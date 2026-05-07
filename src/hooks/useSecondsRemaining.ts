import { useEffect, useState } from "react";

interface Args {
  active: boolean;
  startedAt: number;
  durationMs: number;
}

// Whole-second countdown — returns durationMs/1000, durationMs/1000 - 1, …, 0
// while `active`, polling at 100ms so the visible number flips inside one
// React frame of the boundary. Returns null when not active.
export function useSecondsRemaining({ active, startedAt, durationMs }: Args): number | null {
  // The interval drives re-renders; the time itself is read fresh from
  // Date.now() in the render body. Storing `now` in state would let it go
  // stale while the hook is inactive, and the first render after `active`
  // flips back on would compute against a long-out-of-date timestamp —
  // briefly showing a number well above durationMs/1000.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(n => n + 1), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  return Math.ceil(remaining / 1000);
}
