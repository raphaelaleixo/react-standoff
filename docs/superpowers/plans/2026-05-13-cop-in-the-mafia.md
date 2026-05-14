# A Cop in the Mafia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the **A Cop in the Mafia** variant of Standoff per `docs/superpowers/specs/2026-05-13-cop-in-the-mafia-design.md` — host-toggleable alternative variant, deals one secret role (cop/mafia) per player, adds a per-round `telephone` phase where the cop can call for reinforcements, and replaces the base win condition with the asymmetric mission-plus-survival cop rule.

**Architecture:** Roles-as-data on `Player.role` (separate from `effects[]`); a new `telephone` phase between `split` and the next round's `commit` for rounds 1–6; switchboard counter on `Game.cop`; shame migrated from `number` to `{ flashing: boolean }[]` to support per-marker flashing-light tagging; new top-level scoring branch that picks cop-vs-mafia winner. With both variants off, behaviour is bit-identical to v1. Cop and super-powers are mutually exclusive at the lobby toggle in wave 1 — wave 2 lifts that restriction.

**Tech Stack:** React 19 · TypeScript strict · MUI v9 · `react-gameroom` · Firebase Realtime Database · `react-i18next` · Vitest.

**Natural seam:** Tasks 1–11 are engine work (types, roles, setup, transitions, resolver, scoring, deserialize). Task 12 is the state machine. Tasks 13–22 are UI. Tasks 23–24 are lobby/room wiring. Task 25 is dev scaffolding. Task 26 is regression + manual QA. Engine can merge before UI is presentable.

---

## Task 1: Feature branch + type extensions

**Files:**
- Modify: `src/game/types.ts`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b cop-in-the-mafia
```

- [ ] **Step 2: Extend `types.ts`** with role, telephone phase, shame migration, and cross-round cop state.

In `src/game/types.ts`, make these edits:

Add a new `Role` type before `Player`:

```ts
export type Role = 'cop' | 'mafia';
```

Change the `Player.shame` field from `number` to a tagged array, and add the optional `role`:

```ts
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
```

Add `'telephone'` to the `RoundPhase` union (insert between `'split'` and `'grenade'`):

```ts
export type RoundPhase =
  | 'commit'
  | 'standoff'
  | 'standoff_hold'
  | 'withdraw'
  | 'reveal_withdraw'
  | 'reveal_bbb'
  | 'reveal_others'
  | 'late_commit'
  | 'tough_reveal'
  | 'split'
  // Cop variant only — rounds 1-6. The split's participants pass the
  // phone in seat order; the cop (if among them) may secretly call
  // for reinforcements. Auto-skips when variant off, round > 6, or
  // no split participants.
  | 'telephone'
  | 'grenade';
```

Add a per-round telephone outcome on `Round`:

```ts
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
```

Add `cop` to `GameVariants` and a cross-round `cop` state to `Game`:

```ts
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
```

- [ ] **Step 3: Typecheck — expect failure**

Run:

```bash
npx tsc -b --noEmit
```

Expect every call site that reads or writes `Player.shame` as a number to error. This is the gate that surfaces every place needing the migration.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts
git commit -m "feat(cop): types — role, ShameMarker[], telephone phase, GameVariants.cop"
```

---

## Task 2: Shame array migration — fix every call site

**Files:**
- Modify: `src/game/setup.ts`
- Modify: `src/game/resolver.ts`
- Modify: `src/game/scoring.ts`
- Modify: `src/game/deserialize.ts`
- Modify: any UI files surfaced by typecheck (player cards, reckoning, mock fixtures)

- [ ] **Step 1: Run typecheck and list every error**

```bash
npx tsc -b --noEmit 2>&1 | grep -E "error TS|shame" | head -80
```

Capture the list. The migration touches every place that:
- Initializes `shame: 0` → must become `shame: []`
- Increments shame (`p.shame + 1`, `+= 1`) → must `push({ flashing: ... })`
- Reads shame as a number (`p.shame`, `* shame`) → must use `p.shame.length`
- Serializes shame to UI → render `p.shame.length` flat dots + count `flashing: true` separately

- [ ] **Step 2: Fix `setup.ts`** — initialize as empty array.

In `src/game/setup.ts`, change the player init inside `initGame`:

```ts
const baseDealt: Player[] = players.map(p => ({
  ...p,
  bullets: [...STARTING_HAND],
  cash: [],
  wounds: 0,
  shame: [],
  status: 'alive',
  effects: [],
}));
```

- [ ] **Step 3: Fix `resolver.ts`** — push markers instead of incrementing.

Find the place that adds a shame marker on duck (search the file for `shame` and `withdrew`). Replace incrementing with a push. The flashing flag is computed from cross-round cop state; for now pass `false` (Task 8 will rewire this with the cop game state in hand). Wherever you find a pattern like:

```ts
{ ...p, shame: p.shame + 1, ... }
```

Replace with:

```ts
{ ...p, shame: [...p.shame, { flashing: false }], ... }
```

- [ ] **Step 4: Fix `scoring.ts`** — read `shame.length`.

In `src/game/scoring.ts`:

```ts
import type { Player, PowerKind } from './types';

export function hasEffect(player: Player, kind: PowerKind): boolean {
  return player.effects.some(e => e.kind === kind);
}

export function finalScore(player: Player, totalKills: number): number {
  if (player.status === 'dead') return 0;
  const cashTotal = player.cash.reduce((s, b) => s + b.value, 0);
  const shameSign = hasEffect(player, 'super_coward') ? +1 : -1;
  const shameCount = player.shame.length;
  const undertakerBonus = hasEffect(player, 'six_feet_under') ? 10_000 * totalKills : 0;
  return cashTotal + shameSign * 5_000 * shameCount + undertakerBonus;
}

export function rankPlayers(players: Player[], totalKills: number): Player[] {
  return [...players].sort((a, b) => {
    const sa = finalScore(a, totalKills);
    const sb = finalScore(b, totalKills);
    if (sa !== sb) return sb - sa;
    if (a.shame.length !== b.shame.length) return a.shame.length - b.shame.length;
    return b.wounds - a.wounds;
  });
}
```

- [ ] **Step 5: Fix `deserialize.ts`** — normalize shame to array.

In `src/game/deserialize.ts`, replace the `shame` line in `normalizePlayer`:

```ts
shame: normalizeShame(r.shame),
```

And add the helper above `normalizePlayer`:

```ts
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
```

Also import `ShameMarker` at the top:

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
  ShameMarker,
} from './types';
```

- [ ] **Step 6: Fix every UI surface that reads `shame` as a number**

Search for `\.shame` references in `src/components/` and `src/pages/`. Each one becomes either `.shame.length` (count) or a map over the array (per-marker rendering). Examples:

```bash
rg "\.shame[^A-Za-z_]" src/ --type ts --type tsx
```

For each match: if rendering a count (e.g. badge number), change to `p.shame.length`. If iterating markers (e.g. row of dots), iterate the array. Defer flashing-light visual rendering to Task 21 — for now every marker renders the same.

- [ ] **Step 7: Fix mock fixtures**

In `src/components/dev/mockFixtures.ts` and `src/components/dev/scenarios.ts`, change any `shame: N` to `shame: Array.from({ length: N }, () => ({ flashing: false }))` or `shame: []`. (Search both files for `shame:`.)

- [ ] **Step 8: Run typecheck — expect clean**

```bash
npx tsc -b --noEmit
```

Expect zero errors.

- [ ] **Step 9: Run unit tests — expect all green**

```bash
npm test -- --run
```

Expect zero failures. The shame array migration is value-equivalent — all base-game tests still pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(shame): Player.shame → ShameMarker[] (prep for flashing-light tagging)"
```

---

## Task 3: Roles registry + i18n keys

**Files:**
- Create: `src/game/roles.ts`
- Modify: `src/locales/en.json`

- [ ] **Step 1: Add i18n keys**

In `src/locales/en.json`, add a top-level `cop` section. Pick a placement near the `powers` section for adjacency. Example block (insert as appropriate):

```json
"cop": {
  "lobby": {
    "toggleLabel": "A Cop in the Mafia",
    "toggleSub": "one of you is a cop",
    "requiresFiveSix": "requires 5 or 6 players",
    "exclusiveWithPowers": "wave 1: choose one — cop or super powers",
    "banner": "A cop is among you…"
  },
  "reveal": {
    "title": "Your role…",
    "cop": "You are the cop",
    "copBody": "Call for backup. Stay alive. Don't blink.",
    "mafia": "You are the mafia",
    "mafiaBody": "The cop is among you. Find them. Kill them. Or get rich trying.",
    "ack": "I'm in",
    "allDealt": "ROLES DEALT"
  },
  "widget": {
    "cop": "Cop",
    "mafia": "Mafia",
    "calls": "{{n}}/3",
    "callsDone": "3/3 ✓",
    "hintCallByRound6": "Call needs to land by round VI",
    "hintOneDuckLeft": "One more duck and you're cooked"
  },
  "telephone": {
    "heading": "THE PHONE IS WITH YOU",
    "pass": "Pass",
    "call": "Call",
    "callPlaced": "Call placed",
    "notUsed": "Telephone — not used",
    "used": "Telephone — used"
  },
  "switchboard": {
    "busy": "Busy",
    "reinforcementsSent": "Reinforcements Sent"
  },
  "reinforcements": {
    "overlayTitle": "REINFORCEMENTS ON THE WAY",
    "overlaySub": "the sirens are coming"
  },
  "reckoning": {
    "rolesIntro": "The roles…",
    "calledRoundN": "Reinforcements were called in round {{n}}.",
    "neverCame": "Reinforcements never came.",
    "copSurvived": "The cop survived.",
    "copKilledRoundN": "The cop was killed in round {{n}}.",
    "copFlashingShame": "The cop took {{n}} flashing-light shame marker(s).",
    "verdictCopWins": "JUSTICE SERVED",
    "verdictMafiaWins": "The cop will not testify."
  }
}
```

- [ ] **Step 2: Create `src/game/roles.ts`** — registry + helpers.

```ts
import { shuffle } from './random';
import type { Player, Role } from './types';

export const ROLES_FOR_PLAYER_COUNT: Record<number, Role[]> = {
  5: ['cop', 'mafia', 'mafia', 'mafia', 'mafia'],
  6: ['cop', 'mafia', 'mafia', 'mafia', 'mafia', 'mafia'],
};

export function dealRoles(players: Player[], rng: () => number): Player[] {
  const deck = ROLES_FOR_PLAYER_COUNT[players.length];
  if (!deck) {
    // Defensive: variant should only be enabled at 5-6 in the lobby.
    // If it slips through, fall through to no-role assignment so the
    // game still runs without crashing.
    return players;
  }
  const shuffled = shuffle([...deck], rng);
  return players.map((p, i) => ({ ...p, role: shuffled[i] }));
}

export function findCop(players: Player[]): Player | undefined {
  return players.find(p => p.role === 'cop');
}

export function isCop(player: Player | undefined): boolean {
  return player?.role === 'cop';
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc -b --noEmit
```

