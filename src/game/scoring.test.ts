import { describe, it, expect } from 'vitest';
import { finalScore, hasEffect, rankPlayers } from './scoring';
import type { Banknote, Player } from './types';

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
