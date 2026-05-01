import { describe, expect, test } from 'vitest';
import type { Banknote } from './types';
import { splitLoot } from './split';

let nextId = 0;
const note = (value: Banknote['value']): Banknote => ({
  id: `n${nextId++}`,
  value,
});
const notes = (...values: Banknote['value'][]): Banknote[] => values.map(note);

const valuesOf = (b: Banknote[]) => b.map(n => n.value);

describe('splitLoot — tier 1 (trivial paths)', () => {
  test('zero standing players: nothing distributed, all carries over', () => {
    const loot = notes(20000, 10000);
    expect(splitLoot(loot, [])).toEqual({
      awards: {},
      carryover: loot,
    });
  });

  test('one standing player takes all loot', () => {
    const loot = notes(20000, 10000, 5000);
    const result = splitLoot(loot, ['A']);
    expect(result.carryover).toEqual([]);
    expect(result.awards).toEqual({ A: loot });
  });
});

describe('splitLoot — tier 2 (even split, no backtrack on X)', () => {
  test('trivial even split with single denomination', () => {
    const loot = notes(10000, 10000, 10000);
    const result = splitLoot(loot, ['A', 'B', 'C']);
    expect(valuesOf(result.awards.A)).toEqual([10000]);
    expect(valuesOf(result.awards.B)).toEqual([10000]);
    expect(valuesOf(result.awards.C)).toEqual([10000]);
    expect(result.carryover).toEqual([]);
  });

  test('prefers largest target share when multiple share-amounts work', () => {
    // 4×$10k + 4×$5k = $60k, 4 standing → each gets $15k (not $10k each leaving $5k×4)
    const loot = notes(10000, 10000, 10000, 10000, 5000, 5000, 5000, 5000);
    const result = splitLoot(loot, ['A', 'B', 'C', 'D']);
    for (const id of ['A', 'B', 'C', 'D']) {
      expect(valuesOf(result.awards[id])).toEqual([10000, 5000]);
    }
    expect(result.carryover).toEqual([]);
  });

  test('places largest fitting note into a share before smaller notes', () => {
    // [$20k, $10k×4], 2 standing, $30k each. A's share consumes the $20k+$10k.
    const loot = notes(20000, 10000, 10000, 10000, 10000);
    const result = splitLoot(loot, ['A', 'B']);
    expect(valuesOf(result.awards.A)).toEqual([20000, 10000]);
    expect(valuesOf(result.awards.B)).toEqual([10000, 10000, 10000]);
    expect(result.carryover).toEqual([]);
  });
});

describe('splitLoot — tier 3 (backtrack on share size)', () => {
  test('rulebook example: $50k / 3 standing, $20k indivisible carries over', () => {
    // [$20k, $10k×2, $5k×2] = $50k. $15k each fails ($20k can't be broken).
    // Falls back to $10k each: A=[$10k], B=[$10k], C=[$5k, $5k]. $20k carries.
    const loot = notes(20000, 10000, 10000, 5000, 5000);
    const result = splitLoot(loot, ['A', 'B', 'C']);
    expect(valuesOf(result.awards.A)).toEqual([10000]);
    expect(valuesOf(result.awards.B)).toEqual([10000]);
    expect(valuesOf(result.awards.C)).toEqual([5000, 5000]);
    expect(valuesOf(result.carryover)).toEqual([20000]);
  });

  test('backs off when initial target only completes some shares', () => {
    // [$20k, $5k×4] = $40k, 4 standing. $10k each fails (only 2 shares of 2×$5k).
    // Falls back to $5k each: each player gets [$5k]. $20k carries.
    const loot = notes(20000, 5000, 5000, 5000, 5000);
    const result = splitLoot(loot, ['A', 'B', 'C', 'D']);
    for (const id of ['A', 'B', 'C', 'D']) {
      expect(valuesOf(result.awards[id])).toEqual([5000]);
    }
    expect(valuesOf(result.carryover)).toEqual([20000]);
  });
});

describe('splitLoot — tier 4 (no equal split possible)', () => {
  test('denominations cannot form equal shares', () => {
    // [$10k, $5k] = $15k, 3 standing. $5k each needs 3×$5k notes.
    const loot = notes(10000, 5000);
    const result = splitLoot(loot, ['A', 'B', 'C']);
    expect(result.awards).toEqual({});
    expect(result.carryover).toEqual(loot);
  });

  test('one big note, more standing than makes any equal share', () => {
    const loot = notes(20000);
    const result = splitLoot(loot, ['A', 'B', 'C', 'D', 'E']);
    expect(result.awards).toEqual({});
    expect(result.carryover).toEqual(loot);
  });

  test('three big notes that cannot equally divide', () => {
    // [$20k, $20k, $10k] = $50k, 3 standing. No X works.
    const loot = notes(20000, 20000, 10000);
    const result = splitLoot(loot, ['A', 'B', 'C']);
    expect(result.awards).toEqual({});
    expect(result.carryover).toEqual(loot);
  });
});
