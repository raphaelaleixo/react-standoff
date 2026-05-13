export type BulletCard = 'clic' | 'bang' | 'bang_bang_bang';

export interface Banknote {
  id: string;
  value: 5000 | 10000 | 20000;
}

export type Denomination = Banknote["value"];

export type PowerKind =
  | 'six_feet_under'
  | 'unbreakable'
  | 'dragon_skin'
  | 'super_coward'
  | 'specialist'
  | 'tough'
  | 'insane';

export interface PowerEffect {
  kind: PowerKind;
  revealed: boolean;
  used?: boolean;
}

export type Effect = PowerEffect;

export interface Player {
  id: string;
  displayName: string;
  colorOrAvatar: string;
  bullets: BulletCard[];
  cash: Banknote[];
  wounds: 0 | 1 | 2 | 3 | 4;
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
  // Phantom Pain card is on screen — held between reveal_others and split
  // so the reveal overlay finishes before the loot animation starts.
  | 'tough_reveal'
  | 'split'
  // Pocket Inferno (Insane) detonated. Round terminates after a short
  // linger — no further reveals, no split.
  | 'grenade';

export interface Commit {
  bullet?: BulletCard;
  target?: string;
  withdrew?: boolean;
  // Phantom Pain (Tough) arm: set at commit time. If the player ends up
  // struck or ducked this round, the resolver auto-claims their share.
  // The state machine copies this into `round.activations.tough` only at
  // the reveal_others handoff so the card doesn't fire during the early
  // resolves.
  armTough?: boolean;
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

export interface PowerActivation {
  playerId: string;
  kind: PowerKind;
  context?: Record<string, unknown>;
}

export interface RoundActivations {
  specialist?: { playerId: string; discardedBulletKind: BulletCard };
  tough?: string[];
  insane?: { playerId: string };
}

export interface RoundResolution {
  shots: RoundShot[];
  ducks: string[];
  standing: string[];
  woundedThisRound: Record<string, number>;
  eliminated: string[];
  awards: Record<string, Banknote[]>;
  carryover: Banknote[];
  powerActivations: PowerActivation[];
  roundTerminated?: { reason: 'grenade'; playerId: string };
}

export interface Round {
  number: number;
  phase: RoundPhase;
  phaseStartedAt: number;
  loot: Banknote[];
  commits: Record<string, Commit>;
  activations: RoundActivations;
  resolution?: RoundResolution;
}

export type GamePhase = 'lobby' | 'in_progress' | 'ended';

export interface GameVariants {
  superPowers: boolean;
}

export interface Game {
  phase: GamePhase;
  players: Player[];
  round: Round;
  bankDeck: Banknote[];
  discardedBullets: BulletCard[];
  seed: string;
  variants: GameVariants;
  previousRoundSummary?: { round: number; resolution: RoundResolution };
}
