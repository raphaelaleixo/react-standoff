import { describe, it, expect } from 'vitest';
import { canArmTough, dealPowers, eligibleForSpecialist } from './powers';
import { POWER_KINDS } from './powerKinds';
import { makeRng } from './random';
import type { Game, Player } from './types';

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: ['clic', 'clic', 'clic', 'clic', 'clic', 'bang', 'bang', 'bang_bang_bang'],
    cash: [],
    wounds: 0,
    shame: 0,
    status: 'alive',
    effects: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    phase: 'in_progress',
    players: [],
    round: {
      number: 1,
      phase: 'commit',
      phaseStartedAt: 0,
      loot: [],
      commits: {},
      activations: {},
    },
    bankDeck: [],
    discardedBullets: [],
    seed: 'test',
    variants: { superPowers: true },
    ...overrides,
  };
}

describe('dealPowers', () => {
  it('deals one effect per player when variant on', () => {
    const players = [makePlayer('p1'), makePlayer('p2'), makePlayer('p3'), makePlayer('p4')];
    const dealt = dealPowers(players, makeRng('seed-a'));
    expect(dealt).toHaveLength(4);
    for (const p of dealt) {
      expect(p.effects).toHaveLength(1);
      expect(p.effects[0].revealed).toBe(false);
    }
  });

  it('deals unique powers (no duplicates across players)', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map(id => makePlayer(id));
    const dealt = dealPowers(players, makeRng('seed-b'));
    const kinds = dealt.map(p => p.effects[0].kind);
    expect(new Set(kinds).size).toBe(7);
  });

  it('is deterministic given the same RNG seed', () => {
    const players = ['p1', 'p2', 'p3', 'p4'].map(id => makePlayer(id));
    const a = dealPowers(players, makeRng('seed-c')).map(p => p.effects[0].kind);
    const b = dealPowers(players, makeRng('seed-c')).map(p => p.effects[0].kind);
    expect(a).toEqual(b);
  });

  it('does not mutate POWER_KINDS', () => {
    const before = [...POWER_KINDS];
    dealPowers([makePlayer('p1'), makePlayer('p2')], makeRng('seed-mut'));
    expect(POWER_KINDS).toEqual(before);
  });
});

describe('eligibleForSpecialist', () => {
  it('true: holder played B!B!B!, alive, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(true);
  });

  it('false: holder did not play B!B!B!', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });

  it('false: already used', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: true, used: true }],
      })],
      round: {
        number: 1, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });

  it('false: holder eliminated this round', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false }],
      })],
      round: {
        number: 1, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: ['p1'], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });
});

describe('canArmTough', () => {
  it('true: holder alive with unused unrevealed tough', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
    });
    expect(canArmTough(game, 'p1')).toBe(true);
  });

  it('false: tough already used', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: true, used: true }],
      })],
    });
    expect(canArmTough(game, 'p1')).toBe(false);
  });

  it('false: holder is dead', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        status: 'dead',
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
    });
    expect(canArmTough(game, 'p1')).toBe(false);
  });

  it('false: holder does not have tough', () => {
    const game = makeGame({
      players: [makePlayer('p1', { effects: [] })],
    });
    expect(canArmTough(game, 'p1')).toBe(false);
  });
});

