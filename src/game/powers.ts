import { shuffle } from './random';
import type { Game, Player, PowerEffect, PowerKind } from './types';
import { POWER_KINDS, PUBLIC_POWER_KINDS } from './powerKinds';

export function dealPowers(players: Player[], rng: () => number): Player[] {
  const shuffled = shuffle([...POWER_KINDS], rng);
  return players.map((p, i) => {
    if (i >= shuffled.length) return { ...p, effects: [] };
    const kind = shuffled[i];
    const effect: PowerEffect = { kind, revealed: PUBLIC_POWER_KINDS.has(kind), used: false };
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

// Commit-time gate: can this player pre-arm Tough on their commit? Tough
// is now bundled into the commit picker instead of a mid-resolve prompt,
// so the only thing we need to check is that the holder is alive and the
// card is still unused.
export function canArmTough(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'tough')) return false;
  return true;
}

