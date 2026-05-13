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

// Has the effect at all (revealed or not). Passive abilities like Dragon
// Skin and Unbreakable use this so they stay active across rounds once the
// card has been shown to the table.
function hasPower(player: Player, kind: PowerKind): boolean {
  return !!player.effects.find(ef => ef.kind === kind);
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

  // Dragon Skin: clamp wounds-this-round to 1. Passive ability — fires every
  // round the holder takes 2+ wounds, regardless of whether the card has
  // already been revealed in a prior round. The reveal-overlay activation
  // is only pushed the first time so the audience doesn't re-watch the card.
  for (const pl of players) {
    if (!hasPower(pl, 'dragon_skin')) continue;
    const w = woundedThisRound[pl.id] ?? 0;
    if (w > 1) {
      woundedThisRound[pl.id] = 1;
      if (hasUnrevealedPower(pl, 'dragon_skin')) {
        powerActivations.push({
          playerId: pl.id,
          kind: 'dragon_skin',
          context: { clampedFrom: w },
        });
      }
    }
  }

  // Unbreakable: raise death threshold to 4. Passive ability — same as
  // Dragon Skin, the threshold raise applies every round the holder is
  // projected to hit 3 wounds, even after the card has been revealed.
  const deathThreshold: Record<string, number> = {};
  for (const pl of players) {
    deathThreshold[pl.id] = 3;
    if (hasPower(pl, 'unbreakable')) {
      const projected = pl.wounds + (woundedThisRound[pl.id] ?? 0);
      if (projected >= 3) {
        deathThreshold[pl.id] = 4;
        if (hasUnrevealedPower(pl, 'unbreakable')) {
          powerActivations.push({
            playerId: pl.id,
            kind: 'unbreakable',
            context: { savedFromWounds: projected },
          });
        }
      }
    }
  }

  // Yellow-Belly's Purse (super_coward): shame becomes a bonus instead of
  // a penalty at the reckoning. The card has no mid-round mechanical
  // effect, but flash it the first round the holder ducks so the audience
  // sees the bonus path engage. Reveal-only; never marks `used`.
  for (const pl of players) {
    if (!hasPower(pl, 'super_coward')) continue;
    if (!ducks.has(pl.id)) continue;
    if (!hasUnrevealedPower(pl, 'super_coward')) continue;
    powerActivations.push({ playerId: pl.id, kind: 'super_coward' });
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
    // Reveal-only passive cards: flip `revealed` whenever the round
    // pushed an activation for them. Never marks `used` — these are
    // permanent passives that keep firing every round.
    const revealedKinds = new Set(
      powerActivations
        .filter(a => a.playerId === pl.id)
        .filter(a => a.kind === 'dragon_skin' || a.kind === 'unbreakable' || a.kind === 'super_coward')
        .map(a => a.kind),
    );
    if (revealedKinds.size > 0) {
      effects = effects.map(e =>
        revealedKinds.has(e.kind) ? { ...e, revealed: true } : e,
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

  // Davy Jones's Cut (six_feet_under): the holder earns $10k per voyage
  // kill at the reckoning (folded into scoring.finalScore). Flash the
  // card the first round a kill happens so the audience knows the cut
  // is engaged. Reveal-only; never marks `used` (kills keep accruing).
  if (eliminated.length > 0) {
    const holder = newPlayers.find(
      p => hasPower(p, 'six_feet_under') && p.status === 'alive',
    );
    if (holder && hasUnrevealedPower(holder, 'six_feet_under')) {
      powerActivations.push({
        playerId: holder.id,
        kind: 'six_feet_under',
        context: { kills: eliminated.length },
      });
      const idx = newPlayers.findIndex(p => p.id === holder.id);
      newPlayers[idx] = {
        ...holder,
        effects: holder.effects.map(e =>
          e.kind === 'six_feet_under' ? { ...e, revealed: true } : e,
        ),
      };
    }
  }

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

  // Insane: if the holder revealed the grenade this round, the card is
  // consumed regardless of whether it fires. If the holder is wounded,
  // the grenade detonates — every still-standing player takes +1 wound,
  // the round terminates, and split is skipped.
  let grenadeFired = false;
  const grenadeVictims: string[] = [];
  if (activations.insane) {
    const holderId = activations.insane.playerId;
    const holder = newPlayers.find(p => p.id === holderId);
    // Guard against a stray activation slot pointing at a player without
    // the effect (variant-off or malformed write). Mirrors how Tough and
    // Specialist gate on hasUnusedPower before firing.
    if (holder && hasUnusedPower(holder, 'insane')) {
      // Mark the holder's insane effect used + revealed regardless.
      const idx = newPlayers.findIndex(p => p.id === holderId);
      newPlayers[idx] = {
        ...holder,
        effects: holder.effects.map(e =>
          e.kind === 'insane' ? { ...e, revealed: true, used: true } : e,
        ),
      };
      // Did the holder take a wound this round? If so, fire the grenade.
      if ((woundedThisRound[holderId] ?? 0) > 0) {
        grenadeFired = true;
        for (const victim of newPlayers) {
          if (victim.id === holderId) continue;
          if (victim.status !== 'alive') continue;
          if (ducks.has(victim.id)) continue;
          if ((woundedThisRound[victim.id] ?? 0) > 0) continue;
          // Apply grenade wound — respect Unbreakable threshold.
          woundedThisRound[victim.id] = 1;
          const newWounds = (victim.wounds + 1) as Player['wounds'];
          const threshold = deathThreshold[victim.id] ?? 3;
          const willDie = newWounds >= threshold && victim.status === 'alive';
          const vIdx = newPlayers.findIndex(p => p.id === victim.id);
          newPlayers[vIdx] = {
            ...victim,
            wounds: willDie ? (threshold as Player['wounds']) : newWounds,
            status: willDie ? 'dead' : victim.status,
            cash: willDie ? [] : victim.cash,
          };
          if (willDie && !eliminated.includes(victim.id)) eliminated.push(victim.id);
          grenadeVictims.push(victim.id);
        }
        powerActivations.push({
          playerId: holderId,
          kind: 'insane',
          context: { woundedTargets: grenadeVictims },
        });
      }
    }
  }

  // If grenade fired, the round terminated before split — wipe awards
  // and dump everything into carryover.
  const finalAwards = grenadeFired ? {} : awards;
  const finalCarryover = grenadeFired ? [...loot] : carryover;

  const playersWithCash = newPlayers.map(pl => {
    const won = finalAwards[pl.id];
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
    awards: finalAwards,
    carryover: finalCarryover,
    powerActivations,
    ...(grenadeFired
      ? { roundTerminated: { reason: 'grenade' as const, playerId: activations.insane!.playerId } }
      : {}),
  };

  return { resolution, players: playersWithCash, discardedBullets };
}
