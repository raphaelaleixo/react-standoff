import { useEffect, useState } from "react";

interface Args {
  active: boolean;
  startedAt: number;
  durationMs: number;
}

export function useStandoffCount({ active, startedAt, durationMs }: Args): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  const stepMs = durationMs / 3;
  // Bucket remaining time into 3 / 2 / 1 / 0. Once it lands on 0 the
  // mock auto-advances the phase, and in production the server-driven
  // phase change snaps the active flag off, so the 0 state is fleeting.
  const step = Math.ceil(remaining / stepMs);
  return Math.min(3, step);
}