Expect zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/roles.ts src/locales/en.json
git commit -m "feat(cop): roles module + i18n keys for cop variant"
```

---

## Task 4: `roles.ts` — TDD for dealing semantics

**Files:**
- Create: `src/game/roles.test.ts`

- [ ] **Step 1: Write the failing tests**

In `src/game/roles.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { dealRoles, findCop, isCop } from './roles';
import { makeRng } from './random';
import type { Player } from './types';

function makePlayer(id: string): Player {
  return {
    id,
    displayName: id,
    colorOrAvatar: '#000',
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive',
    effects: [],
  };
}

describe('dealRoles', () => {
  it('deals exactly one cop and N-1 mafia at 5 players', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('seed-1'));
    expect(dealt).toHaveLength(5);
    const cops = dealt.filter(p => p.role === 'cop');
    const mafia = dealt.filter(p => p.role === 'mafia');
    expect(cops).toHaveLength(1);
    expect(mafia).toHaveLength(4);
  });

  it('deals exactly one cop and N-1 mafia at 6 players', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('seed-2'));
    expect(dealt.filter(p => p.role === 'cop')).toHaveLength(1);
    expect(dealt.filter(p => p.role === 'mafia')).toHaveLength(5);
  });

  it('is deterministic by seed', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const a = dealRoles(players, makeRng('determ-seed'));
    const b = dealRoles(players, makeRng('determ-seed'));
    expect(a.map(p => p.role)).toEqual(b.map(p => p.role));
  });

  it('different seeds produce different cop assignments (probabilistically)', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
    const copIds = seeds.map(s => dealRoles(players, makeRng(s)).find(p => p.role === 'cop')?.id);
    const distinct = new Set(copIds);
    // Across 8 seeds we should land on at least 2 distinct cops.
    expect(distinct.size).toBeGreaterThanOrEqual(2);
  });

  it('returns players unmodified when count is unsupported', () => {
    const players = ['a', 'b', 'c'].map(makePlayer); // 3 players — not 5 or 6
    const dealt = dealRoles(players, makeRng('s'));
    expect(dealt.every(p => p.role === undefined)).toBe(true);
  });

  it('preserves all other player fields', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    players[0].displayName = 'Alice';
    players[0].cash = [{ id: 'n1', value: 10000 }];
    const dealt = dealRoles(players, makeRng('s'));
    expect(dealt[0].displayName).toBe('Alice');
    expect(dealt[0].cash).toEqual([{ id: 'n1', value: 10000 }]);
  });
});

