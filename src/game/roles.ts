import { shuffle } from './random';
import type { Player, Role } from './types';

export const ROLES_FOR_PLAYER_COUNT: Record<number, Role[]> = {
  5: ['cop', 'mafia', 'mafia', 'mafia', 'mafia'],
  6: ['cop', 'mafia', 'mafia', 'mafia', 'mafia', 'mafia'],
};

export function dealRoles(players: Player[], rng: () => number): Player[] {
  const deck = ROLES_FOR_PLAYER_COUNT[players.length];
  if (!deck) {
    // Defensive: variant should only be enabled at 5-6 in the lobby.
    // If it slips through, fall through to no-role assignment so the
    // game still runs without crashing.
    return players;
  }
  const shuffled = shuffle([...deck], rng);
  return players.map((p, i) => ({ ...p, role: shuffled[i] }));
}

export function findCop(players: Player[]): Player | undefined {
  return players.find(p => p.role === 'cop');
}

export function isCop(player: Player | undefined): boolean {
  return player?.role === 'cop';
}
