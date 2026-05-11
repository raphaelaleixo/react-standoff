import { useEffect, useState } from "react";

interface Args {
  active: boolean;
  startedAt: number;
  durationMs: number;
}

// Whole-second countdown — returns durationMs/1000, durationMs/1000 - 1, …, 0
// while `active`, polling at 100ms so the visible number flips inside one
// React frame of the boundary. Returns null when not active.
//
// `now` lives in state and is resynced at the head of the activation effect
// (so the first render after `active` flips back on doesn't compute against
// a stale, deactivation-era timestamp) and again on every 100ms tick.
export function useSecondsRemaining({ active, startedAt, durationMs }: Args): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // Sync once on activation so the first frame after `active` flips on
    // doesn't compute elapsed against a deactivation-era timestamp. The
    // single cascading render this triggers is intentional and one-shot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  return Math.ceil(remaining / 1000);
}
