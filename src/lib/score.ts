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
