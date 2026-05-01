import type { Banknote } from './types';

export interface SplitResult {
  awards: Record<string, Banknote[]>;
  carryover: Banknote[];
}

const DENOM_STEP = 5000;

function tryBuildShares(
  loot: Banknote[],
  sortedIndices: number[],
  n: number,
  target: number,
): { shares: Banknote[][]; used: Set<number> } | null {
  const used = new Set<number>();
  const shares: Banknote[][] = [];
  for (let p = 0; p < n; p++) {
    let remaining = target;
    const share: Banknote[] = [];
    for (const idx of sortedIndices) {
      if (used.has(idx)) continue;
      if (loot[idx].value > remaining) continue;
      share.push(loot[idx]);
      used.add(idx);
      remaining -= loot[idx].value;
      if (remaining === 0) break;
    }
    if (remaining !== 0) return null;
    shares.push(share);
  }
  return { shares, used };
}

export function splitLoot(loot: Banknote[], standing: string[]): SplitResult {
  if (standing.length === 0) {
    return { awards: {}, carryover: loot };
  }
  if (standing.length === 1) {
    return { awards: { [standing[0]]: loot }, carryover: [] };
  }

  const n = standing.length;
  const total = loot.reduce((s, b) => s + b.value, 0);
  const startTarget = Math.floor(Math.floor(total / n) / DENOM_STEP) * DENOM_STEP;

  const sortedIndices = loot
    .map((_, i) => i)
    .sort((a, b) => loot[b].value - loot[a].value || a - b);

  for (let target = startTarget; target >= DENOM_STEP; target -= DENOM_STEP) {
    const built = tryBuildShares(loot, sortedIndices, n, target);
    if (!built) continue;
    const awards: Record<string, Banknote[]> = {};
    standing.forEach((id, i) => { awards[id] = built.shares[i]; });
    const carryover = loot.filter((_, i) => !built.used.has(i));
    return { awards, carryover };
  }

  return { awards: {}, carryover: loot };
}
