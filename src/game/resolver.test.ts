import { describe, expect, it, test } from 'vitest';
import type { Banknote, BulletCard, Commit, Player, PowerKind } from './types';
import { resolveRound } from './resolver';

let nextNoteId = 0;
const note = (value: Banknote['value']): Banknote => ({
  id: `n${nextNoteId++}`,
  value,
});

function p(id: string, opts: Partial<Player> = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: '#000',
    bullets: opts.bullets ?? ['clic', 'clic', 'clic', 'clic', 'clic', 'bang', 'bang', 'bang_bang_bang'],
    cash: opts.cash ?? [],
    wounds: opts.wounds ?? 0,
    shame: opts.shame ?? 0,
    status: opts.status ?? 'alive',
    effects: opts.effects ?? [],
  };
}

function commit(bullet: BulletCard, target: string): Commit {
  return { bullet, target };
}

const duck = (bullet: BulletCard, target: string): Commit => ({
  bullet,
  target,
  withdrew: true,
});

const findPlayer = (players: Player[], id: string) =>
  players.find(pl => pl.id === id)!;

describe('resolveRound — withdraw phase', () => {
  test('a player who ducks gets a shame marker and appears in resolution.ducks', () => {
    const result = resolveRound(
      {
        A: duck('bang', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    expect(result.resolution.ducks).toEqual(['A']);
    expect(findPlayer(result.players, 'A').shame).toBe(1);
    expect(findPlayer(result.players, 'B').shame).toBe(0);
  });

  test('aiming a player who ducked voids the shooter\'s bullet (gangster code)', () => {
    const result = resolveRound(
      {
        A: duck('clic', 'B'),
        B: commit('bang', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    const bShot = result.resolution.shots.find(s => s.shooter === 'B')!;
    expect(bShot.outcome).toBe('voided_target_ducked');
    expect(findPlayer(result.players, 'A').wounds).toBe(0);
  });
});

describe('resolveRound — B!B!B! phase', () => {
  test('B!B!B! against a standing target lands and wounds them', () => {
    const result = resolveRound(
      {
        A: commit('bang_bang_bang', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    const aShot = result.resolution.shots.find(s => s.shooter === 'A')!;
    expect(aShot.outcome).toBe('hit');
    expect(aShot.card).toBe('bang_bang_bang');
    expect(findPlayer(result.players, 'B').wounds).toBe(1);
  });

  test('mutual B!B!B! → both players wounded', () => {
    const result = resolveRound(
      {
        A: commit('bang_bang_bang', 'B'),
        B: commit('bang_bang_bang', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    expect(findPlayer(result.players, 'A').wounds).toBe(1);
    expect(findPlayer(result.players, 'B').wounds).toBe(1);
    expect(result.resolution.shots.every(s => s.outcome === 'hit')).toBe(true);
  });

  test('B!B!B! aimed at a ducker is voided_target_ducked, not a hit', () => {
    const result = resolveRound(
      {
        A: commit('bang_bang_bang', 'B'),
        B: duck('clic', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    const aShot = result.resolution.shots.find(s => s.shooter === 'A')!;
    expect(aShot.outcome).toBe('voided_target_ducked');
    expect(findPlayer(result.players, 'B').wounds).toBe(0);
  });
});

describe('resolveRound — bang & clic phase', () => {
  test('bang lands → target wounded', () => {
    const result = resolveRound(
      {
        A: commit('bang', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    expect(findPlayer(result.players, 'B').wounds).toBe(1);
    expect(findPlayer(result.players, 'A').wounds).toBe(0);
    const aShot = result.resolution.shots.find(s => s.shooter === 'A')!;
    expect(aShot.outcome).toBe('hit');
    const bShot = result.resolution.shots.find(s => s.shooter === 'B')!;
    expect(bShot.outcome).toBe('no_effect_clic');
  });

  test('shooter wounded by B!B!B! cannot fire back; bang voided as voided_shooter_surprised', () => {
    // A B!B!B!s B; B was aiming bang at A. B's bang is voided.
    const result = resolveRound(
      {
        A: commit('bang_bang_bang', 'B'),
        B: commit('bang', 'A'),
      },
      [p('A'), p('B')],
      [],
    );
    const bShot = result.resolution.shots.find(s => s.shooter === 'B')!;
    expect(bShot.outcome).toBe('voided_shooter_surprised');
    expect(findPlayer(result.players, 'A').wounds).toBe(0);
    expect(findPlayer(result.players, 'B').wounds).toBe(1);
  });

  test('two bangs on the same target stack wounds', () => {
    const result = resolveRound(
      {
        A: commit('bang', 'C'),
        B: commit('bang', 'C'),
        C: commit('clic', 'A'),
      },
      [p('A'), p('B'), p('C')],
      [],
    );
    expect(findPlayer(result.players, 'C').wounds).toBe(2);
  });
});

describe('resolveRound — elimination', () => {
  test('reaching 3 wounds: status becomes dead, cash is forfeited, player listed in eliminated', () => {
    const cash = [note(20000), note(10000)];
    const result = resolveRound(
      {
        A: commit('bang_bang_bang', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B', { wounds: 2, cash })],
      [],
    );
    const b = findPlayer(result.players, 'B');
    expect(b.wounds).toBe(3);
    expect(b.status).toBe('dead');
    expect(b.cash).toEqual([]);
    expect(result.resolution.eliminated).toEqual(['B']);
  });

  test('a single wound on a 1-wound player does not eliminate', () => {
    const result = resolveRound(
      {
        A: commit('bang', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B', { wounds: 1, cash: [note(5000)] })],
      [],
    );
    const b = findPlayer(result.players, 'B');
    expect(b.wounds).toBe(2);
    expect(b.status).toBe('alive');
    expect(b.cash.map(n => n.value)).toEqual([5000]);
    expect(result.resolution.eliminated).toEqual([]);
  });
});

describe('resolveRound — split integration & standing', () => {
  test('all alive, none ducked, none wounded → all are standing and split the loot', () => {
    const loot = [note(10000), note(10000)];
    const result = resolveRound(
      {
        A: commit('clic', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B')],
      loot,
    );
    expect(result.resolution.standing.sort()).toEqual(['A', 'B']);
    expect(result.resolution.awards.A?.map(n => n.value)).toEqual([10000]);
    expect(result.resolution.awards.B?.map(n => n.value)).toEqual([10000]);
    expect(result.resolution.carryover).toEqual([]);
    // Awards apply to player.cash
    expect(findPlayer(result.players, 'A').cash.map(n => n.value)).toEqual([10000]);
    expect(findPlayer(result.players, 'B').cash.map(n => n.value)).toEqual([10000]);
  });

  test('a wounded survivor (still alive) is NOT standing and gets no share', () => {
    // 3 players: A bangs B, no ducks, loot=[$10k, $10k]. B wounded → not standing.
    // A and C standing → split $20k = $10k each.
    const loot = [note(10000), note(10000)];
    const result = resolveRound(
      {
        A: commit('bang', 'B'),
        B: commit('clic', 'A'),
        C: commit('clic', 'A'),
      },
      [p('A'), p('B'), p('C')],
      loot,
    );
    expect(result.resolution.standing.sort()).toEqual(['A', 'C']);
    expect(result.resolution.awards.B).toBeUndefined();
    expect(findPlayer(result.players, 'B').cash).toEqual([]);
    expect(findPlayer(result.players, 'A').cash.map(n => n.value)).toEqual([10000]);
    expect(findPlayer(result.players, 'C').cash.map(n => n.value)).toEqual([10000]);
  });

  test('ducker is not standing and gets no share', () => {
    const loot = [note(5000), note(5000)];
    const result = resolveRound(
      {
        A: duck('clic', 'B'),
        B: commit('clic', 'A'),
      },
      [p('A'), p('B')],
      loot,
    );
    expect(result.resolution.standing).toEqual(['B']);
    expect(result.resolution.awards.A).toBeUndefined();
    expect(result.resolution.awards.B?.map(n => n.value)).toEqual([5000, 5000]);
  });
});

describe('resolveRound — end-of-round bookkeeping', () => {
  test('committed bullet is removed from player\'s hand (one card of that type)', () => {
    const result = resolveRound(
      {
        A: commit('bang', 'B'),
        B: commit('clic', 'A'),
      },
      [
        p('A', { bullets: ['bang', 'bang', 'clic'] }),
        p('B', { bullets: ['clic', 'clic', 'bang_bang_bang'] }),
      ],
      [],
    );
    expect(findPlayer(result.players, 'A').bullets).toEqual(['bang', 'clic']);
    expect(findPlayer(result.players, 'B').bullets).toEqual(['clic', 'bang_bang_bang']);
  });

  test('every committed bullet flows into discardedBullets, even ducks and voided shots', () => {
    const result = resolveRound(
      {
        A: duck('bang_bang_bang', 'B'),     // ducker — bullet still discarded
        B: commit('bang', 'A'),             // target ducked → voided, but bullet discarded
        C: commit('clic', 'A'),
      },
      [p('A'), p('B'), p('C')],
      [],
    );
    expect(result.discardedBullets.sort()).toEqual(['bang', 'bang_bang_bang', 'clic']);
  });
});

describe('resolveRound — Dragon Skin', () => {
  function pl(id: string, opts: { wounds?: 0|1|2|3|4; powers?: PowerKind[] } = {}): Player {
    return {
      id,
      displayName: id,
      colorOrAvatar: 'calico_jack',
      bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
      cash: [],
      wounds: opts.wounds ?? 0,
      shame: 0,
      status: 'alive',
      effects: (opts.powers ?? []).map(k => ({ kind: k, revealed: false, used: false })),
    };
  }

  it('clamps multi-wound to 1 and pushes activation', () => {
    const players = [
      pl('p1', { powers: ['dragon_skin'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(1);
    const act = resolution.powerActivations.find(a => a.kind === 'dragon_skin');
    expect(act?.playerId).toBe('p1');
  });

  it('1 wound: no clamp, no activation (power stays hidden)', () => {
    const players = [pl('p1', { powers: ['dragon_skin'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(1);
    expect(resolution.powerActivations).toEqual([]);
  });

  it('no Dragon Skin in hand: multi-wound unchanged (regression)', () => {
    const players = [pl('p1'), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(2);
    expect(resolution.powerActivations).toEqual([]);
  });
});
