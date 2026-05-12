import { describe, it, expect } from 'vitest';
import { dealPowers, eligibleForSpecialist, eligibleForTough } from './powers';
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
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map(id => makePlayer(id));
    const dealt = dealPowers(players, makeRng('seed-b'));
    const kinds = dealt.map(p => p.effects[0].kind);
    expect(new Set(kinds).size).toBe(6);
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
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
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
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
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
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
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
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
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

describe('eligibleForTough', () => {
  it('true: holder alive, in ducks, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { withdrew: true } },
        activations: {},
        resolution: {
          shots: [], ducks: ['p1'], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(true);
  });

  it('true: holder alive, wounded this round, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: { p1: 1 },
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(true);
  });

  it('false: holder already in standing (no need)', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: ['p1'], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(false);
  });

  it('false: holder eliminated this round', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: { p1: 3 },
          eliminated: ['p1'], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(false);
  });
});
