import { describe, it, expect } from 'vitest';
import { copWins, finalScore, gameOutcome, hasEffect, rankPlayers } from './scoring';
import type { Banknote, Game, Player } from './types';

const note = (id: string, value: 5000 | 10000 | 20000): Banknote => ({ id, value });

function pl(id: string, opts: Partial<Player> = {}): Player {
  return {
    id, displayName: id, colorOrAvatar: 'calico_jack',
    bullets: [], cash: [], wounds: 0, shame: [], status: 'alive',
    effects: [], ...opts,
  };
}

describe('hasEffect', () => {
  it('true when matching effect present', () => {
    const p = pl('p1', { effects: [{ kind: 'super_coward', revealed: false }] });
    expect(hasEffect(p, 'super_coward')).toBe(true);
  });
  it('false when no effects', () => {
    expect(hasEffect(pl('p1'), 'unbreakable')).toBe(false);
  });
});

describe('finalScore', () => {
  it('base formula: cash − $5k × shame', () => {
    const p = pl('p1', { cash: [note('a', 10000), note('b', 5000)], shame: [{ flashing: false }] });
    expect(finalScore(p, 0)).toBe(15000 - 5000);
  });

  it('Super Coward flips shame sign', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: [{ flashing: false }, { flashing: false }],
      effects: [{ kind: 'super_coward', revealed: false }],
    });
    expect(finalScore(p, 0)).toBe(10000 + 2 * 5000);
  });

  it('6 Feet Under: +$10k per total kill', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: [],
      effects: [{ kind: 'six_feet_under', revealed: false }],
    });
    expect(finalScore(p, 3)).toBe(10000 + 3 * 10000);
  });

  it('both held: stack', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: [{ flashing: false }],
      effects: [
        { kind: 'super_coward', revealed: false },
        { kind: 'six_feet_under', revealed: false },
      ],
    });
    expect(finalScore(p, 2)).toBe(10000 + 5000 + 2 * 10000);
  });
});

describe('rankPlayers (tiebreakers)', () => {
  it('orders by score descending', () => {
    const a = pl('a', { cash: [note('n', 20000)] });
    const b = pl('b', { cash: [note('n', 10000)] });
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['a', 'b']);
  });
  it('tie on score → fewer shame wins', () => {
    const a = pl('a', { cash: [note('n', 10000)], shame: [] });
    const b = pl('b', { cash: [note('n1', 10000), note('n2', 5000)], shame: [{ flashing: false }] });
    // both score $10k. a has fewer shame.
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['a', 'b']);
  });
  it('tie on score and shame → more wounds wins', () => {
    const a = pl('a', { cash: [note('n', 10000)], shame: [], wounds: 1 });
    const b = pl('b', { cash: [note('n', 10000)], shame: [], wounds: 2 });
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['b', 'a']);
  });
});

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id, displayName: id, colorOrAvatar: '#000',
    bullets: [], cash: [], wounds: 0, shame: [],
    status: 'alive', effects: [],
    ...overrides,
  };
}

function copGame(overrides: {
  players: Player[];
  callsMade?: 0 | 1 | 2 | 3;
  reinforcementsRoundOnTheWay?: number;
}): Game {
  return {
    phase: 'ended',
    players: overrides.players,
    round: {
      number: 8, phase: 'split', phaseStartedAt: 0,
      loot: [], commits: {}, activations: {},
    },
    bankDeck: [], discardedBullets: [], seed: 's',
    variants: { superPowers: false, cop: true },
    cop: {
      callsMade: overrides.callsMade ?? 0,
      reinforcementsRoundOnTheWay: overrides.reinforcementsRoundOnTheWay,
    },
  };
}

describe('copWins', () => {
  it('true when all three predicates hold (reinforcements + alive + ≤1 flashing)', () => {
    const cop = makePlayer('cop', { role: 'cop', shame: [{ flashing: false }, { flashing: true }] });
    const m1 = makePlayer('m1', { role: 'mafia' });
    const g = copGame({ players: [cop, m1], callsMade: 3, reinforcementsRoundOnTheWay: 5 });
    expect(copWins(g)).toBe(true);
  });

  it('true with 0 flashing shame markers', () => {
    const cop = makePlayer('cop', { role: 'cop', shame: [{ flashing: false }] });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(true);
  });

  it('false when reinforcements never arrived', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 2 });
    expect(copWins(g)).toBe(false);
  });

  it('false when cop is dead', () => {
    const cop = makePlayer('cop', { role: 'cop', status: 'dead', wounds: 3 });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });

  it('false when cop took 2 flashing-light shame markers', () => {
    const cop = makePlayer('cop', {
      role: 'cop',
      shame: [{ flashing: true }, { flashing: true }],
    });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });

  it('sole-survivor clause: cop wins as the only player alive even without reinforcements', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const m1 = makePlayer('m1', { role: 'mafia', status: 'dead', wounds: 3 });
    const m2 = makePlayer('m2', { role: 'mafia', status: 'dead', wounds: 3 });
    const g = copGame({ players: [cop, m1, m2], callsMade: 0 });
    expect(copWins(g)).toBe(true);
  });

  it('false when variant is off', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    g.variants.cop = false;
    expect(copWins(g)).toBe(false);
  });

  it('false when no cop in player list', () => {
    const m1 = makePlayer('m1', { role: 'mafia' });
    const g = copGame({ players: [m1], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });
});

describe('gameOutcome', () => {
  it('returns cop-win when copWins is true', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(gameOutcome(g, 0)).toEqual({ kind: 'cop_wins', winnerId: 'cop' });
  });

  it('returns mafia-rich when copWins is false (cop variant on)', () => {
    const cop = makePlayer('cop', { role: 'cop', cash: [{ id: 'n', value: 5000 }] });
    const m1 = makePlayer('m1', { role: 'mafia', cash: [{ id: 'n2', value: 20000 }] });
    const g = copGame({ players: [cop, m1], callsMade: 1 });
    expect(gameOutcome(g, 0)).toEqual({ kind: 'mafia_wins', winnerId: 'm1' });
  });

  it('returns base ranking when cop variant off', () => {
    const a = makePlayer('a', { cash: [{ id: 'n', value: 20000 }] });
    const b = makePlayer('b', { cash: [{ id: 'n2', value: 10000 }] });
    const g = copGame({ players: [a, b], callsMade: 0 });
    g.variants.cop = false;
    g.cop = undefined;
    expect(gameOutcome(g, 0)).toEqual({ kind: 'base', winnerId: 'a' });
  });
});