describe('findCop / isCop', () => {
  it('findCop returns the player with role=cop', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map(makePlayer);
    const dealt = dealRoles(players, makeRng('s'));
    const cop = findCop(dealt);
    expect(cop).toBeDefined();
    expect(cop?.role).toBe('cop');
  });

  it('findCop returns undefined when no cop assigned', () => {
    const players = ['a', 'b'].map(makePlayer);
    expect(findCop(players)).toBeUndefined();
  });

  it('isCop returns true only for role=cop', () => {
    const cop = { ...makePlayer('x'), role: 'cop' as const };
    const mafia = { ...makePlayer('y'), role: 'mafia' as const };
    expect(isCop(cop)).toBe(true);
    expect(isCop(mafia)).toBe(false);
    expect(isCop(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect pass**

```bash
npm test -- --run src/game/roles.test.ts
```

Expect all green (implementation already exists from Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/game/roles.test.ts
git commit -m "test(cop): roles dealing + helpers"
```

---

## Task 5: `setup.ts` — variants.cop wiring

**Files:**
- Modify: `src/game/setup.ts`
- Modify: `src/game/setup.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `src/game/setup.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { initGame } from './setup';
import type { Player } from './types';

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    displayName: `P${i}`,
    colorOrAvatar: '#000',
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive' as const,
    effects: [],
  }));
}

describe('initGame — cop variant', () => {
  it('deals roles when variants.cop is true at 5 players', () => {
    const g = initGame(makePlayers(5), 'seed-cop', 0, { superPowers: false, cop: true });
    const cops = g.players.filter(p => p.role === 'cop');
    const mafia = g.players.filter(p => p.role === 'mafia');
    expect(cops).toHaveLength(1);
    expect(mafia).toHaveLength(4);
    expect(g.variants.cop).toBe(true);
  });

  it('does not deal roles when variants.cop is false', () => {
    const g = initGame(makePlayers(5), 'seed-cop', 0, { superPowers: false, cop: false });
    expect(g.players.every(p => p.role === undefined)).toBe(true);
    expect(g.variants.cop).toBe(false);
  });

  it('initializes Game.cop when variants.cop is true', () => {
    const g = initGame(makePlayers(5), 'seed-cop', 0, { superPowers: false, cop: true });
    expect(g.cop).toEqual({ callsMade: 0 });
  });

  it('omits Game.cop when variants.cop is false', () => {
    const g = initGame(makePlayers(5), 'seed-cop', 0, { superPowers: false, cop: false });
    expect(g.cop).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- --run src/game/setup.test.ts
```

Expect failures: `cop` not on variants type, no role dealing, `g.cop` undefined.

- [ ] **Step 3: Update `setup.ts`**

Replace `src/game/setup.ts` with:

```ts
import type { Banknote, BulletCard, Game, GameVariants, Player, Round } from './types';
import { makeRng, shuffle } from './random';
import { dealPowers } from './powers';
import { dealRoles } from './roles';

export const STARTING_HAND: BulletCard[] = [
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

const DEFAULT_VARIANTS: GameVariants = { superPowers: false, cop: false };

export function initGame(
  players: Player[],
  seed: string,
  now: number,
  variants: GameVariants = DEFAULT_VARIANTS,
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
    shame: [],
    status: 'alive',
    effects: [],
  }));

  // Wave 1: cop and super-powers are mutually exclusive at the lobby
  // toggle, so we deal at most one of them. If both flags somehow
  // landed true, super-powers wins (it shipped first).
  let dealtPlayers = baseDealt;
  if (variants.superPowers) {
    dealtPlayers = dealPowers(baseDealt, rng);
  } else if (variants.cop) {
    dealtPlayers = dealRoles(baseDealt, rng);
  }

  const round: Round = {
    number: 1,
    phase: 'commit',
    phaseStartedAt: now,
    loot,
    commits: {},
    activations: {},
  };

  const game: Game = {
    phase: 'in_progress',
    players: dealtPlayers,
    round,
    bankDeck,
    discardedBullets: [],
    seed,
    variants,
  };

  if (variants.cop) {
    game.cop = { callsMade: 0 };
  }

  return game;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- --run src/game/setup.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/setup.ts src/game/setup.test.ts
git commit -m "feat(cop): setup deals roles + initializes Game.cop when variant on"
```

---

## Task 6: `transitions.ts` — telephone phase + skip rules

**Files:**
- Modify: `src/game/transitions.ts`
- Modify: `src/game/transitions.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/game/transitions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldRunTelephonePhase, telephoneHolderOrder } from './transitions';
import type { Game, RoundResolution } from './types';

function makeGameForTelephone(opts: {
  copVariant: boolean;
  roundNumber: number;
  standing: string[];
}): Game {
  const resolution: RoundResolution = {
    shots: [],
    ducks: [],
    standing: opts.standing,
    woundedThisRound: {},
    eliminated: [],
    awards: {},
    carryover: [],
    powerActivations: [],
  };
  return {
    phase: 'in_progress',
    players: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
      id, displayName: id, colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0, shame: [], status: 'alive', effects: [],
    })),
    round: {
      number: opts.roundNumber, phase: 'split', phaseStartedAt: 0,
      loot: [], commits: {}, activations: {}, resolution,
    },
    bankDeck: [], discardedBullets: [], seed: 's',
    variants: { superPowers: false, cop: opts.copVariant },
  };
}

describe('shouldRunTelephonePhase', () => {
  it('returns true when cop variant on, round ≤6, ≥1 split participant', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 3, standing: ['a', 'b'] });
    expect(shouldRunTelephonePhase(g)).toBe(true);
  });

  it('returns false when cop variant off', () => {
    const g = makeGameForTelephone({ copVariant: false, roundNumber: 3, standing: ['a', 'b'] });
    expect(shouldRunTelephonePhase(g)).toBe(false);
  });

  it('returns false in round 7', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 7, standing: ['a', 'b'] });
    expect(shouldRunTelephonePhase(g)).toBe(false);
  });

  it('returns false in round 8', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 8, standing: ['a', 'b'] });
    expect(shouldRunTelephonePhase(g)).toBe(false);
  });

  it('returns false when nobody participated in the split', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 2, standing: [] });
    expect(shouldRunTelephonePhase(g)).toBe(false);
  });
});

describe('telephoneHolderOrder', () => {
  it('returns split-participants in seat (player index) order', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 1, standing: ['c', 'a', 'e'] });
    // players are seated a,b,c,d,e (indices 0..4); standing = a,c,e in seat order
    expect(telephoneHolderOrder(g)).toEqual(['a', 'c', 'e']);
  });

  it('returns [] when nobody participated', () => {
    const g = makeGameForTelephone({ copVariant: true, roundNumber: 1, standing: [] });
    expect(telephoneHolderOrder(g)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- --run src/game/transitions.test.ts
```

Expect failures (helpers don't exist yet).

- [ ] **Step 3: Update `transitions.ts`**

Append to `src/game/transitions.ts`:

```ts
export function shouldRunTelephonePhase(game: Game): boolean {
  if (!game.variants.cop) return false;
  if (game.round.number > 6) return false;
  const standing = game.round.resolution?.standing ?? [];
  return standing.length > 0;
}

export function telephoneHolderOrder(game: Game): string[] {
  const standingSet = new Set(game.round.resolution?.standing ?? []);
  // Seat order = order of game.players. Among those, keep only standing.
  return game.players.filter(p => standingSet.has(p.id)).map(p => p.id);
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- --run src/game/transitions.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/transitions.ts src/game/transitions.test.ts
git commit -m "feat(cop): shouldRunTelephonePhase + telephoneHolderOrder"
```

---

## Task 7: Resolver — telephone outcome processing + shame tagging

**Files:**
- Modify: `src/game/resolver.ts`
- Modify: `src/game/resolver.test.ts`

The resolver gains a new entrypoint `applyTelephoneCall(game, used)` that finalises a telephone phase: updates `Game.cop.callsMade`, sets `reinforcementsRoundOnTheWay` on the 3rd call, and writes `Round.telephone`. Separately, the shame-marker write path that already exists in resolver (added in Task 2 with `{ flashing: false }`) gets wired to read game state — markers earned in round R after `reinforcementsRoundOnTheWay` get `flashing: true`.

- [ ] **Step 1: Add failing tests**

Append to `src/game/resolver.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyTelephoneCall } from './resolver';
import type { Game } from './types';

function baseCopGame(callsMade: 0 | 1 | 2 | 3, roundNumber: number, reinforcementsRoundOnTheWay?: number): Game {
  return {
    phase: 'in_progress',
    players: [],
    round: {
      number: roundNumber, phase: 'telephone', phaseStartedAt: 0,
      loot: [], commits: {}, activations: {},
      resolution: {
        shots: [], ducks: [], standing: ['a', 'b'],
        woundedThisRound: {}, eliminated: [], awards: {}, carryover: [],
        powerActivations: [],
      },
    },
    bankDeck: [], discardedBullets: [], seed: 's',
    variants: { superPowers: false, cop: true },
    cop: { callsMade, reinforcementsRoundOnTheWay },
  };
}

describe('applyTelephoneCall', () => {
  it('records the holder order and used=false when call did not land', () => {
    const g = baseCopGame(0, 1);
    const next = applyTelephoneCall(g, false, ['a', 'b']);
    expect(next.round.telephone).toEqual({ used: false, holderOrder: ['a', 'b'] });
    expect(next.cop?.callsMade).toBe(0);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBeUndefined();
  });

  it('increments callsMade and records holder order when used=true', () => {
    const g = baseCopGame(0, 1);
    const next = applyTelephoneCall(g, true, ['a', 'b']);
    expect(next.round.telephone).toEqual({ used: true, holderOrder: ['a', 'b'] });
    expect(next.cop?.callsMade).toBe(1);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBeUndefined();
  });

  it('sets reinforcementsRoundOnTheWay on the 3rd call', () => {
    const g = baseCopGame(2, 4);
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop?.callsMade).toBe(3);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBe(4);
  });

  it('does not change reinforcementsRoundOnTheWay if already set', () => {
    const g = baseCopGame(3, 5, 3);
    // Hypothetical no-op 4th call; should be inert.
    const next = applyTelephoneCall(g, false, ['a']);
    expect(next.cop?.callsMade).toBe(3);
    expect(next.cop?.reinforcementsRoundOnTheWay).toBe(3);
  });

  it('clamps callsMade at 3 if somehow called more', () => {
    const g = baseCopGame(3, 5, 3);
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop?.callsMade).toBe(3);
  });

  it('is a no-op when cop variant is off', () => {
    const g = baseCopGame(0, 1);
    g.variants.cop = false;
    g.cop = undefined;
    const next = applyTelephoneCall(g, true, ['a']);
    expect(next.cop).toBeUndefined();
    expect(next.round.telephone).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- --run src/game/resolver.test.ts
```

- [ ] **Step 3: Add `applyTelephoneCall` to `resolver.ts`**

Append to `src/game/resolver.ts`:

```ts
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
  return {
    ...game,
    round: {
      ...game.round,
      telephone: { used, holderOrder },
    },
    cop: {
      callsMade: nextCallsMade,
      reinforcementsRoundOnTheWay: newlyReinforced
        ? game.round.number
        : prev.reinforcementsRoundOnTheWay,
    },
  };
}
```

You may also need to add `import type { Game } from './types';` at the top if not already present.

- [ ] **Step 4: Add a failing test for flashing-light shame tagging**

Append to `src/game/resolver.test.ts`:

```ts
import { applyDuckShame } from './resolver';

describe('applyDuckShame', () => {
  it('tags new shame markers as non-flashing when no reinforcements yet', () => {
    const g = baseCopGame(0, 2);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'mafia',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });

  it('tags new shame as flashing when reinforcementsRoundOnTheWay is set and current round > that', () => {
    const g = baseCopGame(3, 5, 3);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: true }]);
  });

  it('tags new shame as non-flashing when current round equals reinforcement round', () => {
    // Paper rule: only new shame *after* the call counts. Markers earned
    // in the same round as the call do not flash.
    const g = baseCopGame(3, 4, 4);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });

  it('preserves existing shame markers unchanged', () => {
    const g = baseCopGame(3, 6, 3);
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [{ flashing: false }, { flashing: false }],
      status: 'alive', effects: [], role: 'cop',
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([
      { flashing: false },
      { flashing: false },
      { flashing: true },
    ]);
  });

  it('non-cop variant adds non-flashing markers regardless of round', () => {
    const g = baseCopGame(0, 5);
    g.variants.cop = false;
    g.cop = undefined;
    g.players = [{
      id: 'a', displayName: 'A', colorOrAvatar: '#000',
      bullets: [], cash: [], wounds: 0,
      shame: [], status: 'alive', effects: [],
    }];
    const next = applyDuckShame(g, 'a');
    expect(next.players[0].shame).toEqual([{ flashing: false }]);
  });
});
```

- [ ] **Step 5: Add `applyDuckShame` to `resolver.ts`**

```ts
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
```

- [ ] **Step 6: Rewire the existing shame-write in `resolver.ts`** to use `applyDuckShame`

Find the existing place in `resolver.ts` that pushes a shame marker on withdraw (added in Task 2 step 3). Refactor it to use `applyDuckShame` so the flashing flag is computed correctly. Look for the pattern:

```ts
{ ...p, shame: [...p.shame, { flashing: false }], ... }
```

and replace it with a call to `applyDuckShame` over the resolved game value at the point where ducks are tallied. If the surrounding code maps over players, you may instead inline the same logic:

```ts
const reinforced =
  game.variants.cop &&
  game.cop?.reinforcementsRoundOnTheWay !== undefined &&
  game.round.number > game.cop.reinforcementsRoundOnTheWay;
// ... when pushing shame:
shame: [...p.shame, { flashing: reinforced }],
```

Either form is fine — pick whichever matches the surrounding code's idiom. The unit tests in step 4 cover the helper directly; the existing resolver tests cover the integrated path.

- [ ] **Step 7: Run all unit tests — expect green**

```bash
npm test -- --run
```

- [ ] **Step 8: Commit**

```bash
git add src/game/resolver.ts src/game/resolver.test.ts
git commit -m "feat(cop): applyTelephoneCall + flashing-light shame tagging"
```

---

## Task 8: `scoring.ts` — cop win predicate

**Files:**
- Modify: `src/game/scoring.ts`
- Modify: `src/game/scoring.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `src/game/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { copWins, gameOutcome } from './scoring';
import type { Game, Player } from './types';

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id, displayName: id, colorOrAvatar: '#000',
    bullets: [], cash: [], wounds: 0, shame: [],
    status: 'alive', effects: [],
    ...overrides,
  };
}

function copGame(overrides: {
  players: Player[];
  callsMade?: 0 | 1 | 2 | 3;
  reinforcementsRoundOnTheWay?: number;
}): Game {
  return {
    phase: 'ended',
    players: overrides.players,
    round: {
      number: 8, phase: 'split', phaseStartedAt: 0,
      loot: [], commits: {}, activations: {},
    },
    bankDeck: [], discardedBullets: [], seed: 's',
    variants: { superPowers: false, cop: true },
    cop: {
      callsMade: overrides.callsMade ?? 0,
      reinforcementsRoundOnTheWay: overrides.reinforcementsRoundOnTheWay,
    },
  };
}

describe('copWins', () => {
  it('true when all three predicates hold (reinforcements + alive + ≤1 flashing)', () => {
    const cop = makePlayer('cop', { role: 'cop', shame: [{ flashing: false }, { flashing: true }] });
    const m1 = makePlayer('m1', { role: 'mafia' });
    const g = copGame({ players: [cop, m1], callsMade: 3, reinforcementsRoundOnTheWay: 5 });
    expect(copWins(g)).toBe(true);
  });

  it('true with 0 flashing shame markers', () => {
    const cop = makePlayer('cop', { role: 'cop', shame: [{ flashing: false }] });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(true);
  });

  it('false when reinforcements never arrived', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 2 });
    expect(copWins(g)).toBe(false);
  });

  it('false when cop is dead', () => {
    const cop = makePlayer('cop', { role: 'cop', status: 'dead', wounds: 3 });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });

  it('false when cop took 2 flashing-light shame markers', () => {
    const cop = makePlayer('cop', {
      role: 'cop',
      shame: [{ flashing: true }, { flashing: true }],
    });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });

  it('sole-survivor clause: cop wins as the only player alive even without reinforcements', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const m1 = makePlayer('m1', { role: 'mafia', status: 'dead', wounds: 3 });
    const m2 = makePlayer('m2', { role: 'mafia', status: 'dead', wounds: 3 });
    const g = copGame({ players: [cop, m1, m2], callsMade: 0 });
    expect(copWins(g)).toBe(true);
  });

  it('false when variant is off', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    g.variants.cop = false;
    expect(copWins(g)).toBe(false);
  });

  it('false when no cop in player list', () => {
    const m1 = makePlayer('m1', { role: 'mafia' });
    const g = copGame({ players: [m1], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(copWins(g)).toBe(false);
  });
});

describe('gameOutcome', () => {
  it('returns cop-win when copWins is true', () => {
    const cop = makePlayer('cop', { role: 'cop' });
    const g = copGame({ players: [cop], callsMade: 3, reinforcementsRoundOnTheWay: 4 });
    expect(gameOutcome(g, 0)).toEqual({ kind: 'cop_wins', winnerId: 'cop' });
  });

  it('returns mafia-rich when copWins is false (cop variant on)', () => {
    const cop = makePlayer('cop', { role: 'cop', cash: [{ id: 'n', value: 5000 }] });
    const m1 = makePlayer('m1', { role: 'mafia', cash: [{ id: 'n2', value: 30000 }] });
    const g = copGame({ players: [cop, m1], callsMade: 1 });
    expect(gameOutcome(g, 0)).toEqual({ kind: 'mafia_wins', winnerId: 'm1' });
  });

  it('returns base ranking when cop variant off', () => {
    const a = makePlayer('a', { cash: [{ id: 'n', value: 30000 }] });
    const b = makePlayer('b', { cash: [{ id: 'n2', value: 10000 }] });
    const g = copGame({ players: [a, b], callsMade: 0 });
    g.variants.cop = false;
    g.cop = undefined;
    expect(gameOutcome(g, 0)).toEqual({ kind: 'base', winnerId: 'a' });
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test -- --run src/game/scoring.test.ts
```

- [ ] **Step 3: Update `scoring.ts`**

Add to `src/game/scoring.ts`:

```ts
import type { Game } from './types';

export function copWins(game: Game): boolean {
  if (!game.variants.cop) return false;
  const cop = game.players.find(p => p.role === 'cop');
  if (!cop) return false;
  // Sole-survivor clause: if the cop is the only player alive, they win
  // regardless of the call mission.
  const alive = game.players.filter(p => p.status === 'alive');
  if (alive.length === 1 && alive[0].id === cop.id) return true;
  // Primary win: reinforcements landed + cop alive + ≤1 flashing shame.
  if (cop.status !== 'alive') return false;
  if (game.cop?.reinforcementsRoundOnTheWay === undefined) return false;
  const flashingShame = cop.shame.filter(s => s.flashing).length;
  if (flashingShame > 1) return false;
  return true;
}

export type GameOutcome =
  | { kind: 'cop_wins'; winnerId: string }
  | { kind: 'mafia_wins'; winnerId: string }
  | { kind: 'base'; winnerId: string };

export function gameOutcome(game: Game, totalKills: number): GameOutcome {
  if (game.variants.cop) {
    if (copWins(game)) {
      const cop = game.players.find(p => p.role === 'cop')!;
      return { kind: 'cop_wins', winnerId: cop.id };
    }
    // Cop variant on but cop didn't win → richest *alive* mafia wins by
    // base scoring rules over the alive mafia subset.
    const aliveMafia = game.players.filter(p => p.role === 'mafia' && p.status === 'alive');
    const winner = rankPlayers(aliveMafia, totalKills)[0];
    return { kind: 'mafia_wins', winnerId: winner?.id ?? '' };
  }
  // Variant off → base ranking over all alive players.
  const aliveAll = game.players.filter(p => p.status === 'alive');
  const winner = rankPlayers(aliveAll, totalKills)[0];
  return { kind: 'base', winnerId: winner?.id ?? '' };
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- --run src/game/scoring.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/scoring.ts src/game/scoring.test.ts
git commit -m "feat(cop): copWins predicate + gameOutcome (cop vs mafia vs base)"
```

---

## Task 9: `deserialize.ts` — round-trip new fields

**Files:**
- Modify: `src/game/deserialize.ts`
- Modify: `src/game/deserialize.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `src/game/deserialize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeGame } from './deserialize';

describe('normalizeGame — cop variant fields', () => {
  it('round-trips Player.role', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', role: 'cop' }, { id: 'p2', role: 'mafia' }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].role).toBe('cop');
    expect(g.players[1].role).toBe('mafia');
  });

  it('drops invalid role values', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', role: 'cheese' }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].role).toBeUndefined();
  });

  it('round-trips Round.telephone', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: {
        number: 2, phase: 'telephone', loot: [], commits: {}, activations: {},
        telephone: { used: true, holderOrder: ['a', 'b'] },
      },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.round.telephone).toEqual({ used: true, holderOrder: ['a', 'b'] });
  });

  it('round-trips Game.cop', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 5, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
      cop: { callsMade: 2, reinforcementsRoundOnTheWay: 4 },
    };
    const g = normalizeGame(raw)!;
    expect(g.cop).toEqual({ callsMade: 2, reinforcementsRoundOnTheWay: 4 });
  });

  it('round-trips GameVariants.cop default false when missing', () => {
    const raw = {
      phase: 'in_progress',
      players: [],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.variants).toEqual({ superPowers: true, cop: false });
  });

  it('round-trips ShameMarker[]', () => {
    const raw = {
      phase: 'in_progress',
      players: [{
        id: 'p1',
        shame: [{ flashing: true }, { flashing: false }],
      }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: true },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].shame).toEqual([{ flashing: true }, { flashing: false }]);
  });

  it('migrates legacy numeric shame to non-flashing markers', () => {
    const raw = {
      phase: 'in_progress',
      players: [{ id: 'p1', shame: 3 }],
      round: { number: 1, phase: 'commit', loot: [], commits: {}, activations: {} },
      bankDeck: [], discardedBullets: [], seed: 's',
      variants: { superPowers: false, cop: false },
    };
    const g = normalizeGame(raw)!;
    expect(g.players[0].shame).toEqual([
      { flashing: false },
      { flashing: false },
      { flashing: false },
    ]);
  });
});
```

- [ ] **Step 2: Run tests — expect failure (role/telephone/cop fields not normalized)**

```bash
npm test -- --run src/game/deserialize.test.ts
```

- [ ] **Step 3: Update `deserialize.ts`**

Add role/telephone/cop normalization. Edits to `src/game/deserialize.ts`:

a) Import `Role` at the top:

```ts
import type {
  // ... existing imports
  Role,
  ShameMarker,
} from './types';
```

b) Add a role normalizer above `normalizePlayer`:

```ts
function normalizeRole(raw: unknown): Role | undefined {
  if (raw === 'cop' || raw === 'mafia') return raw;
  return undefined;
}
```

c) Update `normalizePlayer` to read `role`:

```ts
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
```

d) Update `normalizeRound` to read `telephone`:

```ts
function normalizeRound(raw: Raw): Round {
  const r = (raw ?? {}) as Record<string, unknown>;
  const round: Round = {
    number: Number(r.number ?? 1),
    phase: (r.phase ?? 'commit') as Round['phase'],
    phaseStartedAt: Number(r.phaseStartedAt ?? 0),
    loot: asArray<Banknote>(r.loot),
    commits: asRecord<Commit>(r.commits),
    activations: normalizeActivations(r.activations as Raw),
    resolution: r.resolution ? normalizeResolution(r.resolution as Raw) : undefined,
  };
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
```

e) Update `normalizeVariants` to include `cop`:

```ts
function normalizeVariants(raw: Raw): GameVariants {
  const r = (raw ?? {}) as Record<string, unknown>;
  return { superPowers: !!r.superPowers, cop: !!r.cop };
}
```

f) Update `normalizeGame` to read `cop`:

```ts
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
    game.cop = {
      callsMade,
      reinforcementsRoundOnTheWay: typeof reinf === 'number' ? reinf : undefined,
    };
  }
  return game;
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- --run src/game/deserialize.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/deserialize.ts src/game/deserialize.test.ts
git commit -m "feat(cop): deserialize role, telephone, cop, variants.cop, ShameMarker[]"
```

---

## Task 10: Regression — base game stays bit-identical with both variants off

**Files:**
- Modify: `src/game/regression.test.ts`

- [ ] **Step 1: Open `src/game/regression.test.ts`** and confirm there is an end-to-end test that plays a deterministic seeded game with default variants.

- [ ] **Step 2: Run the full test suite**

```bash
npm test -- --run
```

Expect **zero failures**. If any regression test fails, the cop/shame refactors leaked behaviour. Triage: the most likely culprit is a missed `shame.length` vs `shame` numeric swap. Grep for any remaining `\.shame\s*[><=!]` or `\.shame\s*\+` patterns:

```bash
rg "\.shame[\s><=!+]" src/ --type ts --type tsx
```

Fix any remaining sites, re-run, repeat.

- [ ] **Step 3: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(shame): clean up remaining numeric-shame call sites surfaced by regression"
```

---

## Task 11: `useGameState` — telephone phase timing + role reveal orchestration

**Files:**
- Modify: `src/hooks/useGameState.ts`

The state machine needs two additions:
1. After `split`, route to `telephone` (when `shouldRunTelephonePhase` returns true) or directly to next round's `commit`.
2. At round 1's `commit` entry, surface a synthetic "roles dealt" overlay activation so the big screen can play the role-reveal beat (analogous to the public-power reveal beat for Kid/Cunning).

The telephone phase is untimed — like commit, it blocks until input lands. There is no per-holder hold timer. The phase advances when the engine receives a per-round `Round.telephone` finalisation written by a holder action (the cop's CALL or the last holder's PASS).

- [ ] **Step 1: Read the current `useGameState.ts`** to locate the phase transition logic for `split → next round`. Look for where `startNextRound` is called.

```bash
rg "startNextRound|round\.phase === 'split'" src/hooks/useGameState.ts
```

- [ ] **Step 2: Insert telephone routing**

In the `split → ?` transition path (wherever the existing code decides to call `startNextRound`), insert a check:

```ts
import { shouldRunTelephonePhase } from '../game/transitions';

// ... inside the effect that handles split-phase completion:
if (shouldRunTelephonePhase(game)) {
  // Move to telephone phase. The phase is untimed; it advances when a
  // holder action writes Round.telephone.
  store.update(g => ({
    ...g,
    round: { ...g.round, phase: 'telephone', phaseStartedAt: now() },
  }));
  return;
}
// Otherwise fall through to the existing startNextRound call.
```

- [ ] **Step 3: Handle the telephone → next round transition**

When `Round.telephone` is set on the current round (i.e. the holder action has finalised it), advance:

```ts
// In the effect that watches game.round.phase / game.round.telephone:
useEffect(() => {
  if (!game) return;
  if (game.round.phase !== 'telephone') return;
  if (!game.round.telephone) return; // Awaiting holder finalisation.
  // Linger briefly for the on-screen card flip animation, then advance.
  const lingerMs = game.round.telephone.used ? 3500 : 1200;
  // The 3500 ms covers switchboard flip; the 3rd-flip reinforcements
  // overlay extends that further via its own timer (see Task 15).
  const id = window.setTimeout(() => {
    store.update(g => {
      const ended = endGameStatus(g);
      if (ended.ended) {
        return { ...g, phase: 'ended' };
      }
      return startNextRound(g, now());
    });
  }, lingerMs);
  return () => clearTimeout(id);
}, [game?.round.phase, game?.round.telephone, store]);
```

- [ ] **Step 4: Add the holder-action writer**

Add a method on the store/hook that holders invoke from their phone UI:

```ts
export function writeTelephoneAction(
  store: GameStore,
  used: boolean,
  holderOrder: string[],
): void {
  store.update(g => applyTelephoneCall(g, used, holderOrder));
}
```

The phone UI (Task 18) will call this with `used = true` (cop's CALL) or `used = false` (last holder's PASS without a prior call).

- [ ] **Step 5: Synthetic "roles dealt" overlay activation**

In the same place where the wave-1 plan added the public-power-reveal capture (search for `PUBLIC_POWER_KINDS` or `initialReveals` in `useGameState.ts` and `MockBigScreen.tsx` / `RoomPage.tsx`), add a parallel state for one-time roles-dealt reveal:

```ts
const [rolesDealtShown, setRolesDealtShown] = useState(false);
useEffect(() => {
  if (!game) {
    setRolesDealtShown(false);
    return;
  }
  if (rolesDealtShown) return;
  if (!game.variants.cop) return;
  if (game.round.number !== 1 || game.round.phase !== 'commit') return;
  setRolesDealtShown(true);
}, [game, rolesDealtShown]);
```

This `rolesDealtShown` flag will gate the `RolesDealtOverlay` mount in `RoomPage` / `MockBigScreen` (Task 17).

- [ ] **Step 6: Typecheck + run tests**

```bash
npx tsc -b --noEmit && npm test -- --run
```

Both should be clean. The state machine has no unit tests covering this path yet; manual smoke-test will follow via the mock scenarios in Task 25.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat(cop): useGameState telephone routing + roles-dealt one-shot"
```

---

## Task 12: Switchboard widget (big screen)

**Files:**
- Create: `src/components/screens/Switchboard.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/screens/Switchboard.tsx`:

```tsx
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  callsMade: 0 | 1 | 2 | 3;
}

// Persistent big-screen widget — 3 card slots, ambient on every round
// the cop variant is active. Empty slots show silhouettes; filled
// slots show the revealed switchboard card art. The 3rd slot is the
// "Reinforcements Sent" reveal (animated reveal handled by the
// ReinforcementsOverlay; this widget just stays flipped face-up).
export function Switchboard({ callsMade }: Props) {
  const { t } = useTranslation();
  const slots: ('empty' | 'busy' | 'sent')[] = [
    callsMade >= 1 ? 'busy' : 'empty',
    callsMade >= 2 ? 'busy' : 'empty',
    callsMade >= 3 ? 'sent' : 'empty',
  ];
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '0.6rem',
        padding: '0.6rem 0.9rem',
        background: palette.inkUp,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
      }}
    >
      {slots.map((state, i) => (
        <Box
          key={i}
          sx={{
            width: 56,
            height: 80,
            background: state === 'empty' ? 'transparent' : palette.paper,
            border: `1.5px ${state === 'empty' ? 'dashed' : 'solid'} ${
              state === 'empty' ? palette.paperFaint : palette.paper
            }`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: state === 'empty' ? palette.paperFaint : palette.ink,
            fontFamily: fonts.displayCaps,
            fontSize: '0.7rem',
            letterSpacing: '0.16em',
            textAlign: 'center',
            padding: '0.3rem',
            transition: 'background 240ms ease, border-color 240ms ease, color 240ms ease',
          }}
        >
          {state === 'busy' && t('cop.switchboard.busy')}
          {state === 'sent' && t('cop.switchboard.reinforcementsSent')}
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/Switchboard.tsx
git commit -m "feat(cop): Switchboard widget — 3-slot persistent big-screen counter"
```

---

## Task 13: TelephonePassOverlay (phone token traveling)

**Files:**
- Create: `src/components/screens/TelephonePassOverlay.tsx`

This overlay watches the round's telephone phase and animates the phone token traveling between split-participants' character cards. It needs the seat geometry; reuse the same anchor utility the existing TargetingMap uses (look at `src/components/standoff/TargetingMap.tsx` for the seat-anchor pattern).

- [ ] **Step 1: Implement the component**

Create `src/components/screens/TelephonePassOverlay.tsx`. The component:
- Reads `holderOrder` from `Round.telephone?.holderOrder` if set; otherwise computes it via `telephoneHolderOrder(game)`.
- Tracks an internal `activeHolderIndex` that advances when each holder's phone signals done (via an out-of-band callback or by watching changes to the round.telephone field).
- For the in-progress case (no `Round.telephone` finalised yet) the active holder needs to be communicated. The simplest path: surface an additional sub-state on `Round.telephone` for the active holder during the pass. Defer that complexity here — for now the overlay only renders the static "phone is at center" → "phone returned face-up" two-state animation, gated on `Round.telephone`:
  - When `Round.telephone === undefined` and `phase === 'telephone'`: phone token at table center with a soft pulse + "PHONE IS WITH [holder]" subtitle, where the holder is computed from a "currentHolderId" stored on the round (added in step 2).
  - When `Round.telephone` is set: token settles face-up on its used/not-used face for the linger.

The moving animation reads `currentHolderId` from `Round.telephone` — this field was already added to `types.ts` in Task 1 and is normalized in `deserialize.ts` in Task 9. No type changes needed in this task.

- [ ] **Step 2: Implementation**

```tsx
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Game } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  game: Game;
  // Optional: anchor utility from TargetingMap to position the token
  // next to a specific player's character card. If not supplied, falls
  // back to centered.
  anchorFor?: (playerId: string) => { x: number; y: number } | null;
}

export function TelephonePassOverlay({ game, anchorFor }: Props) {
  const { t } = useTranslation();
  if (game.round.phase !== 'telephone') return null;
  const tel = game.round.telephone;
  const currentHolderId = tel?.currentHolderId;
  const finalUsed = tel && !tel.currentHolderId ? tel.used : undefined;
  const anchor = currentHolderId && anchorFor ? anchorFor(currentHolderId) : null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: anchor ? `${anchor.x}px` : '50%',
          top: anchor ? `${anchor.y}px` : '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'left 360ms ease, top 360ms ease',
          width: 96,
          height: 140,
          background: finalUsed ? palette.paper : palette.inkUp,
          border: `3px solid ${palette.paper}`,
          boxShadow: `4px 4px 0 ${palette.inkDeep}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.displayCaps,
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          color: finalUsed ? palette.ink : palette.paper,
          textAlign: 'center',
          padding: '0.5rem',
        }}
      >
        {finalUsed === true && t('cop.telephone.used')}
        {finalUsed === false && t('cop.telephone.notUsed')}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/screens/TelephonePassOverlay.tsx
