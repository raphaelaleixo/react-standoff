import { splitLoot } from './split';
import type {
  Banknote,
  BulletCard,
  Commit,
  Game,
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
  copContext?: {
    variantCop: boolean;
    roundNumber: number;
    reinforcementsRoundOnTheWay?: number;
  },
): ResolveRoundResult {
  // Cop variant: shame markers earned *after* the reinforcement call lands
  // are "flashing-light" markers — only the cop's mission cares which kind.
  // When the variant is off (or no context passed), every marker is
  // non-flashing, preserving prior behaviour for all existing callers.
  const reinforced =
    !!copContext &&
    copContext.variantCop &&
    copContext.reinforcementsRoundOnTheWay !== undefined &&
    copContext.roundNumber > copContext.reinforcementsRoundOnTheWay;
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
      shame: shameDelta > 0 ? [...pl.shame, { flashing: reinforced }] : pl.shame,
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

// Finalises a telephone phase: writes the per-round telephone record on the
// round, increments Game.cop.callsMade (clamped at 3), and stamps the
// reinforcement round the first time callsMade hits 3. No-op when the cop
// variant is off — both Game.cop and Round.telephone are left untouched.
export function applyTelephoneCall(
  game: Game,
  used: boolean,
  holderOrder: string[],
): Game {
  if (!game.variants.cop || !game.cop) return game;
  const prev = game.cop;
  const nextCallsMade = used ? Math.min(3, prev.callsMade + 1) as 0 | 1 | 2 | 3 : prev.callsMade;
  const newlyReinforced =
    prev.reinforcementsRoundOnTheWay === undefined && nextCallsMade === 3;
  const reinforcementsRoundOnTheWay = newlyReinforced
    ? game.round.number
    : prev.reinforcementsRoundOnTheWay;
  // Omit reinforcementsRoundOnTheWay when it's undefined rather than setting
  // the key to undefined. Firebase RTDB rejects update() patches containing
  // any undefined value, so an object with `reinforcementsRoundOnTheWay:
  // undefined` would brick the entire write — see writeTelephoneAction for
  // the second defensive layer.
  const cop: NonNullable<Game['cop']> = { callsMade: nextCallsMade };
  if (reinforcementsRoundOnTheWay !== undefined) {
    cop.reinforcementsRoundOnTheWay = reinforcementsRoundOnTheWay;
  }
  return {
    ...game,
    round: {
      ...game.round,
      telephone: { used, holderOrder },
    },
    cop,
  };
}

// Pushes a shame marker on the named player, tagged flashing only when the
// cop variant is on, reinforcements have already been called in, and the
// current round is *after* the reinforcement round. Same-round-as-the-call
// markers do not flash (paper rule).
export function applyDuckShame(game: Game, playerId: string): Game {
  const reinforced =
    game.variants.cop &&
    game.cop?.reinforcementsRoundOnTheWay !== undefined &&
    game.round.number > game.cop.reinforcementsRoundOnTheWay;
  return {
    ...game,
    players: game.players.map(p =>
      p.id === playerId
        ? { ...p, shame: [...p.shame, { flashing: reinforced }] }
        : p,
    ),
  };
}
