# Super Powers (Wave 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Super Powers advanced variant of Standoff (wave 1 of 2) — host-toggleable, deals 1 of 6 power cards to each player at game start, modifies round resolution and endgame scoring per `docs/superpowers/specs/2026-05-11-super-powers-wave-1-design.md`.

**Architecture:** Effects-as-data on `Player.effects` (discriminated union); resolver gains 4 power-aware steps producing `powerActivations` on the round resolution; two new phases (`specialist_prompt`, `tough_prompt`) inserted into the existing phase machine, auto-skipping when no input needed; new `scoring.ts` centralises endgame formula. With the variant toggle off, behaviour is bit-identical to v1.

**Tech Stack:** React 19 · TypeScript strict · MUI v9 · `react-gameroom` · Firebase Realtime Database · `react-i18next` · Vitest.

**Natural seam:** Tasks 1–13 are engine work (types, setup, resolver, scoring, transitions, deserialize, state machine, room init). Tasks 14–25 are UI surfaces. Engine merges before UI is acceptable.

---

## Task 1: Feature branch + type extensions

**Files:**
- Modify: `src/game/types.ts`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b super-powers-wave-1
```

- [ ] **Step 2: Replace `src/game/types.ts` with the variant-aware version**

Replace the existing file contents with:

```ts
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
  | 'tough';

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
  | 'specialist_prompt'
  | 'reveal_others'
  | 'tough_prompt'
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

export interface PowerActivation {
  playerId: string;
  kind: PowerKind;
  context?: Record<string, unknown>;
}

export interface RoundActivations {
  specialist?: { playerId: string; discardedBulletKind: BulletCard };
  tough?: string[];
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
```

- [ ] **Step 3: Run typecheck to surface every call site that needs updating**

Run: `npx tsc -b --noEmit`

Expected: type errors in `setup.ts`, `resolver.ts`, `transitions.ts`, `deserialize.ts`, `useGameState.ts`, `RoomPage.tsx`, and tests — these are the call sites the next tasks will fix. Note them but do not fix yet.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts
git commit -m "feat(types): add PowerKind, PowerEffect, GameVariants, RoundActivations, PowerActivation"
```

---

## Task 2: Power registry + i18n keys

**Files:**
- Create: `src/components/powers/registry.ts`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Add i18n keys**

In `src/locales/en.json`, add a new top-level `powers` block (place it after the existing `room` block). Use exactly these keys:

```json
  "powers": {
    "variantLabel": "Super Powers",
    "variantHint": "Each crewmate draws a hidden power.",
    "lobbyBannerOn": "Variant: Super Powers ⚓",
    "tapToStart": "Tap to start",
    "yourPower": "Your power",
    "used": "Used",
    "specialistPrompt": {
      "title": "Use Quartermaster's Reload?",
      "body": "Reveal your power to take back your Broadside. Choose a powder to discard in its place.",
      "useAndReveal": "Use & Reveal",
      "skip": "Skip"
    },
    "toughPrompt": {
      "title": "Use Phantom Pain?",
      "body": "Reveal your power to take a share this round, despite being struck or yielding.",
      "useAndReveal": "Use & Reveal",
      "skip": "Skip"
    },
    "cards": {
      "six_feet_under": {
        "name": "Davy Jones's Cut",
        "description": "Shareholder of the undertakers. Earn $10,000 for each crewmate killed during the voyage."
      },
      "unbreakable": {
        "name": "Ironhide",
        "description": "You're only killed when you take a fourth wound."
      },
      "dragon_skin": {
        "name": "Krakenscale",
        "description": "You can only be wounded once per round, no matter how many shots land."
      },
      "super_coward": {
        "name": "Yellow-Belly's Purse",
        "description": "Each shame marker grants you $5,000 instead of costing it."
      },
      "specialist": {
        "name": "Quartermaster's Reload",
        "description": "After playing your Broadside, take it back and discard an unused powder instead. One use."
      },
      "tough": {
        "name": "Phantom Pain",
        "description": "Take a split share even if you were struck or yielded this round. One use."
      }
    }
  },
```

- [ ] **Step 2: Create the typed registry**

`src/components/powers/registry.ts`:

```ts
import type { PowerKind } from '../../game/types';

export interface PowerCardDef {
  kind: PowerKind;
  nameKey: string;
  descriptionKey: string;
}

export const POWER_KINDS: PowerKind[] = [
  'six_feet_under',
  'unbreakable',
  'dragon_skin',
  'super_coward',
  'specialist',
  'tough',
];

export const POWER_REGISTRY: Record<PowerKind, PowerCardDef> = {
  six_feet_under: {
    kind: 'six_feet_under',
    nameKey: 'powers.cards.six_feet_under.name',
    descriptionKey: 'powers.cards.six_feet_under.description',
  },
  unbreakable: {
    kind: 'unbreakable',
    nameKey: 'powers.cards.unbreakable.name',
    descriptionKey: 'powers.cards.unbreakable.description',
  },
  dragon_skin: {
    kind: 'dragon_skin',
    nameKey: 'powers.cards.dragon_skin.name',
    descriptionKey: 'powers.cards.dragon_skin.description',
  },
  super_coward: {
    kind: 'super_coward',
    nameKey: 'powers.cards.super_coward.name',
    descriptionKey: 'powers.cards.super_coward.description',
  },
  specialist: {
    kind: 'specialist',
    nameKey: 'powers.cards.specialist.name',
    descriptionKey: 'powers.cards.specialist.description',
  },
  tough: {
    kind: 'tough',
    nameKey: 'powers.cards.tough.name',
    descriptionKey: 'powers.cards.tough.description',
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/powers/registry.ts src/locales/en.json
git commit -m "feat(powers): power registry + i18n keys"
```

---

## Task 3: `powers.ts` — deal + eligibility helpers (TDD)

**Files:**
- Create: `src/game/powers.ts`
- Create: `src/game/powers.test.ts`

- [ ] **Step 1: Write the failing test**

`src/game/powers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { dealPowers, eligibleForSpecialist, eligibleForTough } from './powers';
import { makeRng } from './random';
import type { Game, Player } from './types';

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: ['clic', 'clic', 'clic', 'clic', 'clic', 'bang', 'bang', 'bang_bang_bang'],
    cash: [],
    wounds: 0,
    shame: 0,
    status: 'alive',
    effects: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    phase: 'in_progress',
    players: [],
    round: {
      number: 1,
      phase: 'commit',
      phaseStartedAt: 0,
      loot: [],
      commits: {},
      activations: {},
    },
    bankDeck: [],
    discardedBullets: [],
    seed: 'test',
    variants: { superPowers: true },
    ...overrides,
  };
}

describe('dealPowers', () => {
  it('deals one effect per player when variant on', () => {
    const players = [makePlayer('p1'), makePlayer('p2'), makePlayer('p3'), makePlayer('p4')];
    const dealt = dealPowers(players, makeRng('seed-a'));
    expect(dealt).toHaveLength(4);
    for (const p of dealt) {
      expect(p.effects).toHaveLength(1);
      expect(p.effects[0].revealed).toBe(false);
    }
  });

  it('deals unique powers (no duplicates across players)', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map(id => makePlayer(id));
    const dealt = dealPowers(players, makeRng('seed-b'));
    const kinds = dealt.map(p => p.effects[0].kind);
    expect(new Set(kinds).size).toBe(6);
  });

  it('is deterministic given the same RNG seed', () => {
    const players = ['p1', 'p2', 'p3', 'p4'].map(id => makePlayer(id));
    const a = dealPowers(players, makeRng('seed-c')).map(p => p.effects[0].kind);
    const b = dealPowers(players, makeRng('seed-c')).map(p => p.effects[0].kind);
    expect(a).toEqual(b);
  });
});

describe('eligibleForSpecialist', () => {
  it('true: holder played B!B!B!, alive, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(true);
  });

  it('false: holder did not play B!B!B!', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });

  it('false: already used', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: true, used: true }],
      })],
      round: {
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });

  it('false: holder eliminated this round', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'specialist', revealed: false }],
      })],
      round: {
        number: 1, phase: 'specialist_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang_bang_bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: ['p1'], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForSpecialist(game, 'p1')).toBe(false);
  });
});

describe('eligibleForTough', () => {
  it('true: holder alive, in ducks, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { withdrew: true } },
        activations: {},
        resolution: {
          shots: [], ducks: ['p1'], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(true);
  });

  it('true: holder alive, wounded this round, unused', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false, used: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: { p1: 1 },
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(true);
  });

  it('false: holder already in standing (no need)', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: ['p1'], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(false);
  });

  it('false: holder eliminated this round', () => {
    const game = makeGame({
      players: [makePlayer('p1', {
        effects: [{ kind: 'tough', revealed: false }],
      })],
      round: {
        number: 1, phase: 'tough_prompt', phaseStartedAt: 0, loot: [],
        commits: { p1: { bullet: 'bang', target: 'p2' } },
        activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: { p1: 3 },
          eliminated: ['p1'], awards: {}, carryover: [], powerActivations: [],
        },
      },
    });
    expect(eligibleForTough(game, 'p1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/powers.test.ts`

Expected: FAIL with "Cannot find module './powers'".

- [ ] **Step 3: Implement `powers.ts`**

`src/game/powers.ts`:

```ts
import { shuffle } from './random';
import type { Game, Player, PowerEffect, PowerKind } from './types';
import { POWER_KINDS } from '../components/powers/registry';

export function dealPowers(players: Player[], rng: () => number): Player[] {
  const shuffled = shuffle([...POWER_KINDS], rng);
  return players.map((p, i) => {
    if (i >= shuffled.length) return { ...p, effects: [] };
    const effect: PowerEffect = { kind: shuffled[i], revealed: false, used: false };
    return { ...p, effects: [effect] };
  });
}

function findPower(player: Player | undefined, kind: PowerKind): PowerEffect | undefined {
  return player?.effects.find(e => e.kind === kind);
}

export function hasUnusedPower(player: Player | undefined, kind: PowerKind): boolean {
  const e = findPower(player, kind);
  return !!e && !e.used;
}

export function eligibleForSpecialist(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'specialist')) return false;
  if (game.round.commits[playerId]?.bullet !== 'bang_bang_bang') return false;
  if (game.round.resolution?.eliminated.includes(playerId)) return false;
  return true;
}

export function eligibleForTough(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'tough')) return false;
  const resolution = game.round.resolution;
  if (!resolution) return false;
  if (resolution.eliminated.includes(playerId)) return false;
  if (resolution.standing.includes(playerId)) return false;
  const ducked = resolution.ducks.includes(playerId);
  const wounded = (resolution.woundedThisRound[playerId] ?? 0) > 0;
  return ducked || wounded;
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npx vitest run src/game/powers.test.ts`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/powers.ts src/game/powers.test.ts
git commit -m "feat(powers): dealPowers + eligibility helpers"
```

---

## Task 4: `setup.ts` — variants param + power dealing

**Files:**
- Modify: `src/game/setup.ts`
- Modify: `src/game/setup.test.ts`

- [ ] **Step 1: Read current `setup.test.ts` to add cases alongside existing ones**

Run: `cat src/game/setup.test.ts | head -40` to see fixtures already in place.

- [ ] **Step 2: Add the failing tests** to `src/game/setup.test.ts` (append):

```ts
import { initGame } from './setup';

describe('initGame variants', () => {
  const samplePlayer = (id: string) => ({
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: [],
    cash: [],
    wounds: 0 as const,
    shame: 0,
    status: 'alive' as const,
    effects: [],
  });

  it('variant off: every player has empty effects (regression)', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-off',
      0,
      { superPowers: false },
    );
    for (const p of game.players) expect(p.effects).toEqual([]);
    expect(game.variants.superPowers).toBe(false);
  });

