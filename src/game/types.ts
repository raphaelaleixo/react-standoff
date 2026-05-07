export type BulletCard = 'clic' | 'bang' | 'bang_bang_bang';

export interface Banknote {
  id: string;
  value: 5000 | 10000 | 20000;
}

export type Denomination = Banknote["value"];

// Reserved hook for v2 super powers / secret roles. Not instantiated in v1.
export interface Effect {
  kind: string;
}

export interface Player {
  id: string;
  displayName: string;
  colorOrAvatar: string;
  bullets: BulletCard[];
  cash: Banknote[];
  wounds: 0 | 1 | 2 | 3;
  shame: number;
  status: 'alive' | 'dead';
  effects: Effect[];
}

export type RoundPhase =
  | 'commit'
  | 'standoff'
  | 'standoff_hold'
  | 'withdraw'
  | 'reveal_withdraw'
  | 'reveal_bbb'
  | 'reveal_others'
  | 'split';

export interface Commit {
  bullet?: BulletCard;
  target?: string;
  withdrew?: boolean;
}

export type ShotOutcome =
  | 'hit'
  | 'no_effect_clic'
  | 'voided_target_ducked'
  | 'voided_shooter_surprised';

export interface RoundShot {
  shooter: string;
  target: string;
  card: BulletCard;
  outcome: ShotOutcome;
}

export interface RoundResolution {
  shots: RoundShot[];
  ducks: string[];
  standing: string[];
  woundedThisRound: Record<string, number>;
  eliminated: string[];
  awards: Record<string, Banknote[]>;
  carryover: Banknote[];
}

export interface Round {
  number: number;
  phase: RoundPhase;
  phaseStartedAt: number;
  loot: Banknote[];
  commits: Record<string, Commit>;
  resolution?: RoundResolution;
}

export type GamePhase = 'lobby' | 'in_progress' | 'ended';

export interface Game {
  phase: GamePhase;
  players: Player[];
  round: Round;
  bankDeck: Banknote[];
  discardedBullets: BulletCard[];
  seed: string;
  previousRoundSummary?: { round: number; resolution: RoundResolution };
}
