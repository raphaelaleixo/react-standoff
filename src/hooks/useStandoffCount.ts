import { useEffect, useState } from "react";

interface Args {
  active: boolean;
  startedAt: number;
  durationMs: number;
}

export function useStandoffCount({ active, startedAt, durationMs }: Args): number | null {
  // Read time fresh from Date.now() in the render body so the first frame
  // after `active` flips on doesn't compute against a stale, mount-time
  // timestamp. The interval is only used to schedule re-renders.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick(n => n + 1), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  const stepMs = durationMs / 3;
  // Bucket remaining time into 3 / 2 / 1 / 0. Once it lands on 0 the
  // mock auto-advances the phase, and in production the server-driven
  // phase change snaps the active flag off, so the 0 state is fleeting.
  const step = Math.ceil(remaining / stepMs);
  return Math.min(3, step);
}
