import { describe, expect, it, test } from 'vitest';
import type { Banknote, BulletCard, Commit, Game, Player, PowerKind } from './types';
import { applyDuckShame, applyTelephoneCall, resolveRound } from './resolver';

let nextNoteId = 0;
function note(value: Banknote['value']): Banknote;
function note(id: string, value: Banknote['value']): Banknote;
function note(idOrValue: string | Banknote['value'], maybeValue?: Banknote['value']): Banknote {
  if (typeof idOrValue === 'string') {
    return { id: idOrValue, value: maybeValue! };
  }
  return { id: `n${nextNoteId++}`, value: idOrValue };
}

function p(id: string, opts: Partial<Player> = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: '#000',
    bullets: opts.bullets ?? ['clic', 'clic', 'clic', 'clic', 'clic', 'bang', 'bang', 'bang_bang_bang'],
    cash: opts.cash ?? [],
    wounds: opts.wounds ?? 0,
    shame: opts.shame ?? [],
    status: opts.status ?? 'alive',
    effects: opts.effects ?? [],
  };
}

function pl(id: string, opts: { wounds?: 0|1|2|3|4; powers?: PowerKind[] } = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
    cash: [],
    wounds: opts.wounds ?? 0,
    shame: [],
    status: 'alive',
    effects: (opts.powers ?? []).map(k => ({ kind: k, revealed: false, used: false })),
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
    expect(findPlayer(result.players, 'A').shame).toHaveLength(1);
    expect(findPlayer(result.players, 'B').shame).toHaveLength(0);
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

  it('already revealed: still clamps, but does not push another activation', () => {
    const players: Player[] = [
      {
        id: 'p1', displayName: 'p1', colorOrAvatar: 'calico_jack',
        bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
        cash: [], wounds: 0, shame: [], status: 'alive',
        effects: [{ kind: 'dragon_skin', revealed: true, used: false }],
      },
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
    expect(resolution.powerActivations.some(a => a.kind === 'dragon_skin')).toBe(false);
  });
});

