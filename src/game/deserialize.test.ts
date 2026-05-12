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

  it('defaults variants to { superPowers: false } when missing', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
    };
    const g = normalizeGame(raw);
    expect(g?.variants).toEqual({ superPowers: false });
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
        number: 2, phase: 'tough_prompt', phaseStartedAt: 100, loot: [],
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