git commit -m "feat(cop): TelephonePassOverlay — phone token traveling between holders"
```

---

## Task 14: ReinforcementsOverlay (3rd-flip dramatic moment)

**Files:**
- Create: `src/components/screens/ReinforcementsOverlay.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/screens/ReinforcementsOverlay.tsx`:

```tsx
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  game: Game;
}

// Plays a one-shot full-screen overlay the first time
// Game.cop.reinforcementsRoundOnTheWay transitions from undefined to a
// number. ~3s linger; unmounts to null afterward.
export function ReinforcementsOverlay({ game }: Props) {
  const { t } = useTranslation();
  const round = game.cop?.reinforcementsRoundOnTheWay;
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (round === undefined) return;
    if (shown) return;
    setShown(true);
    setActive(true);
    const id = window.setTimeout(() => setActive(false), 3000);
    return () => clearTimeout(id);
  }, [round, shown]);

  if (!active) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle, ${palette.blood} 0%, ${palette.ink} 80%)`,
        animation: 'siren-wash 800ms ease-in-out infinite alternate',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: palette.paper,
        zIndex: 50,
        '@keyframes siren-wash': {
          from: { filter: 'hue-rotate(0deg)' },
          to: { filter: 'hue-rotate(20deg)' },
        },
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '5rem',
          lineHeight: 1,
          textShadow: `4px 4px 0 ${palette.inkDeep}`,
        }}
      >
        {t('cop.reinforcements.overlayTitle')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: 'italic',
          fontSize: '1.6rem',
          marginTop: '1.2rem',
          color: palette.paperDim,
        }}
      >
        {t('cop.reinforcements.overlaySub')}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/ReinforcementsOverlay.tsx
git commit -m "feat(cop): ReinforcementsOverlay — 3rd-call dramatic full-screen moment"
```

