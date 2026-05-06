import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { SectionHeader } from "../shell/SectionHeader";
import { HoardItem } from "./HoardItem";
import type { Banknote } from "../../game/types";
import { durations, dropIn } from "../../theme/animations";

interface HoardListProps {
  loot: Banknote[];
}

interface TrackedNote extends Banknote {
  exiting: boolean;
  enteringIndex?: number;
}

const FLIP_DURATION_MS = durations.base;
const STAGGER_STEP_MS = 80;

// Sync `tracked` with the latest loot array: new banknotes append fresh,
// notes that left the loot get marked `exiting: true` so they keep their
// grid slot for one fade-out cycle, and previously exiting notes that came
// back become live again. Newly-added banknotes get an `enteringIndex`
// that drives the stagger of their fade-in animation.
function syncTracked(tracked: TrackedNote[], loot: Banknote[]): TrackedNote[] {
  const lootById = new Map(loot.map(n => [n.id, n]));
  const trackedIds = new Set(tracked.map(t => t.id));
  const updated = tracked.map(t => {
    const live = lootById.get(t.id);
    return live
      ? { ...live, exiting: false, enteringIndex: t.enteringIndex }
      : { ...t, exiting: true };
  });
  let entering = 0;
  const additions = loot
    .filter(n => !trackedIds.has(n.id))
    .map(n => ({ ...n, exiting: false, enteringIndex: entering++ }));
  return [...updated, ...additions];
}

export function HoardList({ loot }: HoardListProps) {
  const [tracked, setTracked] = useState<TrackedNote[]>(() =>
    loot.map((n, idx) => ({ ...n, exiting: false, enteringIndex: idx })),
  );

  // Mark removed banknotes as `exiting` and schedule their unmount one
  // fade-out cycle later. The fade itself is the inline opacity transition
  // on each item; this effect drives the bookkeeping.
  useEffect(() => {
    setTracked(prev => syncTracked(prev, loot));
  }, [loot]);

  useEffect(() => {
    const hasExiting = tracked.some(t => t.exiting);
    if (!hasExiting) return;
    const id = setTimeout(() => {
      setTracked(prev => prev.filter(t => !t.exiting));
    }, FLIP_DURATION_MS);
    return () => clearTimeout(id);
  }, [tracked]);

  // FLIP reflow: capture each item's grid position before paint, then on
  // the next layout commit shift it back to its old position with transform
  // and animate to identity. The remaining banknotes glide into their new
  // slots when an exiting one finally unmounts and the grid collapses.
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, { left: number; top: number }>>(new Map());
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const newPos = new Map<string, { left: number; top: number }>();
    containerRef.current.querySelectorAll<HTMLElement>("[data-flip-id]").forEach(el => {
      const id = el.dataset.flipId!;
      const rect = el.getBoundingClientRect();
      newPos.set(id, { left: rect.left, top: rect.top });
    });
    newPos.forEach((newP, id) => {
      const oldP = positionsRef.current.get(id);
      if (!oldP) return;
      const dx = oldP.left - newP.left;
      const dy = oldP.top - newP.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const el = containerRef.current!.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
      if (!el) return;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "none";
      requestAnimationFrame(() => {
        el.style.transition = `transform ${FLIP_DURATION_MS}ms ease`;
        el.style.transform = "";
      });
    });
    positionsRef.current = newPos;
  }, [tracked]);

  return (
    <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <SectionHeader title="On the Table" subtitle="the captain's hoard" />
      <Box
        ref={containerRef}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", flex: 1, overflow: "hidden" }}
      >
        {tracked.map(n => (
          <Box
            key={n.id}
            data-flip-id={n.id}
            sx={{
              opacity: n.exiting ? 0 : 1,
              transition: `opacity ${FLIP_DURATION_MS}ms ease`,
              // Fresh banknotes drop onto the table with a per-item delay
              // so a full round draw arrives as a wave instead of a flash.
              animation: n.enteringIndex !== undefined
                ? `${dropIn} ${FLIP_DURATION_MS}ms cubic-bezier(.2,.7,.2,1.4) ${n.enteringIndex * STAGGER_STEP_MS}ms both`
                : undefined,
            }}
          >
            <HoardItem value={n.value} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