  it('variant on: every player has exactly one PowerEffect, none revealed', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-on',
      0,
      { superPowers: true },
    );
    for (const p of game.players) {
      expect(p.effects).toHaveLength(1);
      expect(p.effects[0].revealed).toBe(false);
      expect(p.effects[0].used).toBe(false);
    }
    expect(game.variants.superPowers).toBe(true);
  });

  it('Round.activations starts as empty record', () => {
    const game = initGame(
      [samplePlayer('p1'), samplePlayer('p2'), samplePlayer('p3'), samplePlayer('p4')],
      'seed-act',
      0,
      { superPowers: true },
    );
    expect(game.round.activations).toEqual({});
  });
});
```

- [ ] **Step 3: Run tests, expect failure (initGame signature mismatch)**

Run: `npx vitest run src/game/setup.test.ts`

Expected: FAIL — `initGame` doesn't accept a 4th argument.

- [ ] **Step 4: Update `setup.ts`**

Replace `src/game/setup.ts` with:

```ts
import type { Banknote, BulletCard, Game, GameVariants, Player, Round } from './types';
import { makeRng, shuffle } from './random';
import { dealPowers } from './powers';

const STARTING_HAND: BulletCard[] = [
  'clic', 'clic', 'clic', 'clic', 'clic',
  'bang', 'bang',
  'bang_bang_bang',
];

const BANK_NOTE_VALUES: Banknote['value'][] = [
  ...Array(15).fill(5000),
  ...Array(15).fill(10000),
  ...Array(10).fill(20000),
];

export function buildBankDeck(): Banknote[] {
  return BANK_NOTE_VALUES.map((value, i) => ({ id: `n${i}`, value }));
}

export function initGame(
  players: Player[],
  seed: string,
  now: number,
  variants: GameVariants = { superPowers: false },
): Game {
  const rng = makeRng(seed);
  const shuffledDeck = shuffle(buildBankDeck(), rng);
  const loot = shuffledDeck.slice(0, 5);
  const bankDeck = shuffledDeck.slice(5);

  const baseDealt: Player[] = players.map(p => ({
    ...p,
    bullets: [...STARTING_HAND],
    cash: [],
    wounds: 0,
    shame: 0,
    status: 'alive',
    effects: [],
  }));

  const dealtPlayers = variants.superPowers
    ? dealPowers(baseDealt, rng)
    : baseDealt;

  const round: Round = {
    number: 1,
    phase: 'commit',
    phaseStartedAt: now,
    loot,
    commits: {},
    activations: {},
  };

  return {
    phase: 'in_progress',
    players: dealtPlayers,
    round,
    bankDeck,
    discardedBullets: [],
    seed,
    variants,
  };
}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `npx vitest run src/game/setup.test.ts`

Expected: all green (both new cases plus existing setup tests).

- [ ] **Step 6: Commit**

```bash
git add src/game/setup.ts src/game/setup.test.ts
git commit -m "feat(setup): initGame accepts variants param, deals powers when on"
```

---

## Task 5: `transitions.ts` — preserve variants, reset activations

**Files:**
- Modify: `src/game/transitions.ts`
- Modify: `src/game/transitions.test.ts`

- [ ] **Step 1: Add failing tests** to `src/game/transitions.test.ts` (append):

```ts
import { describe, it, expect } from 'vitest';
import { startNextRound } from './transitions';
import type { Game } from './types';

function baseGame(): Game {
  return {
    phase: 'in_progress',
    players: [],
    round: {
      number: 1,
      phase: 'split',
      phaseStartedAt: 0,
      loot: [],
      commits: { p1: { bullet: 'bang', target: 'p2' } },
      activations: { tough: ['p3'] },
      resolution: {
        shots: [], ducks: [], standing: [], woundedThisRound: {},
        eliminated: [], awards: {}, carryover: [], powerActivations: [],
      },
    },
    bankDeck: [],
    discardedBullets: [],
    seed: 's',
    variants: { superPowers: true },
  };
}

describe('startNextRound variants & activations', () => {
  it('preserves Game.variants across rounds', () => {
    const next = startNextRound(baseGame(), 1000);
    expect(next.variants).toEqual({ superPowers: true });
  });

  it('resets Round.activations to {} on the new round', () => {
    const next = startNextRound(baseGame(), 1000);
    expect(next.round.activations).toEqual({});
  });

  it('preserves variants when superPowers is false', () => {
    const g = baseGame();
    g.variants = { superPowers: false };
    const next = startNextRound(g, 1000);
    expect(next.variants).toEqual({ superPowers: false });
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npx vitest run src/game/transitions.test.ts`

Expected: FAIL — `activations` is missing on the new round, `variants` may be undefined.

- [ ] **Step 3: Update `transitions.ts`**

Replace `src/game/transitions.ts` with:

