import { splitLoot } from './split';
import type {
  Banknote,
  BulletCard,
  Commit,
  Player,
  PowerActivation,
  PowerKind,
  RoundActivations,
  RoundResolution,
  RoundShot,
  ShotOutcome,
} from './types';

export interface ResolveRoundResult {
  resolution: RoundResolution;
  players: Player[];
  discardedBullets: BulletCard[];
}

function hasUnrevealedPower(player: Player, kind: PowerKind): boolean {
  const e = player.effects.find(ef => ef.kind === kind);
  return !!e && !e.revealed;
}

function hasUnusedPower(player: Player, kind: PowerKind): boolean {
  const e = player.effects.find(ef => ef.kind === kind);
  return !!e && !e.used;
}

function classifyShot(
  shooter: string,
  commit: Commit,
  ducks: Set<string>,
  surprisedShooters: Set<string>,
): ShotOutcome {
  if (ducks.has(commit.target!)) return 'voided_target_ducked';
  if (commit.bullet === 'bang_bang_bang') return 'hit';
  if (surprisedShooters.has(shooter)) return 'voided_shooter_surprised';
  if (commit.bullet === 'clic') return 'no_effect_clic';
  return 'hit';
}

function removeOne<T>(arr: T[], value: T): T[] {
  const i = arr.indexOf(value);
  if (i < 0) return arr;
  return [...arr.slice(0, i), ...arr.slice(i + 1)];
}

