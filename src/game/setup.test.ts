import { describe, expect, test } from 'vitest';
import type { Player } from './types';
import { buildBankDeck, initGame } from './setup';

const lobbyPlayer = (id: string): Player => ({
  id,
  displayName: id,
  colorOrAvatar: '#000',
  bullets: [],
  cash: [],
  wounds: 0,
  shame: [],
  status: 'alive',
  effects: [],
});

describe('buildBankDeck', () => {
  test('produces 40 unique-id banknotes with correct denomination distribution', () => {
    const deck = buildBankDeck();
    expect(deck).toHaveLength(40);

    const ids = new Set(deck.map(n => n.id));
    expect(ids.size).toBe(40);

    const counts = { 5000: 0, 10000: 0, 20000: 0 };
    for (const n of deck) counts[n.value] += 1;
    expect(counts).toEqual({ 5000: 15, 10000: 15, 20000: 10 });
  });
});

describe('initGame', () => {
  test('phase is in_progress and round 1 is in commit phase', () => {
    const game = initGame([lobbyPlayer('A'), lobbyPlayer('B'), lobbyPlayer('C'), lobbyPlayer('D')], 'seed', 1000);
    expect(game.phase).toBe('in_progress');
    expect(game.round.number).toBe(1);
    expect(game.round.phase).toBe('commit');
    expect(game.round.commits).toEqual({});
    expect(game.round.phaseStartedAt).toBe(1000);
  });

  test('every player gets the standard starting hand of 8 bullets', () => {
    const game = initGame([lobbyPlayer('A'), lobbyPlayer('B')], 'seed', 0);
    for (const p of game.players) {
      expect(p.bullets).toHaveLength(8);
      const counts = { clic: 0, bang: 0, bang_bang_bang: 0 };
      for (const b of p.bullets) counts[b] += 1;
      expect(counts).toEqual({ clic: 5, bang: 2, bang_bang_bang: 1 });
    }
  });

  test('player game-state fields are reset (wounds, cash, shame, status, effects)', () => {
    const dirtyPlayer: Player = {
      ...lobbyPlayer('A'),
      wounds: 2,
      cash: [{ id: 'leftover', value: 5000 }],
      shame: [{ flashing: false }],
      status: 'dead',
      effects: [{ kind: 'tough', revealed: true, used: true }],
    };
    const game = initGame([dirtyPlayer], 'seed', 0);
    const p = game.players[0];
    expect(p.wounds).toBe(0);
    expect(p.cash).toEqual([]);
    expect(p.shame).toEqual([]);
    expect(p.status).toBe('alive');
    expect(p.effects).toEqual([]);
  });

  test('round 1 loot has 5 banknotes drawn from the top of the shuffled deck', () => {
    const game = initGame([lobbyPlayer('A')], 'seed', 0);
    expect(game.round.loot).toHaveLength(5);
    expect(game.bankDeck).toHaveLength(35);
    const inDeckIds = new Set(game.bankDeck.map(n => n.id));
    for (const n of game.round.loot) {
      expect(inDeckIds.has(n.id)).toBe(false);
    }
  });

  test('same seed produces the same loot order (server-authoritative reproducibility)', () => {
    const a = initGame([lobbyPlayer('A')], 'seed-X', 0);
    const b = initGame([lobbyPlayer('A')], 'seed-X', 0);
    expect(a.round.loot).toEqual(b.round.loot);
    expect(a.bankDeck).toEqual(b.bankDeck);
  });

  test('discardedBullets starts empty and seed is persisted', () => {
    const game = initGame([lobbyPlayer('A')], 'my-seed', 0);
    expect(game.discardedBullets).toEqual([]);
    expect(game.seed).toBe('my-seed');
  });
});

describe('initGame variants', () => {
  const samplePlayer = (id: string): Player => ({
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive',
    effects: [],
  });

  test('variant off: every player has empty effects (regression)', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-off',
      0,
      { superPowers: false, cop: false },
    );
    for (const p of game.players) expect(p.effects).toEqual([]);
    expect(game.variants.superPowers).toBe(false);
  });

  test('variant on: every player has exactly one PowerEffect, public ones revealed', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-on',
      0,
      { superPowers: true, cop: false },
    );
    for (const p of game.players) {
      expect(p.effects).toHaveLength(1);
      const e = p.effects[0];
      // Dead Eye / Bloodhound are revealed on deal — their mechanic
      // changes the visible commit flow, so hiding them makes no sense.
      // Every other power starts hidden.
      const shouldBeRevealed = e.kind === 'the_kid' || e.kind === 'the_cunning';
      expect(e.revealed).toBe(shouldBeRevealed);
      expect(e.used).toBe(false);
    }
    expect(game.variants.superPowers).toBe(true);
  });

  test('Round.activations starts as empty record', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-act',
      0,
      { superPowers: true, cop: false },
    );
    expect(game.round.activations).toEqual({});
  });
});
