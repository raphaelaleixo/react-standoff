import type { Game, Player, PowerKind } from './types';

export function hasEffect(player: Player, kind: PowerKind): boolean {
  return player.effects.some(e => e.kind === kind);
}

export function finalScore(player: Player, totalKills: number): number {
  if (player.status === 'dead') return 0;
  const cashTotal = player.cash.reduce((s, b) => s + b.value, 0);
  const shameSign = hasEffect(player, 'super_coward') ? +1 : -1;
  const shameCount = player.shame.length;
  const undertakerBonus = hasEffect(player, 'six_feet_under') ? 10_000 * totalKills : 0;
  return cashTotal + shameSign * 5_000 * shameCount + undertakerBonus;
}

export function rankPlayers(players: Player[], totalKills: number): Player[] {
  return [...players].sort((a, b) => {
    const sa = finalScore(a, totalKills);
    const sb = finalScore(b, totalKills);
    if (sa !== sb) return sb - sa;
    if (a.shame.length !== b.shame.length) return a.shame.length - b.shame.length;
    return b.wounds - a.wounds;
  });
}

export function copWins(game: Game): boolean {
  if (!game.variants.cop) return false;
  const cop = game.players.find(p => p.role === 'cop');
  if (!cop) return false;
  // Sole-survivor clause: if every other player is dead and the cop is alive,
  // they win regardless of the call mission.
  const alive = game.players.filter(p => p.status === 'alive');
  if (game.players.length > 1 && alive.length === 1 && alive[0].id === cop.id) return true;
  // Primary win: reinforcements landed + cop alive + ≤1 flashing shame.
  if (cop.status !== 'alive') return false;
  if (game.cop?.reinforcementsRoundOnTheWay === undefined) return false;
  const flashingShame = cop.shame.filter(s => s.flashing).length;
  if (flashingShame > 1) return false;
  return true;
}

export type GameOutcome =
  | { kind: 'cop_wins'; winnerId: string }
  | { kind: 'mafia_wins'; winnerId: string }
  | { kind: 'base'; winnerId: string };

export function gameOutcome(game: Game, totalKills: number): GameOutcome {
  if (game.variants.cop) {
    if (copWins(game)) {
      const cop = game.players.find(p => p.role === 'cop')!;
      return { kind: 'cop_wins', winnerId: cop.id };
    }
    // Cop variant on but cop didn't win → richest *alive* mafia wins by
    // base scoring rules over the alive mafia subset.
    const aliveMafia = game.players.filter(p => p.role === 'mafia' && p.status === 'alive');
    const winner = rankPlayers(aliveMafia, totalKills)[0];
    return { kind: 'mafia_wins', winnerId: winner?.id ?? '' };
  }
  // Variant off → base ranking over all alive players.
  const aliveAll = game.players.filter(p => p.status === 'alive');
  const winner = rankPlayers(aliveAll, totalKills)[0];
  return { kind: 'base', winnerId: winner?.id ?? '' };
}
