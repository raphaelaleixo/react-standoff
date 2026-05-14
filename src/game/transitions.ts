import type { Banknote, Game, Player } from './types';

export function drawLoot(deck: Banknote[], count: number): { drawn: Banknote[]; remaining: Banknote[] } {
  const take = Math.min(count, deck.length);
  return { drawn: deck.slice(0, take), remaining: deck.slice(take) };
}

export function startNextRound(game: Game, now: number): Game {
  const carryover = game.round.resolution?.carryover ?? [];
  const { drawn, remaining } = drawLoot(game.bankDeck, 5);
  const next: Game = {
    ...game,
    variants: game.variants,
    round: {
      number: game.round.number + 1,
      phase: 'commit',
      phaseStartedAt: now,
      loot: [...drawn, ...carryover],
      commits: {},
      activations: {},
    },
    bankDeck: remaining,
  };
  if (game.round.resolution) {
    next.previousRoundSummary = {
      round: game.round.number,
      resolution: game.round.resolution,
    };
  }
  return next;
}

export type EndGameReason = 'all_rounds' | 'last_alive' | 'no_alive';

export function endGameStatus(game: Game): { ended: boolean; reason?: EndGameReason } {
  const aliveCount = game.players.filter(p => p.status === 'alive').length;
  if (aliveCount === 0) return { ended: true, reason: 'no_alive' };
  if (aliveCount === 1) return { ended: true, reason: 'last_alive' };
  if (game.round.number >= 8) return { ended: true, reason: 'all_rounds' };
  return { ended: false };
}

export function shouldRunTelephonePhase(game: Game): boolean {
  if (!game.variants.cop) return false;
  if (game.round.number > 6) return false;
  const standing = game.round.resolution?.standing ?? [];
  return standing.length > 0;
}

export function telephoneHolderOrder(game: Game): string[] {
  const standingSet = new Set(game.round.resolution?.standing ?? []);
  // Seat order = order of game.players. Among those, keep only standing.
  return game.players.filter(p => standingSet.has(p.id)).map(p => p.id);
}

// Flip every player's effects[].revealed to true. Used at game-end so the
// reckoning reveal can surface previously-unrevealed powers in the same
// beat as the role-reveal flip.
export function revealAllEffects(players: Player[]): Player[] {
  return players.map(p => ({
    ...p,
    effects: p.effects.map(e => (e.revealed ? e : { ...e, revealed: true })),
  }));
}