describe('resolveRound — Unbreakable', () => {
  it('player at 0 wounds + 3 incoming: not eliminated, activation pushed', () => {
    const players = [
      pl('p1', { wounds: 0, powers: ['unbreakable'] }),
      pl('p2'), pl('p3'), pl('p4'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
    };
    const { resolution, players: out } = resolveRound(commits, players, []);
    expect(resolution.eliminated).not.toContain('p1');
    const survived = out.find(p => p.id === 'p1');
    expect(survived?.wounds).toBe(3);
    expect(survived?.status).toBe('alive');
    expect(resolution.powerActivations.some(a => a.kind === 'unbreakable')).toBe(true);
  });

  it('player at 0 wounds + 4 incoming: eliminated at 4', () => {
    const players = [
      pl('p1', { wounds: 0, powers: ['unbreakable'] }),
      pl('p2'), pl('p3'), pl('p4'), pl('p5'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
      p5: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.eliminated).toContain('p1');
  });

  it('already revealed: still raises threshold, but does not push another activation', () => {
    const players: Player[] = [
      {
        id: 'p1', displayName: 'p1', colorOrAvatar: 'calico_jack',
        bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
        cash: [], wounds: 2, shame: [], status: 'alive',
        effects: [{ kind: 'unbreakable', revealed: true, used: false }],
      },
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.eliminated).not.toContain('p1');
    expect(resolution.powerActivations.some(a => a.kind === 'unbreakable')).toBe(false);
  });

  it('regression: non-Unbreakable still dies at 3 wounds', () => {
    const players = [pl('p1', { wounds: 0 }), pl('p2'), pl('p3'), pl('p4')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.eliminated).toContain('p1');
  });
});

describe('resolveRound — Tough', () => {
  it('wounded holder activated: re-added to standing, gets share', () => {
    const players = [
      pl('p1', { powers: ['tough'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const loot = [note('n1', 10000), note('n2', 10000), note('n3', 10000)];
    const { resolution } = resolveRound(commits, players, loot, { tough: ['p1'] });
    expect(resolution.standing).toContain('p1');
    expect(resolution.awards.p1).toBeDefined();
    expect(resolution.powerActivations.some(a => a.kind === 'tough' && a.playerId === 'p1')).toBe(true);
  });

  it('no activation: wounded holder is not in standing (regression)', () => {
    const players = [pl('p1', { powers: ['tough'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(commits, players, [], {});
    expect(resolution.standing).not.toContain('p1');
  });

  it('dead holder cannot use Tough', () => {
    const players = [
      pl('p1', { wounds: 2, powers: ['tough'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(commits, players, [], { tough: ['p1'] });
    expect(resolution.standing).not.toContain('p1');
    expect(resolution.eliminated).toContain('p1');
  });
});

describe('resolveRound — Specialist', () => {
  it('played B!B!B! + activation: B!B!B! stays in bullets, chosen kind discarded', () => {
    const players = [
      pl('p1', { powers: ['specialist'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang_bang_bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { players: out, discardedBullets } = resolveRound(
      commits, players, [], { specialist: { playerId: 'p1', discardedBulletKind: 'clic' } },
    );
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.bullets.filter(b => b === 'bang_bang_bang')).toHaveLength(1);
    expect(p1Out.bullets.filter(b => b === 'clic')).toHaveLength(4); // started with 5 clics, -1 chosen
    expect(discardedBullets).toContain('clic');
    expect(discardedBullets).not.toContain('bang_bang_bang');
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.used).toBe(true);
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.revealed).toBe(true);
  });

  it('no activation: B!B!B! is discarded normally (regression)', () => {
    const players = [pl('p1', { powers: ['specialist'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang_bang_bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { players: out, discardedBullets } = resolveRound(commits, players, [], {});
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.bullets.filter(b => b === 'bang_bang_bang')).toHaveLength(0);
    expect(discardedBullets).toContain('bang_bang_bang');
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.used).toBeFalsy();
  });
});

describe('resolveRound — Insane (grenade)', () => {
  it('activated + holder wounded: standing players take +1 wound, round terminates', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
      pl('p4'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },     // wounds p1 → triggers grenade
      p3: { bullet: 'clic', target: 'p4' },     // p3 still standing
      p4: { bullet: 'clic', target: 'p3' },     // p4 still standing
    };
    const loot = [note('a', 10000), note('b', 10000), note('c', 5000)];
    const { resolution, players: out } = resolveRound(
      commits, players, loot, { insane: { playerId: 'p1' } },
    );
    expect(resolution.roundTerminated).toEqual({ reason: 'grenade', playerId: 'p1' });
    expect(resolution.woundedThisRound.p1).toBe(1);
    expect(resolution.woundedThisRound.p3).toBe(1);
    expect(resolution.woundedThisRound.p4).toBe(1);
    expect(resolution.awards).toEqual({});
    expect(resolution.carryover).toEqual(loot);
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.effects.find(e => e.kind === 'insane')?.used).toBe(true);
    expect(p1Out.effects.find(e => e.kind === 'insane')?.revealed).toBe(true);
  });

  it('activated + holder NOT wounded: card consumed, no explosion, awards run normally', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },     // clic — no wound on p1
      p3: { bullet: 'clic', target: 'p2' },
    };
    const loot = [note('a', 10000), note('b', 10000), note('c', 10000)];
    const { resolution, players: out } = resolveRound(
      commits, players, loot, { insane: { playerId: 'p1' } },
    );
    expect(resolution.roundTerminated).toBeUndefined();
    expect(resolution.woundedThisRound).toEqual({});
    expect(resolution.awards).toBeDefined();
    expect(Object.keys(resolution.awards).length).toBeGreaterThan(0);
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.effects.find(e => e.kind === 'insane')?.used).toBe(true);
    expect(p1Out.effects.find(e => e.kind === 'insane')?.revealed).toBe(true);
  });

  it('no activation: insane holder takes a wound but grenade does not fire (regression)', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(commits, players, [], {});
    expect(resolution.roundTerminated).toBeUndefined();
    expect(resolution.woundedThisRound.p3).toBeUndefined();
  });

  it('standing-set: bang-wounded player NOT in grenade pool', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
      pl('p4'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },     // wounds p1 → grenade
      p3: { bullet: 'bang', target: 'p4' },     // wounds p4 → p4 excluded from grenade
      p4: { bullet: 'clic', target: 'p3' },
    };
    const { resolution } = resolveRound(
      commits, players, [], { insane: { playerId: 'p1' } },
    );
    expect(resolution.woundedThisRound.p4).toBe(1);  // only from the bang, not grenade
    expect(resolution.woundedThisRound.p3).toBe(1);  // only from grenade
  });

  it('standing-set: ducked player NOT in grenade pool', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { withdrew: true },
    };
    const { resolution } = resolveRound(
      commits, players, [], { insane: { playerId: 'p1' } },
    );
    expect(resolution.woundedThisRound.p3).toBeUndefined();
    expect(resolution.ducks).toContain('p3');
  });

  it('holder dies from triggering wound: grenade still fires', () => {
    const players = [
      pl('p1', { wounds: 2, powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },     // 3rd wound → death
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(
      commits, players, [], { insane: { playerId: 'p1' } },
    );
    expect(resolution.eliminated).toContain('p1');
    expect(resolution.roundTerminated).toEqual({ reason: 'grenade', playerId: 'p1' });
    expect(resolution.woundedThisRound.p3).toBe(1);
  });

  it('holder reveals then ducks: card consumed, no explosion', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { withdrew: true },                   // holder withdraws — no wound
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
    };
    const { resolution, players: out } = resolveRound(
      commits, players, [], { insane: { playerId: 'p1' } },
    );
    expect(resolution.roundTerminated).toBeUndefined();
    expect(resolution.ducks).toContain('p1');
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.effects.find(e => e.kind === 'insane')?.used).toBe(true);
  });

  it('powerActivations contains kind:insane when grenade fires', () => {
    const players = [
      pl('p1', { powers: ['insane'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(
      commits, players, [], { insane: { playerId: 'p1' } },
    );
    expect(resolution.powerActivations.some(a => a.kind === 'insane' && a.playerId === 'p1')).toBe(true);
  });
});

function baseCopGame(callsMade: 0 | 1 | 2 | 3, roundNumber: number, reinforcementsRoundOnTheWay?: number): Game {
  return {
    phase: 'in_progress',
    players: [],
    round: {
      number: roundNumber, phase: 'telephone', phaseStartedAt: 0,
      loot: [], commits: {}, activations: {},
      resolution: {
        shots: [], ducks: [], standing: ['a', 'b'],
        woundedThisRound: {}, eliminated: [], awards: {}, carryover: [],
        powerActivations: [],
      },
    },
    bankDeck: [], discardedBullets: [], seed: 's',
    variants: { superPowers: false, cop: true },
    cop: { callsMade, reinforcementsRoundOnTheWay },
  };
}

describe('applyTelephoneCall', () => {
  it('records the holder order and used=false when call did not land', () => {
    const g = baseCopGame(0, 1);
    const next = applyTelephoneCall(g, false, ['a', 'b']);
    expect(next.round.telephone).toEqual({ used: false, holderOrder: ['a', 'b'] });
    expect(next.cop?.callsMade).toBe(0);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBeUndefined();
  });

  it('increments callsMade and records holder order when used=true', () => {
    const g = baseCopGame(0, 1);
    const next = applyTelephoneCall(g, true, ['a', 'b']);
    expect(next.round.telephone).toEqual({ used: true, holderOrder: ['a', 'b'] });
    expect(next.cop?.callsMade).toBe(1);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBeUndefined();
  });

  it('sets reinforcementsRoundOnTheWay on the 3rd call', () => {
    const g = baseCopGame(2, 4);
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop?.callsMade).toBe(3);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBe(4);
  });

  it('does not change reinforcementsRoundOnTheWay if already set', () => {
    const g = baseCopGame(3, 5, 3);
    // Hypothetical no-op 4th call; should be inert.
    const next = applyTelephoneCall(g, false, ['a']);
    expect(next.cop?.callsMade).toBe(3);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBe(3);
  });

  it('clamps callsMade at 3 if somehow called more', () => {
    const g = baseCopGame(3, 5, 3);
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop?.callsMade).toBe(3);
  });

  it('is a no-op when cop variant is off', () => {
    const g = baseCopGame(0, 1);
    g.variants.cop = false;
    g.cop = undefined;
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop).toBeUndefined();
    expect(next.round.telephone).toBeUndefined();
  });

  // Firebase RTDB rejects update() patches containing undefined values.
  // applyTelephoneCall must therefore OMIT reinforcementsRoundOnTheWay
  // (not set it to undefined) when no 3rd call has landed — otherwise the
  // last-holder pass throws when the resulting cop object is written.
  it('omits reinforcementsRoundOnTheWay from cop when no 3rd call has landed', () => {
    const g = baseCopGame(0, 1);
    const next = applyTelephoneCall(g, false, ['a', 'b']);
    expect(next.cop).toBeDefined();
    expect('reinforcementsRoundOnTheWay' in next.cop!).toBe(false);
  });

  it('includes reinforcementsRoundOnTheWay when the 3rd call lands', () => {
    const g = baseCopGame(2, 4);
    const next = applyTelephoneCall(g, true, ['a']);
    expect('reinforcementsRoundOnTheWay' in next.cop!).toBe(true);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBe(4);
  });
});

describe('applyDuckShame', () => {
  it('tags new shame markers as non-flashing when no reinforcements yet', () => {
    const g = baseCopGame(0, 2);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'mafia',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });

  it('tags new shame as flashing when reinforcementsRoundOnTheWay is set and current round > that', () => {
    const g = baseCopGame(3, 5, 3);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: true }]);
  });

  it('tags new shame as non-flashing when current round equals reinforcement round', () => {
    // Paper rule: only new shame *after* the call counts. Markers earned
    // in the same round as the call do not flash.
    const g = baseCopGame(3, 4, 4);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });

  it('preserves existing shame markers unchanged', () => {
    const g = baseCopGame(3, 6, 3);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [{ flashing: false }, { flashing: false }],
      status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([
      { flashing: false },
      { flashing: false },
      { flashing: true },
    ]);
  });

  it('non-cop variant adds non-flashing markers regardless of round', () => {
    const g = baseCopGame(0, 5);
    g.variants.cop = false;
    g.cop = undefined;
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [],
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });
});