```ts
import type { Banknote, Game } from './types';

export function drawLoot(deck: Banknote[], count: number): { drawn: Banknote[]; remaining: Banknote[] } {
  const take = Math.min(count, deck.length);
  return { drawn: deck.slice(0, take), remaining: deck.slice(take) };
}

export function startNextRound(game: Game, now: number): Game {
  const carryover = game.round.resolution?.carryover ?? [];
  const { drawn, remaining } = drawLoot(game.bankDeck, 5);
  const next: Game = {
    ...game,
    variants: game.variants,
    round: {
      number: game.round.number + 1,
      phase: 'commit',
      phaseStartedAt: now,
      loot: [...drawn, ...carryover],
      commits: {},
      activations: {},
    },
    bankDeck: remaining,
  };
  if (game.round.resolution) {
    next.previousRoundSummary = {
      round: game.round.number,
      resolution: game.round.resolution,
    };
  }
  return next;
}

export type EndGameReason = 'all_rounds' | 'last_alive' | 'no_alive';

export function endGameStatus(game: Game): { ended: boolean; reason?: EndGameReason } {
  const aliveCount = game.players.filter(p => p.status === 'alive').length;
  if (aliveCount === 0) return { ended: true, reason: 'no_alive' };
  if (aliveCount === 1) return { ended: true, reason: 'last_alive' };
  if (game.round.number >= 8) return { ended: true, reason: 'all_rounds' };
  return { ended: false };
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npx vitest run src/game/transitions.test.ts`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/transitions.ts src/game/transitions.test.ts
git commit -m "feat(transitions): preserve variants + reset Round.activations"
```

---

## Task 6: Resolver — Dragon Skin clamp

**Files:**
- Modify: `src/game/resolver.ts`
- Modify: `src/game/resolver.test.ts`

- [ ] **Step 1: Add failing tests** to `src/game/resolver.test.ts` (append). First add a helper if not present:

```ts
import { resolveRound } from './resolver';
import type { Banknote, Commit, Player, PowerKind } from './types';

function pl(id: string, opts: { wounds?: 0|1|2|3|4; powers?: PowerKind[] } = {}): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: 'calico_jack',
    bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
    cash: [],
    wounds: opts.wounds ?? 0,
    shame: 0,
    status: 'alive',
    effects: (opts.powers ?? []).map(k => ({ kind: k, revealed: false, used: false })),
  };
}

const note = (id: string, value: 5000 | 10000 | 20000): Banknote => ({ id, value });

