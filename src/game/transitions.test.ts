import { describe, expect, test } from 'vitest';
import type { Banknote, Game, Player, RoundResolution } from './types';
import { drawLoot, endGameStatus, startNextRound } from './transitions';

let nid = 0;
const note = (value: Banknote['value']): Banknote => ({ id: `n${nid++}`, value });

const player = (id: string, opts: Partial<Player> = {}): Player => ({
  id,
  displayName: id,
  colorOrAvatar: '#000',
  bullets: [],
  cash: opts.cash ?? [],
  wounds: opts.wounds ?? 0,
  shame: opts.shame ?? 0,
  status: opts.status ?? 'alive',
  effects: [],
});

const baseGame = (overrides: Partial<Game> = {}): Game => ({
  phase: 'in_progress',
  players: [player('A'), player('B'), player('C'), player('D')],
  round: {
    number: 1,
    phase: 'split',
    phaseStartedAt: 0,
    loot: [],
    commits: {},
    activations: {},
  },
  bankDeck: [],
  discardedBullets: [],
  seed: 'test',
  variants: { superPowers: false },
  ...overrides,
});

describe('drawLoot', () => {
  test('draws requested count from the top, returns rest', () => {
    const deck = [note(5000), note(10000), note(20000)];
    const { drawn, remaining } = drawLoot(deck, 2);
    expect(drawn).toHaveLength(2);
    expect(drawn[0].value).toBe(5000);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].value).toBe(20000);
  });

  test('returns whatever remains when deck has fewer than requested', () => {
    const deck = [note(5000), note(10000)];
    const { drawn, remaining } = drawLoot(deck, 5);
    expect(drawn).toHaveLength(2);
    expect(remaining).toEqual([]);
  });
});

describe('startNextRound', () => {
  test('increments round number, sets phase commit, clears commits, sets phaseStartedAt', () => {
    const game = baseGame({
      round: {
        number: 3,
        phase: 'split',
        phaseStartedAt: 0,
        loot: [],
        commits: { A: { withdrew: true } },
        activations: {},
      },
      bankDeck: [note(5000), note(5000), note(10000), note(10000), note(20000)],
    });
    const next = startNextRound(game, 12345);
    expect(next.round.number).toBe(4);
    expect(next.round.phase).toBe('commit');
    expect(next.round.commits).toEqual({});
    expect(next.round.phaseStartedAt).toBe(12345);
  });

  test('round loot is fresh-drawn 5 notes followed by previous-round carryover', () => {
    const carryNote = note(20000);
    const resolution: RoundResolution = {
      shots: [], ducks: [], standing: [], woundedThisRound: {}, eliminated: [],
      awards: {}, carryover: [carryNote], powerActivations: [],
    };
    const game = baseGame({
      round: {
        number: 1,
        phase: 'split',
        phaseStartedAt: 0,
        loot: [carryNote],
        commits: {},
        activations: {},
        resolution,
      },
      bankDeck: [note(5000), note(5000), note(5000), note(5000), note(5000), note(10000)],
    });
    const next = startNextRound(game, 0);
    expect(next.round.loot).toHaveLength(6);
    expect(next.round.loot.slice(0, 5).every(n => n.value === 5000)).toBe(true);
    expect(next.round.loot[5]).toBe(carryNote);
    expect(next.bankDeck).toHaveLength(1);
    expect(next.bankDeck[0].value).toBe(10000);
  });

  test('handles deck with fewer than 5 notes (late-game)', () => {
    const game = baseGame({
      bankDeck: [note(5000), note(5000)],
    });
    const next = startNextRound(game, 0);
    expect(next.round.loot).toHaveLength(2);
    expect(next.bankDeck).toEqual([]);
  });

  test('captures outgoing round\'s resolution as previousRoundSummary', () => {
    const resolution: RoundResolution = {
      shots: [{ shooter: 'A', target: 'B', card: 'bang', outcome: 'hit' }],
      ducks: ['C'], standing: ['A'],
      woundedThisRound: { B: 1 }, eliminated: [],
      awards: { A: [note(10000)] }, carryover: [], powerActivations: [],
    };
    const game = baseGame({
      round: { ...baseGame().round, number: 3, resolution },
    });
    const next = startNextRound(game, 0);
    expect(next.previousRoundSummary).toEqual({ round: 3, resolution });
  });

  test('leaves previousRoundSummary undefined when outgoing round has no resolution (e.g. interrupted round)', () => {
    const game = baseGame();
    const next = startNextRound(game, 0);
    expect(next.previousRoundSummary).toBeUndefined();
  });
});

describe('endGameStatus', () => {
  test('continues when 4 alive in round 3', () => {
    const game = baseGame({ round: { ...baseGame().round, number: 3 } });
    expect(endGameStatus(game)).toEqual({ ended: false });
  });

  test('ends with all_rounds when 8 rounds completed and >1 alive', () => {
    const game = baseGame({ round: { ...baseGame().round, number: 8 } });
    expect(endGameStatus(game)).toEqual({ ended: true, reason: 'all_rounds' });
  });

  test('ends with last_alive when only one player remains alive (early game)', () => {
    const game = baseGame({
      round: { ...baseGame().round, number: 3 },
      players: [
        player('A'),
        player('B', { status: 'dead', wounds: 3 }),
        player('C', { status: 'dead', wounds: 3 }),
        player('D', { status: 'dead', wounds: 3 }),
      ],
    });
    expect(endGameStatus(game)).toEqual({ ended: true, reason: 'last_alive' });
  });

  test('ends with no_alive when zero players remain alive', () => {
    const game = baseGame({
      players: [
        player('A', { status: 'dead', wounds: 3 }),
        player('B', { status: 'dead', wounds: 3 }),
      ],
    });
    expect(endGameStatus(game)).toEqual({ ended: true, reason: 'no_alive' });
  });

  test('last_alive takes priority over all_rounds in round 8', () => {
    const game = baseGame({
      round: { ...baseGame().round, number: 8 },
      players: [
        player('A'),
        player('B', { status: 'dead', wounds: 3 }),
        player('C', { status: 'dead', wounds: 3 }),
        player('D', { status: 'dead', wounds: 3 }),
      ],
    });
    expect(endGameStatus(game)).toEqual({ ended: true, reason: 'last_alive' });
  });
});

describe('startNextRound variants & activations', () => {
  const variantBaseGame = (): Game => ({
    phase: 'in_progress',
    players: [],
    round: {
      number: 1,
      phase: 'split',
      phaseStartedAt: 0,
      loot: [],
      commits: { p1: { bullet: 'bang', target: 'p2' } },
      activations: { tough: ['p3'] },
      resolution: {
        shots: [], ducks: [], standing: [], woundedThisRound: {},
        eliminated: [], awards: {}, carryover: [], powerActivations: [],
      },
    },
    bankDeck: [],
    discardedBullets: [],
    seed: 's',
    variants: { superPowers: true },
  });

  test('preserves Game.variants across rounds', () => {
    const next = startNextRound(variantBaseGame(), 1000);
    expect(next.variants).toEqual({ superPowers: true });
  });

  test('resets Round.activations to {} on the new round', () => {
    const next = startNextRound(variantBaseGame(), 1000);
    expect(next.round.activations).toEqual({});
  });

  test('preserves variants when superPowers is false', () => {
    const g = variantBaseGame();
    g.variants = { superPowers: false };
    const next = startNextRound(g, 1000);
    expect(next.variants).toEqual({ superPowers: false });
  });
});
