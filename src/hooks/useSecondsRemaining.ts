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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  return Math.ceil(remaining / 1000);
}
