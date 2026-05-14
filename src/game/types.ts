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
  | 'insane'
  | 'the_kid'
  | 'the_cunning';

export interface PowerEffect {
  kind: PowerKind;
  revealed: boolean;
  used?: boolean;
}

export type Effect = PowerEffect;

export type Role = 'cop' | 'mafia';

export interface Player {
  id: string;
  displayName: string;
  colorOrAvatar: string;
  bullets: BulletCard[];
  cash: Banknote[];
  wounds: 0 | 1 | 2 | 3 | 4;
  shame: ShameMarker[];
  status: 'alive' | 'dead';
  effects: Effect[];
  // Cop variant only. Undefined when the variant is off.
  role?: Role;
}

export interface ShameMarker {
  // Flashing-light markers are taken after reinforcements are on the way.
  // Only the cop's mission cares about this — mafia treat every marker
  // the same in scoring.
  flashing: boolean;
}

export type RoundPhase =
  | 'commit'
  | 'standoff'
  | 'standoff_hold'
  | 'withdraw'
  | 'reveal_withdraw'
  | 'reveal_bbb'
  | 'reveal_others'
  // The Kid / The Cunning late-pick window. After standoff_hold the
  // targeting map is fully drawn; holders of those powers fill in their
  // deferred half (Kid → target, Cunning → bullet). Auto-skips when no
  // holders are still partial.
  | 'late_commit'
  // Phantom Pain card is on screen — held between reveal_others and split
  // so the reveal overlay finishes before the loot animation starts.
  | 'tough_reveal'
  | 'split'
  // Cop variant only — rounds 1-6. The split's participants pass the
  // phone in seat order; the cop (if among them) may secretly call
  // for reinforcements. Auto-skips when variant off, round > 6, or
  // no split participants.
  | 'telephone'
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
  // Cop variant only. Records the per-round telephone outcome plus the
  // pass order (useful for replay/debugging). `currentHolderId` is set
  // while the pass is in progress and unset once the pass finalises.
  telephone?: {
    used: boolean;
    holderOrder: string[];
    currentHolderId?: string;
  };
}

export type GamePhase = 'lobby' | 'in_progress' | 'ended';

export interface GameVariants {
  superPowers: boolean;
  cop: boolean;
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
  // Cop variant only. Tracks calls made + the round reinforcements
  // landed (used for tagging future shame markers as flashing-light).
  cop?: {
    callsMade: 0 | 1 | 2 | 3;
    reinforcementsRoundOnTheWay?: number;
  };
}
