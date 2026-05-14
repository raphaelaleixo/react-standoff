import type {
  Banknote,
  BulletCard,
  Commit,
  Effect,
  Game,
  GameVariants,
  Player,
  PowerActivation,
  Role,
  Round,
  RoundActivations,
  RoundResolution,
  RoundShot,
  ShameMarker,
} from './types';
import { asArray, asRecord } from '../lib/rtdbCoerce';

type Raw = Record<string, unknown> | unknown[] | null | undefined;

function normalizeShame(raw: unknown): ShameMarker[] {
  // Legacy: scalar number → expand to N non-flashing markers. New shape:
  // array of { flashing: boolean }.
  if (typeof raw === 'number') {
    return Array.from({ length: raw }, () => ({ flashing: false }));
  }
  if (Array.isArray(raw)) {
    return raw.map(item => {
      if (item && typeof item === 'object') {
        const r = item as Record<string, unknown>;
        return { flashing: !!r.flashing };
      }
      return { flashing: false };
    });
  }
  return [];
}

function normalizeRole(raw: unknown): Role | undefined {
  if (raw === 'cop' || raw === 'mafia') return raw;
  return undefined;
}

function normalizePlayer(raw: Raw): Player {
  const r = (raw ?? {}) as Record<string, unknown>;
  const role = normalizeRole(r.role);
  const player: Player = {
    id: String(r.id ?? ''),
    displayName: String(r.displayName ?? ''),
    colorOrAvatar: String(r.colorOrAvatar ?? '#bdbdbd'),
    bullets: asArray<BulletCard>(r.bullets),
    cash: asArray<Banknote>(r.cash),
    wounds: (r.wounds ?? 0) as Player['wounds'],
    shame: normalizeShame(r.shame),
    status: (r.status ?? 'alive') as Player['status'],
    effects: asArray<Effect>(r.effects),
  };
  if (role) player.role = role;
  return player;
}

function normalizeActivations(raw: Raw): RoundActivations {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: RoundActivations = {};
  if (r.tough) out.tough = asArray<string>(r.tough);
  if (r.specialist && typeof r.specialist === 'object') {
    const s = r.specialist as Record<string, unknown>;
    out.specialist = {
      playerId: String(s.playerId ?? ''),
      discardedBulletKind: (s.discardedBulletKind ?? 'clic') as BulletCard,
    };
  }
  if (r.insane && typeof r.insane === 'object') {
    const i = r.insane as Record<string, unknown>;
    out.insane = { playerId: String(i.playerId ?? '') };
  }
  return out;
}

function normalizeResolution(raw: Raw): RoundResolution {
  const r = (raw ?? {}) as Record<string, unknown>;
  const base: RoundResolution = {
    shots: asArray<RoundShot>(r.shots),
    ducks: asArray<string>(r.ducks),
    standing: asArray<string>(r.standing),
    woundedThisRound: asRecord<number>(r.woundedThisRound),
    eliminated: asArray<string>(r.eliminated),
    awards: Object.fromEntries(
      Object.entries(asRecord<unknown>(r.awards)).map(([k, v]) => [k, asArray<Banknote>(v)]),
    ),
    carryover: asArray<Banknote>(r.carryover),
    powerActivations: asArray<PowerActivation>(r.powerActivations),
  };
  if (r.roundTerminated && typeof r.roundTerminated === 'object') {
    const t = r.roundTerminated as Record<string, unknown>;
    if (t.reason === 'grenade' && typeof t.playerId === 'string') {
      base.roundTerminated = { reason: 'grenade', playerId: t.playerId };
    }
  }
  return base;
}

function normalizeRound(raw: Raw): Round {
  const r = (raw ?? {}) as Record<string, unknown>;
  // Omit optional fields when not present rather than setting them to
  // `undefined`. Firebase RTDB rejects `undefined` values in set()/update(),
  // and any spread of this Round into a fresh Game gets shipped right back
  // through fbSet — so explicit-undefined here turns into a write failure
  // later.
  const round: Round = {
    number: Number(r.number ?? 1),
    phase: (r.phase ?? 'commit') as Round['phase'],
    phaseStartedAt: Number(r.phaseStartedAt ?? 0),
    loot: asArray<Banknote>(r.loot),
    commits: asRecord<Commit>(r.commits),
    activations: normalizeActivations(r.activations as Raw),
  };
  if (r.resolution) {
    round.resolution = normalizeResolution(r.resolution as Raw);
  }
  if (r.telephone && typeof r.telephone === 'object') {
    const t = r.telephone as Record<string, unknown>;
    round.telephone = {
      used: !!t.used,
      holderOrder: asArray<string>(t.holderOrder),
    };
    if (typeof t.currentHolderId === 'string') {
      round.telephone.currentHolderId = t.currentHolderId;
    }
  }
  return round;
}

function normalizeVariants(raw: Raw): GameVariants {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { superPowers: !!r.superPowers, cop: !!r.cop };
}

export function normalizeGame(raw: Raw): Game | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const game: Game = {
    phase: (r.phase ?? 'in_progress') as Game['phase'],
    players: asArray<Raw>(r.players).map(normalizePlayer),
    round: normalizeRound(r.round as Raw),
    bankDeck: asArray<Banknote>(r.bankDeck),
    discardedBullets: asArray<BulletCard>(r.discardedBullets),
    seed: String(r.seed ?? ''),
    variants: normalizeVariants(r.variants as Raw),
  };
  const prev = r.previousRoundSummary as Raw;
  if (prev && typeof prev === 'object') {
    const p = prev as Record<string, unknown>;
    game.previousRoundSummary = {
      round: Number(p.round ?? 0),
      resolution: normalizeResolution(p.resolution as Raw),
    };
  }
  if (r.cop && typeof r.cop === 'object') {
    const c = r.cop as Record<string, unknown>;
    const callsMade = Math.min(3, Math.max(0, Number(c.callsMade ?? 0))) as 0 | 1 | 2 | 3;
    const reinf = c.reinforcementsRoundOnTheWay;
    // Omit reinforcementsRoundOnTheWay when not a number — see the comment
    // in normalizeRound about Firebase rejecting `undefined` values.
    const cop: NonNullable<Game['cop']> = { callsMade };
    if (typeof reinf === 'number') cop.reinforcementsRoundOnTheWay = reinf;
    game.cop = cop;
  }
  return game;
}
