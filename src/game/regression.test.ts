import { describe, it, expect } from 'vitest';
import { resolveRound } from './resolver';
import type { Banknote, Commit, Player } from './types';

function pl(id: string, wounds: 0|1|2|3|4 = 0): Player {
  return {
    id, displayName: id, colorOrAvatar: 'calico_jack',
    bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
    cash: [], wounds, shame: 0, status: 'alive', effects: [],
  };
}
const note = (id: string, value: 5000|10000|20000): Banknote => ({ id, value });

describe('variant-off parity (no effects, no activations)', () => {
  it('resolveRound output matches expected base behaviour', () => {
    const players = [pl('p1'), pl('p2'), pl('p3'), pl('p4')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p4' },
      p4: { withdrew: true },
    };
    const loot = [note('a', 10000), note('b', 10000), note('c', 5000)];
    const { resolution } = resolveRound(commits, players, loot, {});
    expect(resolution.powerActivations).toEqual([]);
    expect(resolution.eliminated).toEqual([]);
    expect(resolution.ducks).toEqual(['p4']);
    expect(Object.keys(resolution.awards).sort()).toEqual(['p1', 'p3']);
  });
});

describe('variant-off parity: stray Insane activation', () => {
  it('activations.insane present on a player without the effect: no grenade math', () => {
    const players = [pl('p1'), pl('p2'), pl('p3'), pl('p4')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p4' },
      p4: { bullet: 'clic', target: 'p3' },
    };
    const { resolution } = resolveRound(commits, players, [], { insane: { playerId: 'p1' } });
    expect(resolution.roundTerminated).toBeUndefined();
    expect(resolution.powerActivations.some(a => a.kind === 'insane')).toBe(false);
    // Only the bang's wound should land — no grenade pile-on.
    expect(resolution.woundedThisRound.p1).toBe(1);
    expect(resolution.woundedThisRound.p3).toBeUndefined();
    expect(resolution.woundedThisRound.p4).toBeUndefined();
  });
});