export function resolveRound(
  commits: Record<string, Commit>,
  players: Player[],
  loot: Banknote[],
  activations: RoundActivations = {},
): ResolveRoundResult {
  const powerActivations: PowerActivation[] = [];
  const ducks = new Set<string>();
  for (const [pid, c] of Object.entries(commits)) {
    if (c.withdrew) ducks.add(pid);
  }

  const surprisedShooters = new Set<string>();
  for (const [pid, c] of Object.entries(commits)) {
    if (ducks.has(pid)) continue;
    if (c.bullet === 'bang_bang_bang') continue;
    for (const [shooter, sc] of Object.entries(commits)) {
      if (ducks.has(shooter)) continue;
      if (sc.bullet !== 'bang_bang_bang') continue;
      if (ducks.has(sc.target!)) continue;
      if (sc.target === pid) {
        surprisedShooters.add(pid);
        break;
      }
    }
  }

  const shots: RoundShot[] = [];
  const woundedThisRound: Record<string, number> = {};
  for (const [shooter, c] of Object.entries(commits)) {
    if (ducks.has(shooter)) continue;
    if (!c.bullet || !c.target) continue;
    const outcome = classifyShot(shooter, c, ducks, surprisedShooters);
    shots.push({ shooter, target: c.target, card: c.bullet, outcome });
    if (outcome === 'hit') {
      woundedThisRound[c.target] = (woundedThisRound[c.target] ?? 0) + 1;
    }
  }

  // Dragon Skin: clamp wounds-this-round to 1 for unrevealed holders.
  for (const pl of players) {
    if (!hasUnrevealedPower(pl, 'dragon_skin')) continue;
    const w = woundedThisRound[pl.id] ?? 0;
    if (w > 1) {
      woundedThisRound[pl.id] = 1;
      powerActivations.push({
        playerId: pl.id,
        kind: 'dragon_skin',
        context: { clampedFrom: w },
      });
    }
  }

  // Unbreakable: raise death threshold to 4 for unrevealed holders.
  const deathThreshold: Record<string, number> = {};
  for (const pl of players) {
    deathThreshold[pl.id] = 3;
    if (hasUnrevealedPower(pl, 'unbreakable')) {
      const projected = pl.wounds + (woundedThisRound[pl.id] ?? 0);
      if (projected >= 3) {
        deathThreshold[pl.id] = 4;
        powerActivations.push({
          playerId: pl.id,
          kind: 'unbreakable',
          context: { savedFromWounds: projected },
        });
      }
    }
  }

  const eliminated: string[] = [];
  const newPlayers: Player[] = players.map(pl => {
    const c = commits[pl.id];
    let bullets = pl.bullets;
    const specialistFires =
      c?.bullet === 'bang_bang_bang' &&
      activations.specialist?.playerId === pl.id &&
      hasUnusedPower(pl, 'specialist');

    if (specialistFires) {
      // Specialist: B!B!B! stays in hand; the chosen kind leaves instead.
      bullets = removeOne(bullets, activations.specialist!.discardedBulletKind);
    } else if (c?.bullet) {
      bullets = removeOne(bullets, c.bullet);
    }

    const shameDelta = ducks.has(pl.id) ? 1 : 0;
    const woundDelta = woundedThisRound[pl.id] ?? 0;
    const newWounds = (pl.wounds + woundDelta) as Player['wounds'];
    const threshold = deathThreshold[pl.id] ?? 3;
    const willDie = newWounds >= threshold && pl.status === 'alive';
    if (willDie) eliminated.push(pl.id);

    let effects = pl.effects;
    if (powerActivations.some(a => a.playerId === pl.id && (a.kind === 'dragon_skin' || a.kind === 'unbreakable'))) {
      effects = effects.map(e =>
        (e.kind === 'dragon_skin' || e.kind === 'unbreakable') ? { ...e, revealed: true } : e,
      );
    }
    if (specialistFires) {
      effects = effects.map(e =>
        e.kind === 'specialist' ? { ...e, revealed: true, used: true } : e,
      );
      powerActivations.push({ playerId: pl.id, kind: 'specialist' });
    }

    return {
      ...pl,
      bullets,
      effects,
      shame: pl.shame + shameDelta,
      wounds: willDie ? (threshold as Player['wounds']) : newWounds,
      status: willDie ? 'dead' : pl.status,
      cash: willDie ? [] : pl.cash,
    };
  });

  // Standing this round: alive at end, didn't duck, took 0 wounds this round.
  let standing: string[] = newPlayers
    .filter(pl => pl.status === 'alive' && !ducks.has(pl.id) && !(woundedThisRound[pl.id] > 0))
    .filter(pl => commits[pl.id])
    .map(pl => pl.id);

  // Tough: add activated players back to standing (must still be alive).
  if (activations.tough && activations.tough.length > 0) {
    for (const pid of activations.tough) {
      const pl = newPlayers.find(p => p.id === pid);
      if (!pl || pl.status !== 'alive') continue;
      if (!hasUnusedPower(pl, 'tough')) continue;
      if (!standing.includes(pid)) {
        standing = [...standing, pid];
        powerActivations.push({ playerId: pid, kind: 'tough' });
        const idx = newPlayers.findIndex(p => p.id === pid);
        newPlayers[idx] = {
          ...pl,
          effects: pl.effects.map(e =>
            e.kind === 'tough' ? { ...e, revealed: true, used: true } : e,
          ),
        };
      }
    }
  }

  const { awards, carryover } = splitLoot(loot, standing);

  const playersWithCash = newPlayers.map(pl => {
    const won = awards[pl.id];
    if (!won || won.length === 0) return pl;
    return { ...pl, cash: [...pl.cash, ...won] };
  });

  const discardedBullets: BulletCard[] = [];
  for (const [pid, c] of Object.entries(commits)) {
    if (!c.bullet) continue;
    if (
      c.bullet === 'bang_bang_bang' &&
      activations.specialist?.playerId === pid
    ) {
      discardedBullets.push(activations.specialist.discardedBulletKind);
    } else {
      discardedBullets.push(c.bullet);
    }
  }

  const resolution: RoundResolution = {
    shots,
    ducks: Array.from(ducks),
    standing,
    woundedThisRound,
    eliminated,
    awards,
    carryover,
    powerActivations,
  };

  return { resolution, players: playersWithCash, discardedBullets };
}
