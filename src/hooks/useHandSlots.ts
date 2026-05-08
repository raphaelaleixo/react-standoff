import { useRef } from "react";
import type { BulletCard } from "../game/types";

export interface HandSlot {
  load: BulletCard;
  spent: boolean;
}

const ORDER: Record<BulletCard, number> = { clic: 0, bang: 1, bang_bang_bang: 2 };

// Tracks the player's hand layout so spent slots stay in their original
// positions instead of remaining cards re-sorting and shifting to fill the
// gaps. Call once at the highest stable phone-side component (PhaseView):
// across phase changes within a session the layout persists, so a card
// committed in round 2 is still visible (with a red X) in round 5.
//
// Behaviour:
// - First render (or after a remount): builds a fresh layout from the
//   sorted bullets, all face-up. If `prespent` is supplied (mock-only —
//   used by MockPlayerPage to demo the spent visual on every seat), those
//   bullets are added as spent slots in the same sorted layout.
// - Bullets shrank since last render: marks whichever face-up slots no
//   longer appear in `bullets` as spent — slot positions don't shift.
// - Bullets grew (shouldn't happen mid-game, defensive): rebuilds from
//   sorted bullets.
export function useHandSlots(
  bullets: BulletCard[],
  playerId: string,
  prespent: BulletCard[] = [],
): HandSlot[] {
  const ref = useRef<{ slots: HandSlot[]; playerId: string | null }>({
    slots: [],
    playerId: null,
  });

  // Different player than last call — fresh layout. Lets MockPlayerPage's
  // SEAT toggle swap between seats cleanly; in production the player id
  // never changes for a given mount, so this only fires on first call.
  if (ref.current.playerId !== playerId) {
    const initial: HandSlot[] = [
      ...bullets.map(load => ({ load, spent: false })),
      ...prespent.map(load => ({ load, spent: true })),
    ].sort((a, b) => ORDER[a.load] - ORDER[b.load]);
    ref.current = { playerId, slots: initial };
    return ref.current.slots;
  }

  const prevFaceUp = ref.current.slots.filter(s => !s.spent).length;

  if (bullets.length > prevFaceUp) {
    ref.current.slots = [...bullets]
      .sort((a, b) => ORDER[a] - ORDER[b])
      .map(load => ({ load, spent: false }));
    return ref.current.slots;
  }

  if (bullets.length < prevFaceUp) {
    const remaining = new Map<BulletCard, number>();
    for (const b of bullets) remaining.set(b, (remaining.get(b) ?? 0) + 1);
    ref.current.slots = ref.current.slots.map(slot => {
      if (slot.spent) return slot;
      const count = remaining.get(slot.load) ?? 0;
      if (count > 0) {
        remaining.set(slot.load, count - 1);
        return slot;
      }
      return { ...slot, spent: true };
    });
  }

  // (bullets.length === prevFaceUp): no change — return the existing layout.
  return ref.current.slots;
}
