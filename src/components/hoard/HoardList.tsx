import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { SectionHeader } from "../shell/SectionHeader";
import { HoardItem } from "./HoardItem";
import type { Banknote } from "../../game/types";
import { durations } from "../../theme/animations";

interface HoardListProps {
  loot: Banknote[];
}

interface TrackedNote extends Banknote {
  /** Stagger delay used by the entrance transition; set once at first mount. */
  enterDelayMs: number;
  /** Stagger delay used by the exit transition; null while the note is live. */
  exitDelayMs: number | null;
}

const TRANSITION_MS = durations.base;
const STAGGER_STEP_MS = 80;

// Sync `tracked` against the latest loot, preserving stable enter delays for
// existing items, assigning sequential exit delays to ones that just left,
// and giving fresh additions their own staggered entrance.
function syncTracked(prev: TrackedNote[], loot: Banknote[]): TrackedNote[] {
  const lootById = new Map(loot.map(n => [n.id, n]));
  const prevIds = new Set(prev.map(t => t.id));
  let exiting = 0;
  const updated = prev.map(t => {
    const live = lootById.get(t.id);
    if (live) {
      // Re-entering after a brief exit — clear the exit so the card stays put.
      if (t.exitDelayMs !== null) return { ...t, exitDelayMs: null };
      return t;
    }
    // Already mid-exit; keep its slot in the stagger order.
    if (t.exitDelayMs !== null) return t;
    return { ...t, exitDelayMs: exiting++ * STAGGER_STEP_MS };
  });
  let entering = 0;
  const additions: TrackedNote[] = loot
    .filter(n => !prevIds.has(n.id))
    .map(n => ({
      ...n,
      enterDelayMs: entering++ * STAGGER_STEP_MS,
      exitDelayMs: null,
    }));
  return [...updated, ...additions];
}

export function HoardList({ loot }: HoardListProps) {
  const [tracked, setTracked] = useState<TrackedNote[]>(() =>
    loot.map((n, idx) => ({
      ...n,
      enterDelayMs: idx * STAGGER_STEP_MS,
      exitDelayMs: null,
    })),
  );

  // Resync only when loot CONTENT changes — `normalizeGame` rebuilds the array
  // on every firebase update, so a reference-based dep would trigger spurious
  // syncs (and risk re-firing entrance animations) on every phase change.
  // The lootRef.current = loot write is the standard "latest-value mirror"
  // pattern: the id-keyed effect needs the latest reference but must not
  // run on every change, so we stash it here and read inside the effect.
  const lootKey = loot.map(n => n.id).join(",");
  const lootRef = useRef(loot);
  // eslint-disable-next-line react-hooks/refs
  lootRef.current = loot;
  useEffect(() => {
    setTracked(prev => syncTracked(prev, lootRef.current));
  }, [lootKey]);

  // Drop exiting cards from the grid once their staggered fades have all
  // landed, then the survivors glide via FLIP into their new positions.
  useEffect(() => {
    const exiting = tracked.filter(t => t.exitDelayMs !== null);
    if (exiting.length === 0) return;
    const lastMs = Math.max(...exiting.map(t => t.exitDelayMs!)) + TRANSITION_MS;
    const id = setTimeout(() => {
      setTracked(prev => prev.filter(t => t.exitDelayMs === null));
    }, lastMs + 50);
    return () => clearTimeout(id);
  }, [tracked]);

  // FLIP reflow for survivors only. Captures positions before each commit,
  // then on the next paint shifts each moved element back to its old slot
  // and animates the transform to identity. We touch only `transform` here
  // — opacity stays under HoardCard's per-item control, so an exit fade can
  // still fire even on a card we just FLIPped.
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
      const innerEl = el.firstElementChild as HTMLElement | null;
      if (!innerEl) return;
      // Apply the FLIP transform to the wrapper element so we don't fight
      // HoardCard's own scale transform on the inner Box.
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = "transform 0ms";
      requestAnimationFrame(() => {
        el.style.transition = `transform ${TRANSITION_MS}ms ease`;
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
          <Box key={n.id} data-flip-id={n.id}>
            <HoardCard note={n} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// Per-card animation, owned by the card itself. Transition is declared once
// statically in `sx` (so emotion-generated className stays in effect across
// parent re-renders); opacity/transform are mutated imperatively via a ref so
// they don't ride the JSX prop diff. Phase ticks that don't change the card's
// logical state are visually inert because nothing the card cares about
// changed.
function HoardCard({ note }: { note: TrackedNote }) {
  const ref = useRef<HTMLDivElement>(null);
  const enterDelayMs = note.enterDelayMs;
  const exitDelayMs = note.exitDelayMs;

  // Pre-paint: stamp the entrance starting state directly on the DOM so the
  // first frame is hidden, not a flash of opacity:1.
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.opacity = "0";
    ref.current.style.transform = "scale(1.6)";
  }, []);

  // Post-paint, on a fresh frame, flip to the resting state. The transition
  // rule lives on the className (set via `sx` below) and is in effect the
  // whole time, so this single property change is what the browser sees as
  // the "trigger" — it animates with the staggered delay.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.opacity = "1";
      ref.current.style.transform = "scale(1)";
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Exit: override the className-defined transition with an opacity-only one
  // that uses the exit stagger delay, then flip opacity to 0.
  useEffect(() => {
    if (exitDelayMs === null) return;
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = `opacity ${TRANSITION_MS}ms ease ${exitDelayMs}ms`;
      ref.current.style.opacity = "0";
    });
    return () => cancelAnimationFrame(raf);
  }, [exitDelayMs]);

  return (
    <Box
      ref={ref}
      sx={{
        transition:
          `opacity ${TRANSITION_MS}ms ease ${enterDelayMs}ms, ` +
          `transform ${TRANSITION_MS}ms cubic-bezier(.2,.7,.2,1.4) ${enterDelayMs}ms`,
      }}
    >
      <HoardItem value={note.value} />
    </Box>
  );
}
