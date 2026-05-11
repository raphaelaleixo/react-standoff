import { shuffle } from './random';
import type { Game, Player, PowerEffect, PowerKind } from './types';
import { POWER_KINDS } from '../components/powers/registry';

export function dealPowers(players: Player[], rng: () => number): Player[] {
  const shuffled = shuffle([...POWER_KINDS], rng);
  return players.map((p, i) => {
    if (i >= shuffled.length) return { ...p, effects: [] };
    const effect: PowerEffect = { kind: shuffled[i], revealed: false, used: false };
    return { ...p, effects: [effect] };
  });
}

function findPower(player: Player | undefined, kind: PowerKind): PowerEffect | undefined {
  return player?.effects.find(e => e.kind === kind);
}

export function hasUnusedPower(player: Player | undefined, kind: PowerKind): boolean {
  const e = findPower(player, kind);
  return !!e && !e.used;
}

export function eligibleForSpecialist(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'specialist')) return false;
  if (game.round.commits[playerId]?.bullet !== 'bang_bang_bang') return false;
  if (game.round.resolution?.eliminated.includes(playerId)) return false;
  return true;
}

export function eligibleForTough(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'tough')) return false;
  const resolution = game.round.resolution;
  if (!resolution) return false;
  if (resolution.eliminated.includes(playerId)) return false;
  if (resolution.standing.includes(playerId)) return false;
  const ducked = resolution.ducks.includes(playerId);
  const wounded = (resolution.woundedThisRound[playerId] ?? 0) > 0;
  return ducked || wounded;
}
