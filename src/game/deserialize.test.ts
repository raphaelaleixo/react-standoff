import { describe, it, expect } from 'vitest';
import { normalizeGame } from './deserialize';

describe('normalizeGame variant fields', () => {
  it('round-trips Game.variants', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.variants.superPowers).toBe(true);
  });

  it('defaults variants to { superPowers: false, cop: false } when missing', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
    };
    const g = normalizeGame(raw);
    expect(g?.variants).toEqual({ superPowers: false, cop: false });
  });

  it('round-trips Player.effects', () => {
    const raw = {
      phase: 'in_progress',
      players: [{
        id: 'p1', displayName: 'p1', colorOrAvatar: 'calico_jack',
        bullets: [], cash: [], wounds: 0, shame: 0, status: 'alive',
        effects: [{ kind: 'unbreakable', revealed: false, used: false }],
      }],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.players[0].effects).toEqual([{ kind: 'unbreakable', revealed: false, used: false }]);
  });

  it('round-trips Round.activations', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'tough_reveal', phaseStartedAt: 100, loot: [],
        commits: {},
        activations: { tough: ['p1', 'p2'], specialist: { playerId: 'p3', discardedBulletKind: 'clic' } },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.activations.tough).toEqual(['p1', 'p2']);
    expect(g?.round.activations.specialist).toEqual({ playerId: 'p3', discardedBulletKind: 'clic' });
  });

  it('round-trips RoundResolution.powerActivations', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'split', phaseStartedAt: 100, loot: [],
        commits: {}, activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [],
          powerActivations: [{ playerId: 'p1', kind: 'dragon_skin' }],
        },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.resolution?.powerActivations).toEqual([{ playerId: 'p1', kind: 'dragon_skin' }]);
  });
});

describe('normalizeGame Insane fields', () => {
  it('round-trips Round.activations.insane', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 1, phase: 'standoff', phaseStartedAt: 100, loot: [],
        commits: {},
        activations: { insane: { playerId: 'p1' } },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.activations.insane).toEqual({ playerId: 'p1' });
  });

  it('round-trips RoundResolution.roundTerminated', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: {}, activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [],
          powerActivations: [],
          roundTerminated: { reason: 'grenade', playerId: 'p1' },
        },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.resolution?.roundTerminated).toEqual({ reason: 'grenade', playerId: 'p1' });
  });

  it('omits roundTerminated when not present', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 1, phase: 'commit', phaseStartedAt: 0, loot: [],
        commits: {}, activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false },
    };
    const g = normalizeGame(raw);
    expect(g?.round.resolution?.roundTerminated).toBeUndefined();
  });
});

describe('normalizeGame — cop variant fields', () => {
  it('round-trips Player.role', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', role: 'cop' }, { id: 'p2', role: 'mafia' }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].role).toBe('cop');
    expect(g.players[1].role).toBe('mafia');
  });

  it('drops invalid role values', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', role: 'cheese' }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].role).toBeUndefined();
  });

  it('round-trips Round.telephone', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'telephone', loot: [], commits: {}, activations: {},
        telephone: { used: true, holderOrder: ['a', 'b'] },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.round.telephone).toEqual({ used: true, holderOrder: ['a', 'b'] });
  });

  it('round-trips Round.telephone.currentHolderId when present', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'telephone', loot: [], commits: {}, activations: {},
        telephone: { used: false, holderOrder: ['a', 'b', 'c'], currentHolderId: 'b' },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.round.telephone).toEqual({
      used: false,
      holderOrder: ['a', 'b', 'c'],
      currentHolderId: 'b',
    });
  });

  it('round-trips Game.cop', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 5, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
      cop: { callsMade: 2, reinforcementsRoundOnTheWay: 4 },
    };
    const g = normalizeGame(raw)!;
    expect(g.cop).toEqual({ callsMade: 2, reinforcementsRoundOnTheWay: 4 });
  });

  it('round-trips GameVariants.cop default false when missing', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.variants).toEqual({ superPowers: true, cop: false });
  });

  it('round-trips ShameMarker[]', () => {
    const raw = {
      phase: 'in_progress',
      players: [{
        id: 'p1',
        shame: [{ flashing: true }, { flashing: false }],
      }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].shame).toEqual([{ flashing: true }, { flashing: false }]);
  });

  it('migrates legacy numeric shame to non-flashing markers', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', shame: 3 }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: false },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].shame).toEqual([
      { flashing: false },
      { flashing: false },
      { flashing: false },
    ]);
  });
});

describe('normalizeGame — no undefined fields (Firebase-safe)', () => {
  // Firebase RTDB rejects set()/update() patches containing any undefined
  // value. The deserializer must omit optional keys rather than setting
  // them to undefined explicitly, otherwise startNextRound(game) → fbSet
  // throws and leaves the game stuck.
  it('omits round.resolution when not present in raw', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: false },
    };
    const g = normalizeGame(raw)!;
    expect('resolution' in g.round).toBe(false);
  });

  it('omits cop.reinforcementsRoundOnTheWay when no 3rd call has landed', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
      cop: { callsMade: 1 },
    };
    const g = normalizeGame(raw)!;
    expect(g.cop).toBeDefined();
    expect('reinforcementsRoundOnTheWay' in g.cop!).toBe(false);
  });

  it('preserves cop.reinforcementsRoundOnTheWay when present', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 5, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
      cop: { callsMade: 3, reinforcementsRoundOnTheWay: 4 },
    };
    const g = normalizeGame(raw)!;
    expect(g.cop?.reinforcementsRoundOnTheWay).toBe(4);
  });
});
