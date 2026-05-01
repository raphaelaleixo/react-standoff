// Maps the raw Firebase snapshot of our /game doc back into a Game that
// matches the type contracts. Game-specific shape mapping; the generic
// RTDB-quirk handling lives in src/lib/rtdbCoerce.

import type {
  Banknote,
  BulletCard,
  Commit,
  Game,
  Player,
  Round,
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
    effects: asArray(r.effects),
  };
}

function normalizeResolution(raw: Raw): RoundResolution {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    shots: asArray<RoundShot>(r.shots),
    ducks: asArray<string>(r.ducks),
    standing: asArray<string>(r.standing),
    woundedThisRound: asRecord<number>(r.woundedThisRound),
    eliminated: asArray<string>(r.eliminated),
    awards: Object.fromEntries(
      Object.entries(asRecord<unknown>(r.awards)).map(([k, v]) => [k, asArray<Banknote>(v)]),
    ),
    carryover: asArray<Banknote>(r.carryover),
  };
}

function normalizeRound(raw: Raw): Round {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    number: Number(r.number ?? 1),
    phase: (r.phase ?? 'commit') as Round['phase'],
    phaseStartedAt: Number(r.phaseStartedAt ?? 0),
    loot: asArray<Banknote>(r.loot),
    commits: asRecord<Commit>(r.commits),
    resolution: r.resolution ? normalizeResolution(r.resolution as Raw) : undefined,
  };
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
