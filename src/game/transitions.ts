import type { Banknote, Game } from './types';

export function drawLoot(deck: Banknote[], count: number): { drawn: Banknote[]; remaining: Banknote[] } {
  const take = Math.min(count, deck.length);
  return { drawn: deck.slice(0, take), remaining: deck.slice(take) };
}

export function startNextRound(game: Game, now: number): Game {
  const carryover = game.round.resolution?.carryover ?? [];
  const { drawn, remaining } = drawLoot(game.bankDeck, 5);
  const next: Game = {
    ...game,
    round: {
      number: game.round.number + 1,
      phase: 'commit',
      phaseStartedAt: now,
      loot: [...drawn, ...carryover],
      commits: {},
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
