import { describe, expect, test } from 'vitest';
import { makeRng, shuffle } from './random';

describe('makeRng', () => {
  test('same seed produces same sequence', () => {
    const a = makeRng('seed-A');
    const b = makeRng('seed-A');
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  test('different seeds produce different sequences', () => {
    const a = makeRng('seed-A');
    const b = makeRng('seed-B');
    expect(a()).not.toBe(b());
  });

  test('output is in [0, 1)', () => {
    const r = makeRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffle', () => {
  test('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, makeRng('s'));
    expect(out.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('does not mutate input', () => {
    const arr = [1, 2, 3, 4, 5];
    const before = [...arr];
    shuffle(arr, makeRng('s'));
    expect(arr).toEqual(before);
  });

  test('same seed produces same shuffle', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffle(arr, makeRng('s'))).toEqual(shuffle(arr, makeRng('s')));
  });

  test('different seeds generally produce different shuffles', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(shuffle(arr, makeRng('s1'))).not.toEqual(shuffle(arr, makeRng('s2')));
  });
});
