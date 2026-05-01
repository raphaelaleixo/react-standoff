import type { Banknote, BulletCard, Game, Player, Round } from './types';
import { makeRng, shuffle } from './random';

const STARTING_HAND: BulletCard[] = [
  'clic', 'clic', 'clic', 'clic', 'clic',
  'bang', 'bang',
  'bang_bang_bang',
];

const BANK_NOTE_VALUES: Banknote['value'][] = [
  ...Array(15).fill(5000),
  ...Array(15).fill(10000),
  ...Array(10).fill(20000),
];

export function buildBankDeck(): Banknote[] {
  return BANK_NOTE_VALUES.map((value, i) => ({ id: `n${i}`, value }));
}

export function initGame(players: Player[], seed: string, now: number): Game {
  const rng = makeRng(seed);
  const shuffledDeck = shuffle(buildBankDeck(), rng);
  const loot = shuffledDeck.slice(0, 5);
  const bankDeck = shuffledDeck.slice(5);

  const dealtPlayers: Player[] = players.map(p => ({
    ...p,
    bullets: [...STARTING_HAND],
    cash: [],
    wounds: 0,
    shame: 0,
    status: 'alive',
    effects: [],
  }));

  const round: Round = {
    number: 1,
    phase: 'commit',
    phaseStartedAt: now,
    loot,
    commits: {},
  };

  return {
    phase: 'in_progress',
    players: dealtPlayers,
    round,
    bankDeck,
    discardedBullets: [],
    seed,
  };
}
