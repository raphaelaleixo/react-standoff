import { describe, it, expect } from 'vitest';
import { dealRoles, findCop, isCop } from './roles';
import { makeRng } from './random';
import type { Player } from './types';

function makePlayer(id: string): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: '#000',
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive',
    effects: [],
  };
}

describe('dealRoles', () => {
  it('deals exactly one cop and N-1 mafia at 5 players', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('seed-1'));
    expect(dealt).toHaveLength(5);
    const cops = dealt.filter(p => p.role === 'cop');
    const mafia = dealt.filter(p => p.role === 'mafia');
    expect(cops).toHaveLength(1);
    expect(mafia).toHaveLength(4);
  });

  it('deals exactly one cop and N-1 mafia at 6 players', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('seed-2'));
    expect(dealt.filter(p => p.role === 'cop')).toHaveLength(1);
    expect(dealt.filter(p => p.role === 'mafia')).toHaveLength(5);
  });

  it('is deterministic by seed', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const a = dealRoles(players, makeRng('determ-seed'));
    const b = dealRoles(players, makeRng('determ-seed'));
    expect(a.map(p => p.role)).toEqual(b.map(p => p.role));
  });

  it('different seeds produce different cop assignments (probabilistically)', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const copIds = seeds.map(s => dealRoles(players, makeRng(s)).find(p => p.role === 'cop')?.id);
    const distinct = new Set(copIds);
    // Across 8 seeds we should land on at least 2 distinct cops.
    expect(distinct.size).toBeGreaterThanOrEqual(2);
  });

  it('returns players unmodified when count is unsupported', () => {
    const players = ['a', 'b', 'c'].map(makePlayer); // 3 players — not 5 or 6
    const dealt = dealRoles(players, makeRng('s'));
    expect(dealt.every(p => p.role === undefined)).toBe(true);
  });

  it('preserves all other player fields', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    players[0].displayName = 'Alice';
    players[0].cash = [{ id: 'n1', value: 10000 }];
    const dealt = dealRoles(players, makeRng('s'));
    expect(dealt[0].displayName).toBe('Alice');
    expect(dealt[0].cash).toEqual([{ id: 'n1', value: 10000 }]);
  });
});

describe('findCop / isCop', () => {
  it('findCop returns the player with role=cop', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('s'));
    const cop = findCop(dealt);
    expect(cop).toBeDefined();
    expect(cop?.role).toBe('cop');
  });

  it('findCop returns undefined when no cop assigned', () => {
    const players = ['a', 'b'].map(makePlayer);
    expect(findCop(players)).toBeUndefined();
  });

  it('isCop returns true only for role=cop', () => {
    const cop = { ...makePlayer('x'), role: 'cop' as const };
    const mafia = { ...makePlayer('y'), role: 'mafia' as const };
    expect(isCop(cop)).toBe(true);
    expect(isCop(mafia)).toBe(false);
    expect(isCop(undefined)).toBe(false);
  });
});
