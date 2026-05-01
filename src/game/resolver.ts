import { splitLoot } from './split';
import type {
  Banknote,
  BulletCard,
  Commit,
  Player,
  RoundResolution,
  RoundShot,
  ShotOutcome,
} from './types';

export interface ResolveRoundResult {
  resolution: RoundResolution;
  players: Player[];
  discardedBullets: BulletCard[];
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
): ResolveRoundResult {
  const ducks = new Set<string>();
  for (const [pid, c] of Object.entries(commits)) {
    if (c.withdrew) ducks.add(pid);
  }

  // Surprised shooters: any non-ducker holding bang/clic whose own player gets hit
  // by an incoming non-voided B!B!B! in phase 5. Their bang/clic is voided in phase 6.
  // (B!B!B! shooters themselves are NOT surprised — their B!B!B! still fires.)
  const surprisedShooters = new Set<string>();
  for (const [pid, c] of Object.entries(commits)) {
    if (ducks.has(pid)) continue;
    if (c.bullet === 'bang_bang_bang') continue;
    // Was pid targeted by an incoming non-ducked B!B!B! whose shooter's target wasn't a ducker?
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

  const eliminated: string[] = [];
  const newPlayers: Player[] = players.map(pl => {
    const c = commits[pl.id];
    let bullets = pl.bullets;
    if (c?.bullet) bullets = removeOne(bullets, c.bullet);

    const shameDelta = ducks.has(pl.id) ? 1 : 0;
    const woundDelta = woundedThisRound[pl.id] ?? 0;
    const newWounds = (pl.wounds + woundDelta) as Player['wounds'];
    const willDie = newWounds >= 3 && pl.status === 'alive';
    if (willDie) eliminated.push(pl.id);

    return {
      ...pl,
      bullets,
      shame: pl.shame + shameDelta,
      wounds: willDie ? 3 : newWounds,
      status: willDie ? 'dead' : pl.status,
      cash: willDie ? [] : pl.cash,
    };
  });

  // Standing this round: alive at end, didn't duck, took 0 wounds this round.
  const standing: string[] = newPlayers
    .filter(pl => pl.status === 'alive' && !ducks.has(pl.id) && !(woundedThisRound[pl.id] > 0))
    .filter(pl => commits[pl.id])
    .map(pl => pl.id);

  const { awards, carryover } = splitLoot(loot, standing);

  const playersWithCash = newPlayers.map(pl => {
    const won = awards[pl.id];
    if (!won || won.length === 0) return pl;
    return { ...pl, cash: [...pl.cash, ...won] };
  });

  const discardedBullets: BulletCard[] = [];
  for (const c of Object.values(commits)) {
    if (c.bullet) discardedBullets.push(c.bullet);
  }

  const resolution: RoundResolution = {
    shots,
    ducks: Array.from(ducks),
    standing,
    woundedThisRound,
    eliminated,
    awards,
    carryover,
  };

  return { resolution, players: playersWithCash, discardedBullets };
}
