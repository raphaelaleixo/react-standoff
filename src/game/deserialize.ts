import type {
  Banknote,
  BulletCard,
  Commit,
  Effect,
  Game,
  GameVariants,
  Player,
  PowerActivation,
  Round,
  RoundActivations,
  RoundResolution,
  RoundShot,
} from './types';
import { asArray, asRecord } from '../lib/rtdbCoerce';

type Raw = Record<string, unknown> | unknown[] | null | undefined;

function normalizePlayer(raw: Raw): Player {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    displayName: String(r.displayName ?? ''),
    colorOrAvatar: String(r.colorOrAvatar ?? '#bdbdbd'),
    bullets: asArray<BulletCard>(r.bullets),
    cash: asArray<Banknote>(r.cash),
    wounds: (r.wounds ?? 0) as Player['wounds'],
    shame: (r.shame ?? 0) as number,
    status: (r.status ?? 'alive') as Player['status'],
    effects: asArray<Effect>(r.effects),
  };
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
  return {
    number: Number(r.number ?? 1),
    phase: (r.phase ?? 'commit') as Round['phase'],
    phaseStartedAt: Number(r.phaseStartedAt ?? 0),
    loot: asArray<Banknote>(r.loot),
    commits: asRecord<Commit>(r.commits),
    activations: normalizeActivations(r.activations as Raw),
    resolution: r.resolution ? normalizeResolution(r.resolution as Raw) : undefined,
  };
}

function normalizeVariants(raw: Raw): GameVariants {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { superPowers: !!r.superPowers };
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
  return game;
}
