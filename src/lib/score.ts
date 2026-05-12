import type { Player } from "../game/types";

// One unit of shame costs the player a fixed amount at the reckoning. The same
// constant drives the breakdown line in the EndGameRow (e.g. "− $5,000 (II
// streaks)") and the netScore tally that the ReckoningScreen ranks by.
export const SHAME_PENALTY = 5000;

export function cashTotal(p: Player): number {
  return p.cash.reduce((s, n) => s + n.value, 0);
}

export function shamePenalty(p: Player): number {
  return SHAME_PENALTY * p.shame;
}

export function netScore(p: Player): number {
  return cashTotal(p) - shamePenalty(p);
}

// Dead players sort to the bottom regardless of cash, then by net score, then
// by fewer-shame (cleaner mutiny wins ties), then by more-wounds (the bloodied
// underdog over the unscarred). Shared between the big-screen ReckoningScreen
// and the phone-side end-game view so both surfaces rank seats identically.
export function compareForRanking(a: Player, b: Player): number {
  const aDead = a.status !== "alive";
  const bDead = b.status !== "alive";
  if (aDead !== bDead) return aDead ? 1 : -1;
  const ds = netScore(b) - netScore(a);
  if (ds !== 0) return ds;
  const dShame = a.shame - b.shame;
  if (dShame !== 0) return dShame;
  return b.wounds - a.wounds;
}