---

## Task 15: RolesDealtOverlay (start-of-game beat)

**Files:**
- Create: `src/components/screens/RolesDealtOverlay.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/screens/RolesDealtOverlay.tsx`:

```tsx
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  visible: boolean;
  onDone: () => void;
  acknowledgedCount: number;
  totalCount: number;
}

const HOLD_MS = 2400;

export function RolesDealtOverlay({ visible, onDone, acknowledgedCount, totalCount }: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!visible) {
      setActive(false);
      return;
    }
    setActive(true);
    // Auto-dismiss once all phones have acknowledged OR after a max hold.
    if (acknowledgedCount >= totalCount && totalCount > 0) {
      const id = window.setTimeout(() => {
        setActive(false);
        onDone();
      }, 600);
      return () => clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setActive(false);
      onDone();
    }, HOLD_MS * 2);
    return () => clearTimeout(id);
  }, [visible, acknowledgedCount, totalCount, onDone]);

  if (!active) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: palette.ink,
        opacity: 0.94,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        zIndex: 40,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '4rem',
          color: palette.paper,
        }}
      >
        {t('cop.reveal.allDealt')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '1rem',
          letterSpacing: '0.3em',
          color: palette.paperDim,
          marginTop: '1.6rem',
        }}
      >
        {acknowledgedCount} / {totalCount}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/screens/RolesDealtOverlay.tsx
git commit -m "feat(cop): RolesDealtOverlay — start-of-game roles reveal beat"
```

---

## Task 16: GameBoard integration

**Files:**
- Modify: `src/components/GameBoard.tsx`

The board needs:
- Switchboard widget mounted top-right when `variants.cop` is on.
- TelephonePassOverlay mounted when the phase is `telephone`.
- ReinforcementsOverlay always mounted when `variants.cop` (it self-gates on the cop state).
- RolesDealtOverlay mounted on round 1 commit when `variants.cop` (driven by the parent — RoomPage / MockBigScreen — passing visibility + ack count via props or a context).

- [ ] **Step 1: Add the imports + wire up**

In `src/components/GameBoard.tsx`, near the existing JSX where overlays are mounted (search for `PowerRevealOverlay` to find the right scope):

```tsx
import { Switchboard } from './screens/Switchboard';
import { TelephonePassOverlay } from './screens/TelephonePassOverlay';
import { ReinforcementsOverlay } from './screens/ReinforcementsOverlay';
```

Add inside the board JSX, alongside the existing overlays:

```tsx
{game.variants.cop && (
  <>
    <Box sx={{ position: 'absolute', top: '0.8rem', right: '0.8rem', zIndex: 20 }}>
      <Switchboard callsMade={game.cop?.callsMade ?? 0} />
    </Box>
    <TelephonePassOverlay game={game} />
    <ReinforcementsOverlay game={game} />
  </>
)}
```

(RolesDealtOverlay is mounted at the parent level — see Task 22.)

- [ ] **Step 2: Run dev smoke check**

```bash
npm run dev
```

