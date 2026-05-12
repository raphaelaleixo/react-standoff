import type { BulletCard } from "../game/types";
import { STARTING_HAND } from "../game/setup";

export interface HandSlot {
  load: BulletCard;
  spent: boolean;
}

const KINDS: BulletCard[] = ["clic", "bang", "bang_bang_bang"];

function countByKind(bullets: BulletCard[]): Record<BulletCard, number> {
  const counts: Record<BulletCard, number> = { clic: 0, bang: 0, bang_bang_bang: 0 };
  for (const b of bullets) counts[b]++;
  return counts;
}

// Pure derivation of the player's hand layout from their current bullets
// and the fixed starting hand. Slots are always in canonical order — five
// clic slots first, then two bang, then bang_bang_bang. Within each kind,
// face-up cards come before spent ones. Because spent is derived from
// STARTING_HAND minus what's in `bullets`, the layout is fully reload-
// stable and doesn't need any cached state.
//
// `extraSpent` is a mock-only override that lets the dev page demo the
// spent visual on cards that are still in `bullets`. Production never
// passes it.
//
// Kept as `useHandSlots` (hook-shaped) only for backwards-compatible
// callers; the function is pure and could equally be called outside a
// React component.
export function useHandSlots(
  bullets: BulletCard[],
  extraSpent: BulletCard[] = [],
): HandSlot[] {
  const starting = countByKind(STARTING_HAND);
  const remaining = countByKind(bullets);
  const extras = countByKind(extraSpent);

  const slots: HandSlot[] = [];
  for (const kind of KINDS) {
    // `extraSpent` shifts a card from face-up into spent without changing
    // the underlying bullet count, so the visual flips while gameplay
    // state stays put. Production callers never pass it.
    const stillHave = Math.max(0, remaining[kind] - extras[kind]);
    const spent = Math.max(0, starting[kind] - stillHave);
    for (let i = 0; i < stillHave; i++) slots.push({ load: kind, spent: false });
    for (let i = 0; i < spent; i++) slots.push({ load: kind, spent: true });
  }
  return slots;
}