describe('resolveRound — Dragon Skin', () => {
  it('clamps multi-wound to 1 and pushes activation', () => {
    const players = [
      pl('p1', { powers: ['dragon_skin'] }),
      pl('p2'),
      pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(1);
    const act = resolution.powerActivations.find(a => a.kind === 'dragon_skin');
    expect(act?.playerId).toBe('p1');
  });

  it('1 wound: no clamp, no activation (power stays hidden)', () => {
    const players = [pl('p1', { powers: ['dragon_skin'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(1);
    expect(resolution.powerActivations).toEqual([]);
  });

  it('no Dragon Skin in hand: multi-wound unchanged (regression)', () => {
    const players = [pl('p1'), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.woundedThisRound.p1).toBe(2);
    expect(resolution.powerActivations).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npx vitest run src/game/resolver.test.ts`

Expected: FAIL — `powerActivations` not present on resolution.

- [ ] **Step 3: Update `resolver.ts`** — apply Dragon Skin clamp + always emit `powerActivations`.

Replace `src/game/resolver.ts` with:

```ts
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
```

- [ ] **Step 4: Run tests, expect Dragon Skin tests pass; other resolver tests stay green**

Run: `npx vitest run src/game/resolver.test.ts`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/resolver.ts src/game/resolver.test.ts
git commit -m "feat(resolver): Dragon Skin clamp + activations + Unbreakable threshold + Tough + Specialist bookkeeping"
```

> Note: Task 6 implementation already includes the hooks for Unbreakable, Tough, and Specialist so the file stays internally consistent. Tasks 7–9 below add their *tests* and verify them, but the resolver implementation is already in place.

---

## Task 7: Resolver tests — Unbreakable

**Files:**
- Modify: `src/game/resolver.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `src/game/resolver.test.ts`:

```ts
describe('resolveRound — Unbreakable', () => {
  it('player at 0 wounds + 3 incoming: not eliminated, activation pushed', () => {
    const players = [
      pl('p1', { wounds: 0, powers: ['unbreakable'] }),
      pl('p2'), pl('p3'), pl('p4'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
    };
    const { resolution, players: out } = resolveRound(commits, players, []);
    expect(resolution.eliminated).not.toContain('p1');
    const survived = out.find(p => p.id === 'p1');
    expect(survived?.wounds).toBe(3);
    expect(survived?.status).toBe('alive');
    expect(resolution.powerActivations.some(a => a.kind === 'unbreakable')).toBe(true);
  });

  it('player at 0 wounds + 4 incoming: eliminated at 4', () => {
    const players = [
      pl('p1', { wounds: 0, powers: ['unbreakable'] }),
      pl('p2'), pl('p3'), pl('p4'), pl('p5'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
      p5: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.eliminated).toContain('p1');
  });

  it('regression: non-Unbreakable still dies at 3 wounds', () => {
    const players = [pl('p1', { wounds: 0 }), pl('p2'), pl('p3'), pl('p4')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'bang', target: 'p1' },
      p4: { bullet: 'bang', target: 'p1' },
    };
    const { resolution } = resolveRound(commits, players, []);
    expect(resolution.eliminated).toContain('p1');
  });
});
```

- [ ] **Step 2: Run tests, expect pass (implementation already in resolver from Task 6)**

Run: `npx vitest run src/game/resolver.test.ts`

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/game/resolver.test.ts
git commit -m "test(resolver): Unbreakable threshold cases"
```

---

## Task 8: Resolver tests — Tough

**Files:**
- Modify: `src/game/resolver.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/game/resolver.test.ts`:

```ts
describe('resolveRound — Tough', () => {
  it('wounded holder activated: re-added to standing, gets share', () => {
    const players = [
      pl('p1', { powers: ['tough'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const loot = [note('n1', 10000), note('n2', 10000)];
    const { resolution } = resolveRound(commits, players, loot, { tough: ['p1'] });
    expect(resolution.standing).toContain('p1');
    expect(resolution.awards.p1).toBeDefined();
    expect(resolution.powerActivations.some(a => a.kind === 'tough' && a.playerId === 'p1')).toBe(true);
  });

  it('no activation: wounded holder is not in standing (regression)', () => {
    const players = [pl('p1', { powers: ['tough'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(commits, players, [], {});
    expect(resolution.standing).not.toContain('p1');
  });

  it('dead holder cannot use Tough', () => {
    const players = [
      pl('p1', { wounds: 2, powers: ['tough'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'clic', target: 'p2' },
      p2: { bullet: 'bang', target: 'p1' },
      p3: { bullet: 'clic', target: 'p2' },
    };
    const { resolution } = resolveRound(commits, players, [], { tough: ['p1'] });
    expect(resolution.standing).not.toContain('p1');
    expect(resolution.eliminated).toContain('p1');
  });
});
```

- [ ] **Step 2: Run tests, expect pass**

Run: `npx vitest run src/game/resolver.test.ts`

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/game/resolver.test.ts
git commit -m "test(resolver): Tough re-add-to-standing cases"
```

---

## Task 9: Resolver tests — Specialist

**Files:**
- Modify: `src/game/resolver.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/game/resolver.test.ts`:

```ts
describe('resolveRound — Specialist', () => {
  it('played B!B!B! + activation: B!B!B! stays in bullets, chosen kind discarded', () => {
    const players = [
      pl('p1', { powers: ['specialist'] }),
      pl('p2'), pl('p3'),
    ];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang_bang_bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { players: out, discardedBullets } = resolveRound(
      commits, players, [], { specialist: { playerId: 'p1', discardedBulletKind: 'clic' } },
    );
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.bullets.filter(b => b === 'bang_bang_bang')).toHaveLength(1);
    expect(p1Out.bullets.filter(b => b === 'clic')).toHaveLength(4); // started with 5 clics, -1 chosen
    expect(discardedBullets).toContain('clic');
    expect(discardedBullets).not.toContain('bang_bang_bang');
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.used).toBe(true);
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.revealed).toBe(true);
  });

  it('no activation: B!B!B! is discarded normally (regression)', () => {
    const players = [pl('p1', { powers: ['specialist'] }), pl('p2'), pl('p3')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang_bang_bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p1' },
    };
    const { players: out, discardedBullets } = resolveRound(commits, players, [], {});
    const p1Out = out.find(p => p.id === 'p1')!;
    expect(p1Out.bullets.filter(b => b === 'bang_bang_bang')).toHaveLength(0);
    expect(discardedBullets).toContain('bang_bang_bang');
    expect(p1Out.effects.find(e => e.kind === 'specialist')?.used).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run tests, expect pass**

Run: `npx vitest run src/game/resolver.test.ts`

Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add src/game/resolver.test.ts
git commit -m "test(resolver): Specialist bullet-swap cases"
```

---

## Task 10: `scoring.ts` — endgame formula

**Files:**
- Create: `src/game/scoring.ts`
- Create: `src/game/scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/game/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { finalScore, hasEffect, rankPlayers } from './scoring';
import type { Banknote, Player } from './types';

const note = (id: string, value: 5000 | 10000 | 20000): Banknote => ({ id, value });

function pl(id: string, opts: Partial<Player> = {}): Player {
  return {
    id, displayName: id, colorOrAvatar: 'calico_jack',
    bullets: [], cash: [], wounds: 0, shame: 0, status: 'alive',
    effects: [], ...opts,
  };
}

describe('hasEffect', () => {
  it('true when matching effect present', () => {
    const p = pl('p1', { effects: [{ kind: 'super_coward', revealed: false }] });
    expect(hasEffect(p, 'super_coward')).toBe(true);
  });
  it('false when no effects', () => {
    expect(hasEffect(pl('p1'), 'unbreakable')).toBe(false);
  });
});

describe('finalScore', () => {
  it('base formula: cash − $5k × shame', () => {
    const p = pl('p1', { cash: [note('a', 10000), note('b', 5000)], shame: 1 });
    expect(finalScore(p, 0)).toBe(15000 - 5000);
  });

  it('Super Coward flips shame sign', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: 2,
      effects: [{ kind: 'super_coward', revealed: false }],
    });
    expect(finalScore(p, 0)).toBe(10000 + 2 * 5000);
  });

  it('6 Feet Under: +$10k per total kill', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: 0,
      effects: [{ kind: 'six_feet_under', revealed: false }],
    });
    expect(finalScore(p, 3)).toBe(10000 + 3 * 10000);
  });

  it('both held: stack', () => {
    const p = pl('p1', {
      cash: [note('a', 10000)],
      shame: 1,
      effects: [
        { kind: 'super_coward', revealed: false },
        { kind: 'six_feet_under', revealed: false },
      ],
    });
    expect(finalScore(p, 2)).toBe(10000 + 5000 + 2 * 10000);
  });
});

describe('rankPlayers (tiebreakers)', () => {
  it('orders by score descending', () => {
    const a = pl('a', { cash: [note('n', 20000)] });
    const b = pl('b', { cash: [note('n', 10000)] });
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['a', 'b']);
  });
  it('tie on score → fewer shame wins', () => {
    const a = pl('a', { cash: [note('n', 10000)], shame: 0 });
    const b = pl('b', { cash: [note('n', 15000)], shame: 1 });
    // both score $10k. a has fewer shame.
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['a', 'b']);
  });
  it('tie on score and shame → more wounds wins', () => {
    const a = pl('a', { cash: [note('n', 10000)], shame: 0, wounds: 1 });
    const b = pl('b', { cash: [note('n', 10000)], shame: 0, wounds: 2 });
    expect(rankPlayers([a, b], 0).map(p => p.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npx vitest run src/game/scoring.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scoring.ts`**

`src/game/scoring.ts`:

```ts
import type { Player, PowerKind } from './types';

export function hasEffect(player: Player, kind: PowerKind): boolean {
  return player.effects.some(e => e.kind === kind);
}

export function finalScore(player: Player, totalKills: number): number {
  if (player.status === 'dead') return 0;
  const cashTotal = player.cash.reduce((s, b) => s + b.value, 0);
  const shameSign = hasEffect(player, 'super_coward') ? +1 : -1;
  const undertakerBonus = hasEffect(player, 'six_feet_under') ? 10_000 * totalKills : 0;
  return cashTotal + shameSign * 5_000 * player.shame + undertakerBonus;
}

export function rankPlayers(players: Player[], totalKills: number): Player[] {
  return [...players].sort((a, b) => {
    const sa = finalScore(a, totalKills);
    const sb = finalScore(b, totalKills);
    if (sa !== sb) return sb - sa;
    if (a.shame !== b.shame) return a.shame - b.shame;
    return b.wounds - a.wounds;
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npx vitest run src/game/scoring.test.ts`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat(scoring): finalScore + Super Coward + 6 Feet Under + tiebreakers"
```

---

## Task 11: `deserialize.ts` — round-trip new fields

**Files:**
- Modify: `src/game/deserialize.ts`
- Create: `src/game/deserialize.test.ts`

- [ ] **Step 1: Write the failing test**

`src/game/deserialize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeGame } from './deserialize';

describe('normalizeGame variant fields', () => {
  it('round-trips Game.variants', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.variants.superPowers).toBe(true);
  });

  it('defaults variants to { superPowers: false } when missing', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
    };
    const g = normalizeGame(raw);
    expect(g?.variants).toEqual({ superPowers: false });
  });

  it('round-trips Player.effects', () => {
    const raw = {
      phase: 'in_progress',
      players: [{
        id: 'p1', displayName: 'p1', colorOrAvatar: 'calico_jack',
        bullets: [], cash: [], wounds: 0, shame: 0, status: 'alive',
        effects: [{ kind: 'unbreakable', revealed: false, used: false }],
      }],
      round: { number: 1, phase: 'commit', phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.players[0].effects).toEqual([{ kind: 'unbreakable', revealed: false, used: false }]);
  });

  it('round-trips Round.activations', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'tough_prompt', phaseStartedAt: 100, loot: [],
        commits: {},
        activations: { tough: ['p1', 'p2'], specialist: { playerId: 'p3', discardedBulletKind: 'clic' } },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.activations.tough).toEqual(['p1', 'p2']);
    expect(g?.round.activations.specialist).toEqual({ playerId: 'p3', discardedBulletKind: 'clic' });
  });

  it('round-trips RoundResolution.powerActivations', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'split', phaseStartedAt: 100, loot: [],
        commits: {}, activations: {},
        resolution: {
          shots: [], ducks: [], standing: [], woundedThisRound: {},
          eliminated: [], awards: {}, carryover: [],
          powerActivations: [{ playerId: 'p1', kind: 'dragon_skin' }],
        },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw);
    expect(g?.round.resolution?.powerActivations).toEqual([{ playerId: 'p1', kind: 'dragon_skin' }]);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npx vitest run src/game/deserialize.test.ts`

Expected: FAIL — new fields missing on the normalized result.

- [ ] **Step 3: Update `deserialize.ts`**

Replace `src/game/deserialize.ts` with:

```ts
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
  return out;
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
    powerActivations: asArray<PowerActivation>(r.powerActivations),
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
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npx vitest run src/game/deserialize.test.ts`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/game/deserialize.ts src/game/deserialize.test.ts
git commit -m "feat(deserialize): round-trip variants, effects, activations, powerActivations"
```

---

## Task 12: `useGameState` — new phases + activation writers

**Files:**
- Modify: `src/hooks/useGameState.ts`

- [ ] **Step 1: Add timing constants and update the resolve calls + add new phase transitions**

Open `src/hooks/useGameState.ts`. After the existing `SPLIT_MS` constant, add:

```ts
const SPECIALIST_PROMPT_MS = 10000;
const TOUGH_PROMPT_MS = 10000;
```

Update the import block at the top to also pull `eligibleForSpecialist` and `eligibleForTough`:

```ts
import { eligibleForSpecialist, eligibleForTough } from "../game/powers";
```

Update the `withdraw → reveal_withdraw` transition (`fire` body) to pass activations and write them:

```ts
const fire = () => {
  const result = resolveRound(
    game.round.commits,
    game.players,
    game.round.loot,
    game.round.activations,
  );
  update(ref(database, `rooms/${roomId}/game`), {
    "round/phase": "reveal_withdraw",
    "round/phaseStartedAt": serverTimestamp(),
    "round/resolution": result.resolution,
    discardedBullets: [...game.discardedBullets, ...result.discardedBullets],
  });
};
```

Replace the `reveal_bbb → reveal_others` transition with a `reveal_bbb → specialist_prompt` transition:

```ts
// reveal_bbb → specialist_prompt
useEffect(() => {
  if (!roomId || !game) return;
  if (game.round.phase !== "reveal_bbb") return;
  const remaining = REVEAL_BBB_MS - (serverNow() - game.round.phaseStartedAt);
  const fire = () => update(ref(database, `rooms/${roomId}/game/round`), {
    phase: "specialist_prompt",
    phaseStartedAt: serverTimestamp(),
  });
  const t = setTimeout(fire, Math.max(0, remaining));
  return () => clearTimeout(t);
}, [roomId, game, serverNow]);
```

Add a new transition for `specialist_prompt → reveal_others`:

```ts
// specialist_prompt → reveal_others (auto-skip when no eligible player; otherwise 10s soft timeout)
useEffect(() => {
  if (!roomId || !game) return;
  if (game.round.phase !== "specialist_prompt") return;
  if (!game.variants.superPowers) {
    update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "reveal_others",
      phaseStartedAt: serverTimestamp(),
    });
    return;
  }
  const eligible = game.players.find(p => eligibleForSpecialist(game, p.id));
  const fire = () => {
    // Re-resolve with whatever activations were written by now.
    const result = resolveRound(
      game.round.commits, game.players, game.round.loot, game.round.activations,
    );
    update(ref(database, `rooms/${roomId}/game`), {
      "round/phase": "reveal_others",
      "round/phaseStartedAt": serverTimestamp(),
      "round/resolution": result.resolution,
    });
  };
  if (!eligible) {
    fire();
    return;
  }
  const remaining = SPECIALIST_PROMPT_MS - (serverNow() - game.round.phaseStartedAt);
  const t = setTimeout(fire, Math.max(0, remaining));
  return () => clearTimeout(t);
}, [roomId, game, serverNow]);
```

Replace the `reveal_others → split` transition with `reveal_others → tough_prompt`:

```ts
// reveal_others → tough_prompt
useEffect(() => {
  if (!roomId || !game) return;
  if (game.round.phase !== "reveal_others") return;
  const remaining = REVEAL_OTHERS_MS - (serverNow() - game.round.phaseStartedAt);
  const fire = () => update(ref(database, `rooms/${roomId}/game/round`), {
    phase: "tough_prompt",
    phaseStartedAt: serverTimestamp(),
  });
  const t = setTimeout(fire, Math.max(0, remaining));
  return () => clearTimeout(t);
}, [roomId, game, serverNow]);
```

Add a new transition for `tough_prompt → split`:

```ts
// tough_prompt → split (auto-skip when no eligible player; otherwise 10s soft timeout)
useEffect(() => {
  if (!roomId || !game) return;
  if (game.round.phase !== "tough_prompt") return;
  if (!game.variants.superPowers) {
    update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "split",
      phaseStartedAt: serverTimestamp(),
    });
    return;
  }
  const eligible = game.players.find(p => eligibleForTough(game, p.id));
  const fire = () => {
    const result = resolveRound(
      game.round.commits, game.players, game.round.loot, game.round.activations,
    );
    update(ref(database, `rooms/${roomId}/game`), {
      "round/phase": "split",
      "round/phaseStartedAt": serverTimestamp(),
      "round/resolution": result.resolution,
    });
  };
  if (!eligible) {
    fire();
    return;
  }
  const remaining = TOUGH_PROMPT_MS - (serverNow() - game.round.phaseStartedAt);
  const t = setTimeout(fire, Math.max(0, remaining));
  return () => clearTimeout(t);
}, [roomId, game, serverNow]);
```

In the `split → next round` transition, update the resolve call to pass activations:

```ts
const result = resolveRound(
  game.round.commits, game.players, game.round.loot, game.round.activations,
);
```

- [ ] **Step 2: Add write helpers for Specialist/Tough activations**

At the bottom of the hook, just before `const loading = …`, add:

```ts
const submitSpecialist = useCallback(
  async (playerId: string, discardedBulletKind: BulletCard) => {
    if (!roomId) return;
    await update(ref(database, `rooms/${roomId}/game/round/activations`), {
      specialist: { playerId, discardedBulletKind },
    });
  },
  [roomId],
);

const submitTough = useCallback(
  async (playerId: string) => {
    if (!roomId) return;
    await update(
      ref(database, `rooms/${roomId}/game/round/activations`),
      // RTDB write requires fetch-merge; use a callback with `get` if you need
      // to support multiple Tough holders. Wave 1 deals at most one per player,
      // so a single-player append is sufficient.
      { tough: [playerId] },
    );
  },
  [roomId],
);
```

And include them in the return:

```ts
return { game, loading, submitCommit, submitDuck, submitSpecialist, submitTough };
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`

Expected: no errors in `useGameState.ts`.

- [ ] **Step 4: Run all unit tests** (sanity, no regressions)

Run: `npx vitest run`

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat(state-machine): specialist_prompt + tough_prompt phases + activation writers"
```

---

## Task 13: `createRoom` + `RoomPage.onStart` — thread variants through

**Files:**
- Modify: `src/lib/createRoom.ts`
- Modify: `src/pages/RoomPage.tsx`

- [ ] **Step 1: Make `createRoom` accept an initial variants flag**

Replace `src/lib/createRoom.ts` with:

```ts
import { createInitialRoom, generateRoomId } from "react-gameroom";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import type { GameVariants, Player } from "../game/types";

const ROOM_CONFIG = { minPlayers: 4, maxPlayers: 6, requireFull: false };

export async function createRoom(
  variants: GameVariants = { superPowers: false },
): Promise<string> {
  const roomId = generateRoomId();
  const initial = { ...createInitialRoom<Player>(ROOM_CONFIG), roomId };
  await set(ref(database, `rooms/${roomId}/state`), initial);
  await set(ref(database, `rooms/${roomId}/lobbyVariants`), variants);
  return roomId;
}
```

- [ ] **Step 2: Read the current `RoomPage.tsx`** to understand the existing `onStart` flow and how it reads the room state.

Run: `cat src/pages/RoomPage.tsx | head -100`

- [ ] **Step 3: Update `RoomPage.onStart`** to load the lobby variants from Firebase and pass them to `initGame`:

In `src/pages/RoomPage.tsx`, add at the top:

```ts
import { get } from "firebase/database";
import type { GameVariants } from "../game/types";
```

Locate the `onStart` async function (around line 63) and replace its body with a version that fetches `lobbyVariants` first:

```ts
const onStart = async () => {
  if (!id) return;
  const startedRoom = startGame(roomState);
  // Read the lobby variants (default off if missing).
  const variantsSnap = await get(ref(database, `rooms/${id}/lobbyVariants`));
  const variants: GameVariants =
    (variantsSnap.val() as GameVariants | null) ?? { superPowers: false };
  const players: Player[] = startedRoom.players
    .filter(s => s.status === "ready" && s.data)
    .map(s => ({
      id: String(s.id),
      displayName: s.name ?? `Player ${s.id}`,
      colorOrAvatar: s.data?.colorOrAvatar ?? "calico_jack",
      bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    }));
  const initialGame = initGame(players, id, Date.now(), variants);
  await set(ref(database, `rooms/${id}/state`), startedRoom);
  await set(ref(database, `rooms/${id}/game`), initialGame);
};
```

Make sure `database` and `ref` are imported from `firebase/database`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --noEmit`

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/createRoom.ts src/pages/RoomPage.tsx
git commit -m "feat(room): thread GameVariants from lobby through initGame"
```

---

## Task 14: Lobby variant toggle UI (big screen)

**Files:**
- Modify: `src/pages/RoomPage.tsx`

- [ ] **Step 1: Add the toggle component inline in `RoomPage`**

Inside `RoomPage`, in the lobby branch of the render, add a `<FormControlLabel>` switch wired to a local state, with a Firebase write on change. Near the top of the component, add:

```tsx
import { Switch, FormControlLabel, Box, Typography } from "@mui/material";
import { useEffect as useEffect2, useState } from "react";
import { onValue } from "firebase/database";
import { useTranslation } from "react-i18next";
```

Then add inside the component (after the existing `roomState` setup):

```tsx
const { t } = useTranslation();
const [variantSuperPowers, setVariantSuperPowers] = useState(false);

useEffect2(() => {
  if (!id) return;
  const r = ref(database, `rooms/${id}/lobbyVariants/superPowers`);
  return onValue(r, snap => setVariantSuperPowers(!!snap.val()));
}, [id]);

const onVariantToggle = async (next: boolean) => {
  if (!id) return;
  await set(ref(database, `rooms/${id}/lobbyVariants`), { superPowers: next });
};
```

Render the toggle in the lobby view (place near the Start button, only when `isLobby`):

```tsx
{isLobby && (
  <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <FormControlLabel
      control={
        <Switch
          checked={variantSuperPowers}
          onChange={(_, v) => onVariantToggle(v)}
        />
      }
      label={t("powers.variantLabel")}
    />
    <Typography variant="caption" sx={{ opacity: 0.7 }}>
      {t("powers.variantHint")}
    </Typography>
  </Box>
)}
```

- [ ] **Step 2: Show the lobby variant banner on phones**

In `src/pages/PlayerJoinPage.tsx` (and any other lobby-side phone view; locate via `grep -rn "lobby" src/pages | grep -i player`), subscribe to `rooms/${id}/lobbyVariants` the same way and render a small chip when on:

```tsx
{variantSuperPowers && (
  <Box sx={{ mt: 1, opacity: 0.8 }}>
    <Typography variant="caption">{t("powers.lobbyBannerOn")}</Typography>
  </Box>
)}
```

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`

Open `http://localhost:5173`, create a room, observe the toggle on the lobby screen, flip it, refresh: state persists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/RoomPage.tsx src/pages/PlayerJoinPage.tsx
git commit -m "feat(lobby): variant toggle + lobby banner"
```

---

## Task 15: `PowerCard` component

**Files:**
- Create: `src/components/powers/PowerCard.tsx`

- [ ] **Step 1: Implement the component**

`src/components/powers/PowerCard.tsx`:

```tsx
import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { POWER_REGISTRY } from "./registry";

export type PowerCardVariant = "faceDown" | "revealing" | "faceUp" | "used";

interface Props {
  kind: PowerKind;
  variant?: PowerCardVariant;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 80, height: 110, titleVariant: "caption" as const, descVariant: "caption" as const, descShown: false },
  md: { width: 200, height: 280, titleVariant: "h6" as const, descVariant: "body2" as const, descShown: true },
  lg: { width: 280, height: 380, titleVariant: "h5" as const, descVariant: "body1" as const, descShown: true },
};

export function PowerCard({ kind, variant = "faceUp", size = "md" }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  const dims = SIZES[size];
  const faceDown = variant === "faceDown";
  const used = variant === "used";

  return (
    <Paper
      elevation={3}
      sx={{
        width: dims.width,
        height: dims.height,
        p: 2,
        bgcolor: faceDown ? "background.paper" : "secondary.light",
        opacity: used ? 0.4 : 1,
        filter: used ? "grayscale(0.8)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: faceDown ? "center" : "space-between",
        transition: "all 0.4s ease",
      }}
    >
      {faceDown ? (
        <Typography variant="overline">⚓</Typography>
      ) : (
        <>
          <Typography variant={dims.titleVariant} sx={{ fontFamily: "'Pirata One', serif", textAlign: "center" }}>
            {t(def.nameKey)}
          </Typography>
          {dims.descShown && (
            <Typography variant={dims.descVariant} sx={{ textAlign: "center", opacity: 0.85 }}>
              {t(def.descriptionKey)}
            </Typography>
          )}
          {used && (
            <Box sx={{ position: "absolute", transform: "rotate(-15deg)", bottom: 24 }}>
              <Typography variant="h6" sx={{ color: "error.main" }}>
                {t("powers.used")}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/powers/PowerCard.tsx
git commit -m "feat(powers): PowerCard component (faceDown, revealing, faceUp, used)"
```

---

## Task 16: `PowerBadge` + GameBoard integration

**Files:**
- Create: `src/components/powers/PowerBadge.tsx`
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Implement `PowerBadge`**

`src/components/powers/PowerBadge.tsx`:

```tsx
import { Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { POWER_REGISTRY } from "./registry";

interface Props {
  kind: PowerKind;
  size?: number;
}

export function PowerBadge({ kind, size = 28 }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  return (
    <Tooltip title={t(def.nameKey)}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Pirata One', serif",
          fontSize: size * 0.5,
        }}
      >
        ⚓
      </Box>
    </Tooltip>
  );
}
```

- [ ] **Step 2: Render badge on each PlayerNode in GameBoard**

Open `src/components/GameBoard.tsx`. Find where `PlayerNode` (or the in-file equivalent) renders each player, and add a badge for any revealed power. Sketch:

```tsx
import { PowerBadge } from "./powers/PowerBadge";
// ...
{player.effects
  .filter(e => e.revealed)
  .map(e => (
    <PowerBadge key={e.kind} kind={e.kind} />
  ))}
```

Position the badge next to the player's flag / wound icons in the existing layout.

- [ ] **Step 3: Run typecheck + dev smoke check**

Run: `npx tsc -b --noEmit && npm run dev`

Expected: type-clean. In the dev server, drive a MockBigScreen scenario where a player has revealed=true and confirm the badge appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/powers/PowerBadge.tsx src/components/GameBoard.tsx
git commit -m "feat(powers): PowerBadge on revealed effects in GameBoard"
```

---

## Task 17: Phone — start-of-game card reveal + persistent widget

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Add the start-of-game card flow**

In `PlayerPage`, derive the player's `PowerEffect` from the game state:

```tsx
import { PowerCard } from "../components/powers/PowerCard";
// ...
const me = game?.players.find(p => p.id === String(playerId));
const myPower = me?.effects[0];
const [introDismissed, setIntroDismissed] = useState(false);
```

When `game.variants.superPowers && myPower && !introDismissed`, render a full-screen overlay before the regular phase UI:

```tsx
if (game.variants.superPowers && myPower && !introDismissed && game.phase === "in_progress" && game.round.number === 1 && game.round.phase === "commit") {
  return (
    <Box
      onClick={() => setIntroDismissed(true)}
      sx={{
        position: "fixed", inset: 0, bgcolor: "background.default",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}
    >
      <PowerCard kind={myPower.kind} variant="faceUp" size="lg" />
      <Typography variant="caption">{t("powers.tapToStart")}</Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Add the persistent power widget**

Below the main phase UI (in the bottom-right of every in-game phone screen), add:

```tsx
{game.variants.superPowers && myPower && (
  <Box
    sx={{ position: "fixed", bottom: 12, right: 12 }}
    onClick={() => setWidgetOpen(true)}
  >
    <PowerCard kind={myPower.kind} variant={myPower.used ? "used" : "faceUp"} size="sm" />
  </Box>
)}
{widgetOpen && myPower && (
  <Dialog open onClose={() => setWidgetOpen(false)}>
    <DialogContent>
      <PowerCard kind={myPower.kind} variant={myPower.used ? "used" : "faceUp"} size="lg" />
    </DialogContent>
  </Dialog>
)}
```

Add the state: `const [widgetOpen, setWidgetOpen] = useState(false);` and the relevant MUI imports.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlayerPage.tsx
git commit -m "feat(player): start-of-game power reveal + persistent widget"
```

---

## Task 18: `SpecialistPromptScreen`

**Files:**
- Create: `src/components/screens/SpecialistPromptScreen.tsx`
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Implement the screen**

`src/components/screens/SpecialistPromptScreen.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { BulletCard, Player } from "../../game/types";

interface Props {
  me: Player;
  playedBullet: BulletCard; // expected to be bang_bang_bang
  onUse: (kind: BulletCard) => void;
  onSkip: () => void;
  expiresAtMs: number;
}

export function SpecialistPromptScreen({ me, playedBullet, onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));

  // Show the player's remaining bullets EXCLUDING the played B!B!B!.
  // (Even though the resolver hasn't applied removal yet, we hide it for clarity.)
  const choices = me.bullets.filter((b, i, arr) =>
    !(b === playedBullet && arr.indexOf(b) === i),
  );
  const [selected, setSelected] = useState<BulletCard | null>(null);

  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontFamily: "'Pirata One', serif" }}>
        {t("powers.specialistPrompt.title")}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t("powers.specialistPrompt.body")}
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
        {choices.map((b, i) => (
          <Button
            key={`${b}-${i}`}
            variant={selected === b ? "contained" : "outlined"}
            onClick={() => setSelected(b)}
          >
            {b}
          </Button>
        ))}
      </Stack>
      <Stack direction="row" gap={1} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!selected}
          onClick={() => selected && onUse(selected)}
        >
          {t("powers.specialistPrompt.useAndReveal")}
        </Button>
        <Button variant="outlined" onClick={onSkip}>
          {t("powers.specialistPrompt.skip")}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
        {remaining}s
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Wire into `PlayerPage`**

Inside `PlayerPage`, when `game.round.phase === "specialist_prompt"` and `eligibleForSpecialist(game, playerId)`:

```tsx
import { eligibleForSpecialist } from "../game/powers";
import { SpecialistPromptScreen } from "../components/screens/SpecialistPromptScreen";

// ...
if (
  game.variants.superPowers &&
  game.round.phase === "specialist_prompt" &&
  me &&
  eligibleForSpecialist(game, me.id)
) {
  const playedBullet = game.round.commits[me.id]?.bullet!;
  return (
    <SpecialistPromptScreen
      me={me}
      playedBullet={playedBullet}
      onUse={(kind) => submitSpecialist(me.id, kind)}
      onSkip={() => { /* no-op; phase auto-advances on timeout */ }}
      expiresAtMs={game.round.phaseStartedAt + 10000}
    />
  );
}
```

(Where `submitSpecialist` is destructured from `useGameState`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/SpecialistPromptScreen.tsx src/pages/PlayerPage.tsx
git commit -m "feat(phone): SpecialistPromptScreen + wiring"
```

---

## Task 19: `ToughPromptScreen`

**Files:**
- Create: `src/components/screens/ToughPromptScreen.tsx`
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Implement the screen**

`src/components/screens/ToughPromptScreen.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  onUse: () => void;
  onSkip: () => void;
  expiresAtMs: number;
}

export function ToughPromptScreen({ onUse, onSkip, expiresAtMs }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.round((expiresAtMs - now) / 1000));
  useEffect(() => {
    if (remaining === 0) onSkip();
  }, [remaining, onSkip]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontFamily: "'Pirata One', serif" }}>
        {t("powers.toughPrompt.title")}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {t("powers.toughPrompt.body")}
      </Typography>
      <Stack direction="row" gap={1} sx={{ mt: 3 }}>
        <Button variant="contained" color="primary" onClick={onUse}>
          {t("powers.toughPrompt.useAndReveal")}
        </Button>
        <Button variant="outlined" onClick={onSkip}>
          {t("powers.toughPrompt.skip")}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
        {remaining}s
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Wire into `PlayerPage`**

```tsx
import { eligibleForTough } from "../game/powers";
import { ToughPromptScreen } from "../components/screens/ToughPromptScreen";

// ...
if (
  game.variants.superPowers &&
  game.round.phase === "tough_prompt" &&
  me &&
  eligibleForTough(game, me.id)
) {
  return (
    <ToughPromptScreen
      onUse={() => submitTough(me.id)}
      onSkip={() => { /* no-op */ }}
      expiresAtMs={game.round.phaseStartedAt + 10000}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/ToughPromptScreen.tsx src/pages/PlayerPage.tsx
git commit -m "feat(phone): ToughPromptScreen + wiring"
```

---

## Task 20: Big-screen auto-reveal overlays (Unbreakable, Dragon Skin)

**Files:**
- Create: `src/components/powers/PowerRevealOverlay.tsx`
- Modify: `src/pages/RoomPage.tsx` (or wherever the in-game big screen lives)

- [ ] **Step 1: Implement the overlay**

`src/components/powers/PowerRevealOverlay.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Box, Fade, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PowerCard } from "./PowerCard";
import type { PowerActivation, Player } from "../../game/types";

interface Props {
  activations: PowerActivation[];
  players: Player[];
}

export function PowerRevealOverlay({ activations, players }: Props) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(activations.length > 0);

  useEffect(() => {
    if (activations.length === 0) return;
    setIdx(0);
    setOpen(true);
    const stepMs = 1500;
    const i = setInterval(() => {
      setIdx(cur => {
        const next = cur + 1;
        if (next >= activations.length) {
          setOpen(false);
          clearInterval(i);
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(i);
  }, [activations]);

  if (activations.length === 0 || idx >= activations.length) return null;
  const cur = activations[idx];
  const owner = players.find(p => p.id === cur.playerId);

  return (
    <Fade in={open}>
      <Box
        sx={{
          position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.65)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 1300,
        }}
      >
        <Typography variant="overline" sx={{ color: "common.white" }}>
          {owner?.displayName ?? cur.playerId}
        </Typography>
        <PowerCard kind={cur.kind} variant="revealing" size="lg" />
      </Box>
    </Fade>
  );
}
```

- [ ] **Step 2: Mount the overlay in the in-game big screen**

In `RoomPage.tsx`, when `game.round.phase` is in `["reveal_bbb", "reveal_others", "split"]` and `game.round.resolution?.powerActivations` is non-empty, render the overlay. Filter activations to only Unbreakable / Dragon Skin for auto-reveal phases:

```tsx
import { PowerRevealOverlay } from "../components/powers/PowerRevealOverlay";
// ...
const autoActivations = (game.round.resolution?.powerActivations ?? [])
  .filter(a => a.kind === "unbreakable" || a.kind === "dragon_skin");

// inside the in-game render:
<PowerRevealOverlay activations={autoActivations} players={game.players} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/powers/PowerRevealOverlay.tsx src/pages/RoomPage.tsx
git commit -m "feat(big-screen): auto-reveal overlay for Unbreakable and Dragon Skin"
```

---

## Task 21: Big-screen manual-reveal overlays (Specialist, Tough)

**Files:**
- Modify: `src/pages/RoomPage.tsx`

- [ ] **Step 1: Filter activations differently for the manual-reveal phases**

In `RoomPage.tsx`, add a second activation set scoped to `specialist_prompt` and `tough_prompt`:

```tsx
const manualActivations = (game.round.resolution?.powerActivations ?? [])
  .filter(a => a.kind === "specialist" || a.kind === "tough");

// mount the same PowerRevealOverlay with `activations={manualActivations}` while
// game.round.phase === "specialist_prompt" || "tough_prompt".
```

- [ ] **Step 2: Smoke check via MockBigScreen (handled in Task 23)**

- [ ] **Step 3: Commit**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat(big-screen): manual-reveal overlay for Specialist and Tough"
```

---

## Task 22: Endgame leaderboard — variant rows

**Files:**
- Modify: the existing endgame screen component (likely `src/components/screens/MusterScreen.tsx` or wherever "reckoning"/"end-game" rendering lives — search with `grep -rn "rankPlayers\|endgame\|leaderboard\|reckon" src/components src/pages | head`).

- [ ] **Step 1: Locate the endgame screen**

Run: `grep -rn "rank\|leaderboard\|reckon\|endgame\|MusterScreen" src/components src/pages | head -20`

Identify the component that renders the final ranking. (If the implementation has it stubbed, place this work there.)

- [ ] **Step 2: Replace ad-hoc score computation with `finalScore` + `rankPlayers`**

```tsx
import { finalScore, hasEffect, rankPlayers } from "../../game/scoring";

const totalKills = game.players.filter(p => p.status === "dead").length;
const ranked = rankPlayers(game.players, totalKills);
```

For each row, render breakdown segments. Render the Super Coward column with sign awareness, and the Undertaker column only when the player holds `six_feet_under`:

```tsx
{ranked.map((pl, i) => (
  <Box key={pl.id}>
    <Typography>{i + 1}. {pl.displayName}</Typography>
    <Typography>${pl.cash.reduce((s, b) => s + b.value, 0)}</Typography>
    <Typography sx={{ color: hasEffect(pl, "super_coward") ? "success.main" : "error.main" }}>
      {hasEffect(pl, "super_coward") ? "+" : "−"}${pl.shame * 5000}
    </Typography>
    {hasEffect(pl, "six_feet_under") && (
      <Typography sx={{ color: "success.main" }}>
        +${totalKills * 10000}
      </Typography>
    )}
    <Typography>= ${finalScore(pl, totalKills)}</Typography>
    {pl.effects.map(e => (
      <PowerCard key={e.kind} kind={e.kind} variant="faceUp" size="sm" />
    ))}
  </Box>
))}
```

- [ ] **Step 3: Commit**

```bash
git add <endgame-file-path>
git commit -m "feat(endgame): variant-aware leaderboard rows + power flip-up"
```

---

## Task 23: Mock pages — variant toggle + force-activation controls

**Files:**
- Modify: `src/pages/MockBigScreen.tsx`
- Modify: `src/pages/MockPlayerPage.tsx`

- [ ] **Step 1: MockBigScreen — variant checkbox + per-power deal-me selectors**

In `MockBigScreen.tsx`, add a checkbox for the variant and a row of toggles to manually inject `{ kind, revealed: false }` onto each mock player, and buttons to inject `powerActivations` for animation review:

```tsx
import { POWER_KINDS, POWER_REGISTRY } from "../components/powers/registry";
import type { PowerKind } from "../game/types";
// ...
const [variantOn, setVariantOn] = useState(true);
const [assignments, setAssignments] = useState<Record<string, PowerKind>>({});
const [forcedActivations, setForcedActivations] = useState<PowerKind[]>([]);
// thread these into the mock Game object the page constructs.
```

UI: a `Switch` for `variantOn`, a select per player for `assignments`, a button row for each `PowerKind` that pushes an entry to `forcedActivations`.

- [ ] **Step 2: MockPlayerPage — deal-me selector + show-prompt buttons**

In `MockPlayerPage.tsx`, add a select that injects `{ kind, revealed: false, used: false }` into the mock player's `effects`, plus a pair of buttons that synthetically advance the phase to `specialist_prompt` / `tough_prompt` for UI review.

- [ ] **Step 3: Manual smoke check**

Run: `npm run dev`

Visit `/mock-big-screen` (or whichever DEV-only route is registered) and `/mock-player-page`, exercise each control, confirm the new UI surfaces render.

- [ ] **Step 4: Commit**

```bash
git add src/pages/MockBigScreen.tsx src/pages/MockPlayerPage.tsx
git commit -m "feat(dev): mock-page variant toggle + force-activation controls"
```

---

## Task 24: `MockPowerReveal` dev page

**Files:**
- Create: `src/components/dev/MockPowerReveal.tsx`
- Modify: `src/App.tsx` (or wherever the route table lives)

- [ ] **Step 1: Implement the dev page**

`src/components/dev/MockPowerReveal.tsx`:

```tsx
import { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import { POWER_KINDS } from "../powers/registry";
import { PowerRevealOverlay } from "../powers/PowerRevealOverlay";
import type { PowerActivation } from "../../game/types";

export function MockPowerReveal() {
  const [acts, setActs] = useState<PowerActivation[]>([]);
  return (
    <Box sx={{ p: 4 }}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {POWER_KINDS.map(k => (
          <Button key={k} variant="outlined" onClick={() => setActs([{ playerId: "demo", kind: k }])}>
            {k}
          </Button>
        ))}
        <Button onClick={() => setActs(POWER_KINDS.map(k => ({ playerId: "demo", kind: k })))}>
          all in sequence
        </Button>
      </Stack>
      <PowerRevealOverlay
        activations={acts}
        players={[{
          id: "demo", displayName: "Demo",
          colorOrAvatar: "calico_jack", bullets: [], cash: [],
          wounds: 0, shame: 0, status: "alive", effects: [],
        }]}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Register the route in DEV only**

In `src/App.tsx`, locate the existing mock routes (search for `import.meta.env.DEV` and existing mock route registrations) and add:

```tsx
{import.meta.env.DEV && (
  <Route path="/mock-power-reveal" element={<MockPowerReveal />} />
)}
```

(Plus the lazy import.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dev/MockPowerReveal.tsx src/App.tsx
git commit -m "feat(dev): MockPowerReveal page for isolated overlay review"
```

---

## Task 25: Regression suite — variant-off parity + final manual QA

**Files:**
- Create: `src/game/regression.test.ts`

- [ ] **Step 1: Write the regression test**

`src/game/regression.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveRound } from './resolver';
import type { Banknote, Commit, Player } from './types';

function pl(id: string, wounds: 0|1|2|3|4 = 0): Player {
  return {
    id, displayName: id, colorOrAvatar: 'calico_jack',
    bullets: ['clic','clic','clic','clic','clic','bang','bang','bang_bang_bang'],
    cash: [], wounds, shame: 0, status: 'alive', effects: [],
  };
}
const note = (id: string, value: 5000|10000|20000): Banknote => ({ id, value });

describe('variant-off parity (no effects, no activations)', () => {
  it('resolveRound output matches expected base behaviour', () => {
    const players = [pl('p1'), pl('p2'), pl('p3'), pl('p4')];
    const commits: Record<string, Commit> = {
      p1: { bullet: 'bang', target: 'p2' },
      p2: { bullet: 'clic', target: 'p1' },
      p3: { bullet: 'clic', target: 'p4' },
      p4: { withdrew: true },
    };
    const loot = [note('a', 10000), note('b', 10000), note('c', 5000)];
    const { resolution } = resolveRound(commits, players, loot, {});
    expect(resolution.powerActivations).toEqual([]);
    expect(resolution.eliminated).toEqual([]);
    expect(resolution.ducks).toEqual(['p4']);
    expect(Object.keys(resolution.awards).sort()).toEqual(['p1', 'p3']);
  });
});
```

- [ ] **Step 2: Run all tests + typecheck + lint**

Run:

```bash
npx vitest run
npx tsc -b --noEmit
npx eslint .
```

Expected: all clean.

- [ ] **Step 3: Manual end-to-end QA pass**

Run: `npm run dev --host`

On two devices (or two browser windows), end-to-end:

1. Create a room, flip the **Super Powers** toggle on, join with 4 players (one per device/window).
2. On each phone, confirm the power card reveal at game start.
3. Play round 1:
   - Deal someone Dragon Skin via Mock if needed; have 2+ players aim at them with bang. Confirm the big-screen Dragon Skin reveal animation and 1 wound.
   - Have someone play B!B!B!; on the Specialist-holder's phone, confirm the prompt appears in `specialist_prompt`. Accept; confirm the card stays in hand.
   - Have a Tough holder duck; confirm the `tough_prompt` appears and accepting puts them back in the split.
4. Play through to round 8 / last-alive; confirm endgame leaderboard renders the variant rows and unrevealed cards flip up.
5. Repeat with the variant **off**; confirm the round flow is bit-identical to the prior v1 behavior (no new phases, no overlays).

- [ ] **Step 4: Commit + open PR**

```bash
git add src/game/regression.test.ts
git commit -m "test: variant-off parity regression"
git push -u origin super-powers-wave-1
gh pr create --title "feat: super powers variant (wave 1)" --body "$(cat <<'EOF'
## Summary
- Adds the Super Powers host-toggleable variant (6 of 10 canonical powers — wave 1).
- New phases `specialist_prompt` and `tough_prompt` insert into the existing machine and auto-skip when no input is needed.
- Centralised endgame scoring in `src/game/scoring.ts`.
- Variant-off behaviour is bit-identical to v1 (regression test included).

## Spec
- `docs/superpowers/specs/2026-05-11-super-powers-wave-1-design.md`

## Test plan
- [ ] `npx vitest run` is green.
- [ ] `npx tsc -b --noEmit` is clean.
- [ ] Two-device end-to-end (variant on): card reveal at start, Dragon Skin / Unbreakable auto-reveal, Specialist prompt, Tough prompt, endgame leaderboard variant rows.
- [ ] Two-device end-to-end (variant off): no behaviour change vs `main`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes (for the executor)

- **Spec coverage:** Every section of `2026-05-11-super-powers-wave-1-design.md` maps to one or more tasks above. The 6 powers each get resolver tests (Tasks 6–9; 6 Feet Under and Super Coward are covered by `scoring.test.ts` in Task 10). The two new phases are added in Task 12. UI surfaces in Tasks 14–22. Mock pages in Tasks 23–24. Regression in Task 25.
- **Open spec questions** (pirate names, animation timings, card art, per-power copy) are partially resolved by the registry/i18n choices in Task 2; final art is deliberately left out of scope and can land in a follow-up PR.
- **Engine seam:** Tasks 1–13 are mergeable on their own; if reviewer pushback arrives on UI choices, the engine can ship first.