Visit `/mock/big-screen/1` (the mock scenarios for the cop variant don't exist yet — Task 25 — but the board should at least render without runtime errors). Visually check: nothing visible while variants.cop = false; once cop scenarios are added, the switchboard renders in the corner.

- [ ] **Step 3: Commit**

```bash
git add src/components/GameBoard.tsx
git commit -m "feat(cop): mount Switchboard + TelephonePass + Reinforcements overlays on GameBoard"
```

---

## Task 17: Phone — RoleRevealScreen + RoleWidget

**Files:**
- Create: `src/components/phone/RoleRevealScreen.tsx`
- Create: `src/components/phone/RoleWidget.tsx`

- [ ] **Step 1: Implement `RoleRevealScreen`**

```tsx
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Role } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../shell/Button';

interface Props {
  role: Role;
  onAcknowledge: () => void;
}

export function RoleRevealScreen({ role, onAcknowledge }: Props) {
  const { t } = useTranslation();
  const isCop = role === 'cop';
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.4rem',
        padding: '1.6rem',
        background: isCop ? palette.ink : palette.bloodDeep ?? palette.blood,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '0.9rem',
          letterSpacing: '0.4em',
          color: palette.paperDim,
        }}
      >
        {t('cop.reveal.title')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '2.6rem',
          lineHeight: 1.05,
          textAlign: 'center',
          color: palette.paper,
        }}
      >
        {isCop ? t('cop.reveal.cop') : t('cop.reveal.mafia')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: 'italic',
          fontSize: '1.05rem',
          textAlign: 'center',
          color: palette.paperDim,
          maxWidth: '24rem',
        }}
      >
        {isCop ? t('cop.reveal.copBody') : t('cop.reveal.mafiaBody')}
      </Box>
      <Button variant="primary" emphasis onClick={onAcknowledge}>
        {t('cop.reveal.ack').toUpperCase()}
      </Button>
    </Box>
  );
}
```

(If `palette.bloodDeep` doesn't exist, substitute `palette.blood` or another existing dark-red shade.)

- [ ] **Step 2: Implement `RoleWidget`** — the persistent corner widget

```tsx
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Role } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  role: Role;
  // Cop-only. Shows current 0/3 → 3/3 ✓ count.
  callsMade?: 0 | 1 | 2 | 3;
  // Cop-only. Free-form hint string (e.g. "One more duck and you're cooked").
  hint?: string;
  // When pressed, expand into a read-only modal/sheet.
  onTap?: () => void;
}

export function RoleWidget({ role, callsMade, hint, onTap }: Props) {
  const { t } = useTranslation();
  const isCop = role === 'cop';
  return (
    <Box
      onClick={onTap}
      sx={{
        background: isCop ? palette.ink : (palette.bloodDeep ?? palette.blood),
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        padding: '0.5rem 0.8rem',
        cursor: onTap ? 'pointer' : 'default',
        color: palette.paper,
        minWidth: '6rem',
      }}
    >
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
        {isCop ? t('cop.widget.cop') : t('cop.widget.mafia')}
      </Box>
      {isCop && callsMade !== undefined && (
        <Box sx={{ fontFamily: fonts.body, fontSize: '0.85rem', marginTop: '0.2rem' }}>
          {callsMade === 3 ? t('cop.widget.callsDone') : t('cop.widget.calls', { n: callsMade })}
        </Box>
      )}
      {isCop && hint && (
        <Box
          sx={{
            fontFamily: fonts.body,
            fontStyle: 'italic',
            fontSize: '0.75rem',
            marginTop: '0.2rem',
            color: palette.paperDim,
          }}
        >
          {hint}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/phone/RoleRevealScreen.tsx src/components/phone/RoleWidget.tsx
git commit -m "feat(cop): phone — RoleRevealScreen + persistent RoleWidget"
```

---

## Task 18: Phone — TelephoneHolderScreen

**Files:**
- Create: `src/components/phone/TelephoneHolderScreen.tsx`

- [ ] **Step 1: Implement the component**

```tsx
import { Box } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../shell/Button';

interface Props {
  isCop: boolean;
  isLastHolder: boolean;
  onPass: () => void;
  // Only fires when isCop is true. For mafia, tapping the visible CALL
  // button does nothing (decoy social bluff prop).
  onCall: () => void;
}

export function TelephoneHolderScreen({ isCop, isLastHolder, onPass, onCall }: Props) {
  const { t } = useTranslation();
  const [callPlaced, setCallPlaced] = useState(false);

  const handleCallTap = () => {
    if (!isCop) {
      // Mafia decoy — no engine effect. We may flash a faint button press
      // (button component handles its own press visual); nothing else.
      return;
    }
    if (callPlaced) return;
    setCallPlaced(true);
    onCall();
    // Brief private confirmation; auto-pass after ~1.2s.
    window.setTimeout(() => {
      onPass();
    }, 1200);
  };

  if (callPlaced) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: palette.ink,
          color: palette.paper,
          textAlign: 'center',
          fontFamily: fonts.blackletter,
          fontSize: '2rem',
          animation: 'callPlaced 1200ms ease-out',
          '@keyframes callPlaced': {
            from: { opacity: 0, transform: 'scale(0.96)' },
            to: { opacity: 1, transform: 'scale(1)' },
          },
        }}
      >
        {t('cop.telephone.callPlaced')}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.4rem',
        padding: '1.6rem',
        background: palette.ink,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '1.1rem',
          letterSpacing: '0.3em',
          color: palette.paper,
        }}
      >
        {t('cop.telephone.heading')}
      </Box>
      <Button variant="primary" emphasis onClick={onPass}>
        {t('cop.telephone.pass').toUpperCase()}
      </Button>
      <Button variant="secondary" onClick={handleCallTap}>
        {t('cop.telephone.call').toUpperCase()}
      </Button>
    </Box>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/phone/TelephoneHolderScreen.tsx
git commit -m "feat(cop): phone — TelephoneHolderScreen with decoy CALL for mafia"
```

---

## Task 19: PhaseView integration — wire up the phone surfaces

**Files:**
- Modify: `src/components/phone/PhaseView.tsx`

`PhaseView` is the phone's phase-keyed router. It needs:
- A pre-game role reveal beat (gated on `variants.cop` + `Player.role` + a local "acknowledged" flag).
- The persistent RoleWidget in a corner slot (when variants.cop is on, replacing/sharing the super-powers widget slot).
- The TelephoneHolderScreen when `round.phase === 'telephone'` AND the local player is the current holder.

- [ ] **Step 1: Read the current `PhaseView.tsx`** to understand where to insert.

```bash
rg "switch.*phase|case 'commit'" src/components/phone/PhaseView.tsx
```

Find the existing widget-slot pattern (search for the super-powers card widget) — mirror it.

- [ ] **Step 2: Add role-reveal gating**

Near the top of the component, add local state and an early-return:

```tsx
import { RoleRevealScreen } from './RoleRevealScreen';
import { RoleWidget } from './RoleWidget';
import { TelephoneHolderScreen } from './TelephoneHolderScreen';

// ... inside the component
const [roleAcknowledged, setRoleAcknowledged] = useState(false);

// Role reveal: one-time, before any phase view, only if variant on and
// this player has a role.
if (
  game.variants.cop &&
  me.role &&
  !roleAcknowledged &&
  game.round.number === 1 &&
  game.round.phase === 'commit'
) {
  return <RoleRevealScreen role={me.role} onAcknowledge={() => setRoleAcknowledged(true)} />;
}
```

(`me` is presumed to be the current player object — match the existing local-player binding in PhaseView.)

- [ ] **Step 3: Add telephone-holder gating**

After the role-reveal early return, but before the normal phase switch:

```tsx
if (
  game.variants.cop &&
  game.round.phase === 'telephone' &&
  game.round.telephone?.currentHolderId === me.id
) {
  const order = game.round.telephone?.holderOrder ?? [];
  const isLast = order[order.length - 1] === me.id;
  return (
    <TelephoneHolderScreen
      isCop={me.role === 'cop'}
      isLastHolder={isLast}
      onCall={() => writeTelephoneAction(store, true, order)}
      onPass={() => advanceTelephoneHolder(store, me.id, order)}
    />
  );
}
```

You'll need two store helpers — `writeTelephoneAction` (already added in Task 11) and a new `advanceTelephoneHolder`:

```ts
// In src/hooks/useGameState.ts:
export function advanceTelephoneHolder(
  store: GameStore,
  currentHolderId: string,
  order: string[],
): void {
  const idx = order.indexOf(currentHolderId);
  const nextHolderId = order[idx + 1];
  store.update(g => {
    if (nextHolderId) {
      return {
        ...g,
        round: {
          ...g.round,
          telephone: {
            ...(g.round.telephone ?? { used: false, holderOrder: order }),
            currentHolderId: nextHolderId,
          },
        },
      };
    }
    // No next holder → finalise the pass with the current used value
    // (false if cop never called; if cop tapped CALL, applyTelephoneCall
    // already wrote used=true earlier).
    const used = g.round.telephone?.used ?? false;
    return applyTelephoneCall(g, used, order);
  });
}
```

The pass beat actually starts before any holder action — `useGameState` needs an effect that, on entering `telephone` phase, sets `Round.telephone = { used: false, holderOrder, currentHolderId: order[0] }`. Add that effect:

```ts
useEffect(() => {
  if (!game) return;
  if (game.round.phase !== 'telephone') return;
  if (game.round.telephone) return; // Already initialised.
  const order = telephoneHolderOrder(game);
  if (order.length === 0) return; // shouldRunTelephonePhase already gated this.
  store.update(g => ({
    ...g,
    round: {
      ...g.round,
      telephone: { used: false, holderOrder: order, currentHolderId: order[0] },
    },
  }));
}, [game?.round.phase, game?.round.telephone, store]);
```

- [ ] **Step 4: Mount the RoleWidget**

In PhaseView's existing widget-slot region (where the super-powers card widget is rendered), add:

```tsx
{game.variants.cop && me.role && (
  <RoleWidget
    role={me.role}
    callsMade={game.cop?.callsMade}
    hint={copHint(game, me)}
  />
)}
```

Define `copHint` near the top of the file:

```ts
import type { Game, Player } from '../../game/types';

function copHint(game: Game, me: Player): string | undefined {
  if (me.role !== 'cop') return undefined;
  const round = game.round.number;
  const reinforced = game.cop?.reinforcementsRoundOnTheWay;
  if (reinforced !== undefined) {
    const flashing = me.shame.filter(s => s.flashing).length;
    if (flashing >= 1) return 'cop.widget.hintOneDuckLeft';
    return undefined;
  }
  if (round <= 6) return 'cop.widget.hintCallByRound6';
  return undefined;
}
```

(Then `t(copHint(...) ?? '')` or guard with a null check in the render.)

- [ ] **Step 5: Typecheck + run tests**

```bash
npx tsc -b --noEmit && npm test -- --run
```

- [ ] **Step 6: Commit**

```bash
git add src/components/phone/PhaseView.tsx src/hooks/useGameState.ts
git commit -m "feat(cop): PhaseView wires role reveal, role widget, telephone holder"
```

---

## Task 20: ReckoningScreen — role reveal + investigation + verdict

**Files:**
- Modify: `src/components/screens/ReckoningScreen.tsx`

When the variant is on, the existing reckoning choreography is **prefixed** with:
1. All role cards flip simultaneously (~2s settle).
2. Investigation summary beats sequenced (reinforcements called/never, cop survived/died, flashing-light count).
3. Verdict overlay (cop wins or mafia wins).

Then the existing ledger choreography runs.

- [ ] **Step 1: Read the current ReckoningScreen**

```bash
sed -n '1,60p' src/components/screens/ReckoningScreen.tsx
```

Find the existing phase-state ("show all then sequence ledger") and identify the natural pre-ledger hook.

- [ ] **Step 2: Add the variant-gated prefix**

Add a new `prefixStage: 'roles' | 'investigation' | 'verdict' | 'done'` local state that the component starts at `'roles'` if `game.variants.cop`, and `'done'` otherwise. The existing ledger render is gated behind `prefixStage === 'done'`. Each prefix stage uses a `setTimeout` to advance to the next, with a short visible beat.

```tsx
import { useEffect, useState } from 'react';
import { gameOutcome } from '../../game/scoring';

type PrefixStage = 'roles' | 'investigation' | 'verdict' | 'done';

// Inside the component:
const [prefixStage, setPrefixStage] = useState<PrefixStage>(
  game.variants.cop ? 'roles' : 'done'
);

useEffect(() => {
  if (prefixStage === 'roles') {
    const id = window.setTimeout(() => setPrefixStage('investigation'), 2200);
    return () => clearTimeout(id);
  }
  if (prefixStage === 'investigation') {
    const id = window.setTimeout(() => setPrefixStage('verdict'), 4800);
    return () => clearTimeout(id);
  }
  if (prefixStage === 'verdict') {
    const id = window.setTimeout(() => setPrefixStage('done'), 2800);
    return () => clearTimeout(id);
  }
}, [prefixStage]);
```

Then render conditionally — example sketch for the prefix block (place it ABOVE the existing ledger JSX, returning early when prefixStage !== 'done'):

```tsx
if (game.variants.cop && prefixStage !== 'done') {
  const outcome = gameOutcome(game, /* totalKills computed from eliminatedByRound */ totalKills);
  const cop = game.players.find(p => p.role === 'cop');
  const copDeadRound = cop?.status === 'dead'
    ? findRoundCopDied(game, cop.id, eliminatedByRound)
    : undefined;
  const flashingCount = cop?.shame.filter(s => s.flashing).length ?? 0;
  const reinforcementsRound = game.cop?.reinforcementsRoundOnTheWay;

  return (
    <Box sx={{ /* full-screen reckoning canvas */ }}>
      {prefixStage === 'roles' && <RolesFlipBeat players={game.players} />}
      {prefixStage === 'investigation' && (
        <InvestigationBeat
          reinforcementsRound={reinforcementsRound}
          copDeadRound={copDeadRound}
          flashingCount={flashingCount}
        />
      )}
      {prefixStage === 'verdict' && <VerdictBeat outcome={outcome} />}
    </Box>
  );
}
```

Define the three small sub-components at the bottom of the file (kept private to ReckoningScreen since they're not reused):

```tsx
function RolesFlipBeat({ players }: { players: Player[] }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ /* centered, all role cards visible */ }}>
      <Box sx={{ /* "The roles..." caption */ }}>{t('cop.reckoning.rolesIntro')}</Box>
      <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1.4rem' }}>
        {players.map(p => (
          <Box key={p.id} sx={{ /* role card flip animation */ }}>
            {p.role}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function InvestigationBeat({
  reinforcementsRound,
  copDeadRound,
  flashingCount,
}: {
  reinforcementsRound: number | undefined;
  copDeadRound: number | undefined;
  flashingCount: number;
}) {
  const { t } = useTranslation();
  const lines: string[] = [];
  lines.push(
    reinforcementsRound !== undefined
      ? t('cop.reckoning.calledRoundN', { n: reinforcementsRound })
      : t('cop.reckoning.neverCame'),
  );
  lines.push(
    copDeadRound !== undefined
      ? t('cop.reckoning.copKilledRoundN', { n: copDeadRound })
      : t('cop.reckoning.copSurvived'),
  );
  if (reinforcementsRound !== undefined) {
    lines.push(t('cop.reckoning.copFlashingShame', { n: flashingCount }));
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center' }}>
      {lines.map((line, i) => (
        <Box key={i} sx={{ animation: `fadeIn 600ms ease-out ${i * 800}ms both` }}>
          {line}
        </Box>
      ))}
    </Box>
  );
}

function VerdictBeat({ outcome }: { outcome: GameOutcome }) {
  const { t } = useTranslation();
  if (outcome.kind === 'cop_wins') {
    return (
      <Box sx={{ /* siren palette wash, large title */ }}>
        {t('cop.reckoning.verdictCopWins')}
      </Box>
    );
  }
  return (
    <Box sx={{ /* sober palette, italic */ }}>
      {t('cop.reckoning.verdictMafiaWins')}
    </Box>
  );
}
```

`findRoundCopDied` is a small helper:

```ts
function findRoundCopDied(
  game: Game,
  copId: string,
  eliminatedByRound: Record<number, string[]>,
): number | undefined {
  for (const round of Object.keys(eliminatedByRound).map(Number).sort((a, b) => a - b)) {
    if (eliminatedByRound[round].includes(copId)) return round;
  }
  return undefined;
}
```

(Existing reckoning code already takes `eliminatedByRound` as a prop — use it.)

- [ ] **Step 3: Update flashing-light shame visualization on player cards**

If the reckoning's player cards render shame markers, update them to distinguish flashing vs flat. Look for the shame row in `EndGameRow` or whatever component renders the per-player block, and split rendering:

```tsx
{p.shame.map((s, i) => (
  <Box
    key={i}
    sx={{
      width: 12, height: 12, borderRadius: '50%',
      background: s.flashing ? palette.blood : palette.paperDim,
      // Optional: flashing animation for flashing markers
    }}
  />
))}
```

Apply the same treatment on the in-game `PlayerNode` / GameBoard player card — search for the shame render there and apply the same split.

- [ ] **Step 4: Typecheck + dev smoke**

```bash
npx tsc -b --noEmit && npm run dev
```

Visit the existing `/mock/big-screen/1` and toggle the surface to "reckoning" — confirm: with base fixtures (variant off) reckoning renders unchanged. With cop-variant scenarios (Task 25 not yet wired) the prefix beats will appear.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/ReckoningScreen.tsx
git commit -m "feat(cop): reckoning prefix — roles flip, investigation, verdict; flashing shame render"
```

---

## Task 21: Lobby toggle + room init

**Files:**
- Modify: `src/pages/RoomPage.tsx`
- Modify: any room-init helper (search for `createRoom` or `initGame` callers in pages/)

The lobby's existing super-powers toggle pattern is the template; mirror it. Mutual exclusion with super-powers means the two toggles are coupled — toggling one off the other.

- [ ] **Step 1: Read the existing super-powers toggle in RoomPage**

```bash
rg "superPowers" src/pages/RoomPage.tsx -n
```

Identify the lobby toggle JSX and the Firebase variant write helper.

- [ ] **Step 2: Add a cop toggle parallel to super-powers**

In the lobby render section of `RoomPage.tsx`, add:

```tsx
import { useTranslation } from 'react-i18next';
// (existing imports)

// ... within the variantSlot/lobby toggles area:
<VariantToggleRow>
  <ToggleButton
    active={lobbyVariants.superPowers}
    disabled={!canEnableSuperPowers}
    onClick={() => setLobbyVariants(v => ({ superPowers: !v.superPowers, cop: false }))}
    title={t('powers.lobby.toggleLabel')}
  />
  <ToggleButton
    active={lobbyVariants.cop}
    disabled={!canEnableCop}
    onClick={() => setLobbyVariants(v => ({ superPowers: false, cop: !v.cop }))}
    title={t('cop.lobby.toggleLabel')}
    hint={
      !canEnableCop
        ? t('cop.lobby.requiresFiveSix')
        : (lobbyVariants.superPowers
            ? t('cop.lobby.exclusiveWithPowers')
            : undefined)
    }
  />
</VariantToggleRow>
```

(`ToggleButton`/`VariantToggleRow` are placeholders — substitute the actual component used for the super-powers toggle.)

- [ ] **Step 3: Compute `canEnableCop`**

```ts
const playerCount = roomState.players.filter(p => p.status !== 'empty').length;
const canEnableCop = playerCount >= 5 && playerCount <= 6;
```

- [ ] **Step 4: Auto-disable on player count change**

```ts
useEffect(() => {
  if (lobbyVariants.cop && !canEnableCop) {
    setLobbyVariants(v => ({ ...v, cop: false }));
    // Optional: surface a toast — copy lives in i18n.
  }
}, [canEnableCop, lobbyVariants.cop]);
```

- [ ] **Step 5: Thread variants into `initGame`**

In the `onStart` handler, pass `lobbyVariants` (now `{ superPowers, cop }`) into `initGame`:

```ts
const game = initGame(players, seed, Date.now(), lobbyVariants);
// write to Firebase as before
```

- [ ] **Step 6: Lobby banner on phones**

In the phone's lobby waiting view (search for where the super-powers banner is rendered), add a parallel banner gated on `variants.cop`:

```tsx
{roomState.variants?.cop && (
  <Box sx={{ /* match the super-powers banner styling */ }}>
    {t('cop.lobby.banner')}
  </Box>
)}
```

- [ ] **Step 7: Typecheck + dev smoke**

```bash
npx tsc -b --noEmit && npm run dev
```

Open the lobby with 5 phones (or use the mock big-screen at /mock/big-screen and 5 phones for player count). Verify:
- Toggle disabled with <5 players, enabled at 5-6.
- Enabling cop disables super-powers automatically (and vice versa).
- Drop a phone to 4 — cop toggle auto-disables.

- [ ] **Step 8: Commit**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat(cop): lobby toggle — cop variant, 5-6 only, mutually exclusive with powers"
```

---

## Task 22: RoomPage — mount RolesDealtOverlay

**Files:**
- Modify: `src/pages/RoomPage.tsx`
- Modify: `src/pages/MockBigScreen.tsx`

The RolesDealtOverlay is mounted at the page level (not on GameBoard) because it overlays the full canvas and is one-shot per game.

- [ ] **Step 1: Add overlay state to RoomPage**

```tsx
import { RolesDealtOverlay } from '../components/screens/RolesDealtOverlay';

// inside the component, after game is loaded:
const [rolesDealtVisible, setRolesDealtVisible] = useState(false);
useEffect(() => {
  if (!game) return;
  if (!game.variants.cop) return;
  if (game.round.number === 1 && game.round.phase === 'commit' && !rolesDealtVisible) {
    setRolesDealtVisible(true);
  }
}, [game, rolesDealtVisible]);

// In the render tree, beside the existing PageCanvas:
<RolesDealtOverlay
  visible={rolesDealtVisible}
  onDone={() => setRolesDealtVisible(false)}
  acknowledgedCount={/* count of phones that have hit the ack — see step 2 */ 0}
  totalCount={game?.players.length ?? 0}
/>
```

- [ ] **Step 2: Ack count plumbing**

The overlay shows progress as phones acknowledge their role. The simplest path: store an `acked: string[]` array on the room state (not on the game state — it's lobby-adjacent ephemera). When a phone taps Ack on the RoleRevealScreen, write the player id to that list.

```ts
// In a new helper or inline:
export function ackRole(roomStore: RoomStore, playerId: string): void {
  roomStore.update(r => ({
    ...r,
    cop: {
      ...(r.cop ?? {}),
      ackedRoles: Array.from(new Set([...(r.cop?.ackedRoles ?? []), playerId])),
    },
  }));
}
```

The `RoleRevealScreen.onAcknowledge` callback (Task 17 + 19) calls this.

Pipe the count through:

```tsx
acknowledgedCount={roomState.cop?.ackedRoles?.length ?? 0}
```

- [ ] **Step 3: Mirror in MockBigScreen**

Per the project memory: big-screen edits apply to **both** `RoomPage` and `MockBigScreen`. Add the same RolesDealtOverlay mount + state to `MockBigScreen.tsx`. The mock can fake the acknowledgedCount (always === totalCount after a 600ms delay, simulating instant acks).

- [ ] **Step 4: Typecheck**

```bash
npx tsc -b --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/RoomPage.tsx src/pages/MockBigScreen.tsx
git commit -m "feat(cop): mount RolesDealtOverlay on RoomPage + MockBigScreen"
```

---

## Task 23: Dev scenarios + ScenarioDock + MockBigScreen wiring

**Files:**
- Modify: `src/components/dev/scenarios.ts`
- Modify: `src/components/dev/ScenarioDock.tsx`
- Modify: `src/pages/MockBigScreen.tsx`

- [ ] **Step 1: Add 5 cop-variant scenarios**

In `src/components/dev/scenarios.ts`, append new scenarios that pre-build cop-variant games at specific decision points:

```ts
// scenarios.ts — append:

const copScenarios = [
  {
    id: 'cop-calls-early',
    label: "Cop calls early — cruises to win",
    blurb: 'Cop drops the call in round 1. Reinforcements arrive by round 3. Cop ducks once, survives, wins.',
    build: () => {
      const players = makeCrew(5);
      const game = initGame(players, 'cop-calls-early', Date.now(), { superPowers: false, cop: true });
      // Force the cop to a known seat for reproducibility:
      game.players[0].role = 'cop';
      game.players.slice(1).forEach(p => (p.role = 'mafia'));
      // Pre-advance the cop state.
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 3 };
      game.round.number = 4;
      return game;
    },
  },
  {
    id: 'cop-never-calls',
    label: 'Cop never calls',
    blurb: 'Cop sits on the call. Round 7 begins — too late. Mafia wins regardless of survival.',
    build: () => {
      const players = makeCrew(5);
      const game = initGame(players, 'cop-never-calls', Date.now(), { superPowers: false, cop: true });
      game.players[0].role = 'cop';
      game.players.slice(1).forEach(p => (p.role = 'mafia'));
      game.cop = { callsMade: 0 };
      game.round.number = 7;
      return game;
    },
  },
  {
    id: 'cop-killed-before-call',
    label: 'Cop killed in round 2',
    blurb: 'Mafia drops the cop before any call. Phase 8 keeps running as theater for the remaining rounds; mafia wins at reckoning.',
    build: () => {
      const players = makeCrew(5);
      const game = initGame(players, 'cop-killed-before-call', Date.now(), { superPowers: false, cop: true });
      game.players[0].role = 'cop';
      game.players[0].status = 'dead';
      game.players[0].wounds = 3;
      game.players.slice(1).forEach(p => (p.role = 'mafia'));
      game.cop = { callsMade: 0 };
      game.round.number = 3;
      return game;
    },
  },
  {
    id: 'cop-overducks',
    label: 'Cop calls but overducks',
    blurb: 'Cop lands the call in round 4 but ducks twice after — too cautious. Mafia wins.',
    build: () => {
      const players = makeCrew(5);
      const game = initGame(players, 'cop-overducks', Date.now(), { superPowers: false, cop: true });
      game.players[0].role = 'cop';
      game.players[0].shame = [{ flashing: true }, { flashing: true }];
      game.players.slice(1).forEach(p => (p.role = 'mafia'));
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 4 };
      game.round.number = 8;
      return game;
    },
  },
  {
    id: 'mafia-rich-cop-loses',
    label: 'Cop barely loses, mafia gets paid',
    blurb: 'Reinforcements land but cop took 2 flashing-light shames. Richest mafia takes the crown.',
    build: () => {
      const players = makeCrew(5);
      const game = initGame(players, 'mafia-rich-cop-loses', Date.now(), { superPowers: false, cop: true });
      game.players[0].role = 'cop';
      game.players[0].shame = [{ flashing: false }, { flashing: true }, { flashing: true }];
      game.players[0].cash = [{ id: 'n1', value: 10000 }];
      game.players[1].role = 'mafia';
      game.players[1].cash = [{ id: 'n2', value: 50000 }];
      game.players.slice(2).forEach(p => (p.role = 'mafia'));
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 5 };
      game.round.number = 8;
      return game;
    },
  },
];

// Then in the existing SCENARIOS export array, append:
export const SCENARIOS = [
  ...existingScenarios,
  ...copScenarios,
];
```

(`makeCrew` is whatever helper the existing scenarios use to construct 5-6 players — match the existing pattern.)

- [ ] **Step 2: Cop variant toggle in `ScenarioDock`**

If `ScenarioDock` filters scenarios by variant tag, add a tag field to each scenario (`variant: 'base' | 'powers' | 'cop'`) and add a toggle row in the dock. If it lists all scenarios flatly, that's fine — they'll just appear in the dropdown.

- [ ] **Step 3: Mock big-screen renders new overlays for cop scenarios**

`MockBigScreen.tsx` already renders the `GameBoard`, which mounts Switchboard/TelephonePass/Reinforcements overlays when `variants.cop` is on (Task 16). The cop scenarios above set `variants.cop = true` via `initGame`, so they should "just work."

Smoke test: `npm run dev`, visit `/mock/big-screen/1`, select each cop scenario, verify:
- Switchboard widget visible top-right.
- Loading "cop-calls-early": switchboard shows 3/3 filled.
- Loading "cop-overducks": cop player card shows flashing-light shame.

- [ ] **Step 4: Typecheck + dev smoke**

```bash
npx tsc -b --noEmit && npm run dev
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dev/scenarios.ts src/components/dev/ScenarioDock.tsx src/pages/MockBigScreen.tsx
git commit -m "feat(cop): 5 mock scenarios + dock wiring for cop variant"
```

---

## Task 24: Mock phone — role reveal + telephone holder flow

**Files:**
- Modify: `src/pages/MockPlayerPage.tsx`

The mock phone page lets us drive the phone surfaces against a chosen seat without a live room. Verify all three cop-variant phone surfaces fire correctly from the same scenarios.

- [ ] **Step 1: Open the mock player page** and confirm it loads scenarios via the shared LocalGameStore (matching MockBigScreen pattern).

- [ ] **Step 2: Smoke test each phone surface**

For each scenario from Task 23 plus a fresh round-1 cop-variant scenario:
- Round-1 freshly-built cop scenario: select seat 0 (the cop) → see `RoleRevealScreen` for cop. Select seat 1 → see `RoleRevealScreen` for mafia.
- After ack, the `RoleWidget` should appear in the corner.
- Force the phase to `telephone` (via the existing phase-forcing dev affordance, if any) and confirm `TelephoneHolderScreen` shows on the current holder.

- [ ] **Step 3: Add a "force telephone phase" affordance** if not already present in the mock dock. Brief sketch:

```tsx
// In the ScenarioDock or MockPlayerPage:
<Button onClick={() => store.update(g => ({
  ...g,
  round: {
    ...g.round,
    phase: 'telephone',
    telephone: {
      used: false,
      holderOrder: telephoneHolderOrder(g),
      currentHolderId: telephoneHolderOrder(g)[0],
    },
  },
}))}>Force telephone</Button>
```

- [ ] **Step 4: Commit (any small fixes from smoke testing)**

```bash
git add src/pages/MockPlayerPage.tsx
git commit -m "test(cop): mock phone smoke — role reveal + telephone holder + widget"
```

---

## Task 25: Final regression + manual QA

**Files:**
- Run-only — no file edits expected unless smoke testing surfaces bugs.

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --run
```

Zero failures.

- [ ] **Step 2: Run typecheck**

```bash
npx tsc -b --noEmit
```

Zero errors.

- [ ] **Step 3: Manual QA matrix**

Run `npm run dev` and walk through the matrix below in the browser. The mock pages cover most of this; live-room QA can wait until after merge.

**Variant off (baseline):**
- [ ] Start a 4-player game, play 1-2 rounds. Confirm behavior unchanged.
- [ ] Reckoning at end of an 8-round game still works as before.

**Cop variant on, 5 players:**
- [ ] Lobby: toggle shows enabled, super-powers toggle disabled when cop is on (and vice versa).
- [ ] Lobby: drop to 4 players → cop toggle auto-disables.
- [ ] Game start: every phone shows role reveal; big screen shows ROLES DEALT overlay.
- [ ] Round 1 commit begins normally after all acks.
- [ ] Round 1 phase 8: phone token visibly travels to each split participant; cop's CALL works; mafia's CALL is decoy.
- [ ] Successful first call: switchboard advances 0/3 → 1/3.
- [ ] Three calls total: ReinforcementsOverlay plays; shame markers from this point render flashing.
- [ ] Cop ducks twice post-reinforcements: at reckoning, cop loses; mafia wins by base rules.
- [ ] Cop wins flow: reckoning prefix runs (roles flip → investigation summary → "JUSTICE SERVED" verdict → ledger).

**Cop variant on, 6 players:** repeat the core flow above.

**Round 7-8 with cop variant:** confirm phase 8 is skipped (no phone-pass animation).

**No split participants:** force a round where everyone ducks; confirm phase 8 skipped.

- [ ] **Step 4: Final commit + branch summary**

```bash
git add -A
git commit -m "chore(cop): QA pass complete" --allow-empty
git log --oneline cop-in-the-mafia ^main
```

The branch is ready to merge to main.

---

## Out of scope (wave 2 — separate plan)

- **Super-powers × cop combination.** Lifting the lobby mutual exclusion; designing each power × cop interaction (Insane is the main one — its grenade skips phase 8 that round per paper). The widget slot on the phone will need to fit both a role card and a power card; wave-2 plan resolves that.
- **Audio.** Siren sting for reinforcements, dialing sound on the phone token — parked, consistent with the rest of the project.
- **Round history log for the cop's call decisions.** Not in scope; the switchboard widget already shows aggregate state.

