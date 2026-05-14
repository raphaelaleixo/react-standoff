import type { Banknote, BulletCard, Game, GameVariants, Player, Round } from './types';
import { makeRng, shuffle } from './random';
import { dealPowers } from './powers';
import { dealRoles } from './roles';

export const STARTING_HAND: BulletCard[] = [
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

const DEFAULT_VARIANTS: GameVariants = { superPowers: false, cop: false };

export function initGame(
  players: Player[],
  seed: string,
  now: number,
  variants: GameVariants = DEFAULT_VARIANTS,
): Game {
  const rng = makeRng(seed);
  const shuffledDeck = shuffle(buildBankDeck(), rng);
  const loot = shuffledDeck.slice(0, 5);
  const bankDeck = shuffledDeck.slice(5);

  const baseDealt: Player[] = players.map(p => ({
    ...p,
    bullets: [...STARTING_HAND],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive',
    effects: [],
  }));

  // Wave 1: cop and super-powers are mutually exclusive at the lobby
  // toggle, so we deal at most one of them. If both flags somehow
  // landed true, super-powers wins (it shipped first).
  let dealtPlayers = baseDealt;
  if (variants.superPowers) {
    dealtPlayers = dealPowers(baseDealt, rng);
  } else if (variants.cop) {
    dealtPlayers = dealRoles(baseDealt, rng);
  }

  const round: Round = {
    number: 1,
    phase: 'commit',
    phaseStartedAt: now,
    loot,
    commits: {},
    activations: {},
  };

  const game: Game = {
    phase: 'in_progress',
    players: dealtPlayers,
    round,
    bankDeck,
    discardedBullets: [],
    seed,
    variants,
  };

  if (variants.cop) {
    game.cop = { callsMade: 0 };
  }

  return game;
}
