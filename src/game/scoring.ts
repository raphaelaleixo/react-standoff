import type { Player, PowerKind } from './types';

export function hasEffect(player: Player, kind: PowerKind): boolean {
  return player.effects.some(e => e.kind === kind);
}

export function finalScore(player: Player, totalKills: number): number {
  if (player.status === 'dead') return 0;
  const cashTotal = player.cash.reduce((s, b) => s + b.value, 0);
  const shameSign = hasEffect(player, 'super_coward') ? +1 : -1;
  const undertakerBonus = hasEffect(player, 'six_feet_under') ? 10_000 * totalKills : 0;
  return cashTotal + shameSign * 5_000 * player.shame + undertakerBonus;
}

export function rankPlayers(players: Player[], totalKills: number): Player[] {
  return [...players].sort((a, b) => {
    const sa = finalScore(a, totalKills);
    const sb = finalScore(b, totalKills);
    if (sa !== sb) return sb - sa;
    if (a.shame !== b.shame) return a.shame - b.shame;
    return b.wounds - a.wounds;
  });
}
