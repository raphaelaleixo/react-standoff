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
  // Bucket remaining time into 3 / 2 / 1. Cap to 1 minimum so the stamp
  // keeps reading "1" until the phase actually transitions out.
  const step = Math.max(1, Math.ceil(remaining / stepMs));
  return Math.min(3, step);
}
