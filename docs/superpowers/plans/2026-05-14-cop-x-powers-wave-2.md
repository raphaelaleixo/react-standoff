# Cop × Super-Powers Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the wave-1 lobby mutual-exclusion so the cop variant and the super-powers variant can compose. Deal both at setup, lay out two cards on the phone with sequential intro, surface both at end-game reveal.

**Architecture:** Three decoupled changes — (a) lobby toggle decoupling + setup composition (engine entry), (b) a single engine helper to flip unrevealed powers at game-end, (c) PhoneShell extended to lay out two corner cards and sequence their intros. Insane × phase 8 is already correct via the existing grenade end-round path; a regression test locks it in.

**Tech Stack:** React 19, TypeScript strict, Vitest, MUI, Firebase realtime store.

---

## File Structure

**Modified:**
- `src/pages/RoomPage.tsx` — drop mutex in lobby toggle handlers.
- `src/locales/en.json` — retire the `cop.lobby.exclusiveWithPowers` hint.
- `src/game/setup.ts` — deal roles AND powers when both variants on.
- `src/game/setup.test.ts` — assertions for the new composition.
- `src/game/transitions.ts` — `revealAllEffects(players)` helper.
- `src/game/transitions.test.ts` — coverage for the helper.
- `src/hooks/useGameState.ts` — call the helper at every `phase: "ended"` transition.
- `src/components/shell/PhoneShell.tsx` — two-card tucked layout + sequential intro state.
- `src/pages/PlayerPage.tsx` — already passes `introOpen` + `roleIntroOpen`; no change.
- `src/pages/MockPlayerPage.tsx` — already passes both; no change.
- `src/components/dev/scenarios.ts` — four new wave-2 mashup scenarios.

**Created:**
- None. All work fits in existing files.

---

## Task 1: Lift lobby mutual-exclusion

**Files:**
- Modify: `src/pages/RoomPage.tsx:120-143`
- Modify: `src/locales/en.json:132` (drop key)

- [ ] **Step 1: Write a failing manual-check test plan**

There's no RoomPage test covering this. Add a short unit-style test directly on the toggle handlers, or skip and rely on the engine + mock pages. Plan choice: rely on mocks + engine tests downstream. Verify manually after the change by running `npm run dev` and toggling both lobby checkboxes.

- [ ] **Step 2: Replace the handlers to be independent**

Edit `src/pages/RoomPage.tsx:120-137` to:

```tsx
  const onSuperPowersToggle = async (next: boolean) => {
    if (!id) return;
    await set(ref(database, `rooms/${id}/lobbyVariants`), {
      superPowers: next,
      cop: variantCop,
    });
  };

  const onCopToggle = async (next: boolean) => {
    if (!id) return;
    if (next && !canEnableCop) return;
    await set(ref(database, `rooms/${id}/lobbyVariants`), {
      superPowers: variantSuperPowers,
      cop: next,
    });
  };
```

- [ ] **Step 3: Update `copHint` to drop the mutex branch**

Edit `src/pages/RoomPage.tsx:139-143` to:

```tsx
  const copHint = !canEnableCop
    ? t("cop.lobby.requiresFiveSix")
    : t("cop.lobby.toggleSub");
```

- [ ] **Step 4: Remove the dead translation key**

Edit `src/locales/en.json:128-134` to drop the `exclusiveWithPowers` entry:

```json
    "lobby": {
      "toggleLabel": "A Privateer Among Us",
      "toggleSub": "the Crown has eyes in the crew",
      "requiresFiveSix": "needs 5 or 6 hands aboard",
      "banner": "A Privateer sails among us…"
    },
```

- [ ] **Step 5: Type-check and run the suite**

```bash
npx tsc -b --pretty false
npx vitest run --reporter=dot
```

Expected: type-check clean. All 287 tests still pass — none of them assert the mutex copy.

- [ ] **Step 6: Commit**

```bash
git add src/pages/RoomPage.tsx src/locales/en.json
git commit -m "feat(cop): lift lobby mutual-exclusion with super-powers (wave 2)"
```

---

## Task 2: Setup deals both role AND power when both variants on

**Files:**
- Modify: `src/game/setup.ts:45-53`
- Modify: `src/game/setup.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/game/setup.test.ts`:

```ts
import { initGame } from './setup';
import type { Player } from './types';

function mockPlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    displayName: `Player ${i}`,
    colorOrAvatar: 'calico_jack',
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: 'alive' as const,
    effects: [],
  }));
}

describe('initGame with both variants', () => {
  it('deals exactly one role per player AND one power per player', () => {
    const players = mockPlayers(5);
    const game = initGame(players, 'seed-both', 0, { superPowers: true, cop: true });
    // Every player has a role.
    expect(game.players.every(p => p.role === 'cop' || p.role === 'mafia')).toBe(true);
    // Exactly one cop.
    expect(game.players.filter(p => p.role === 'cop').length).toBe(1);
    // Every player has exactly one power effect.
    expect(game.players.every(p => p.effects.length === 1)).toBe(true);
    // Cop state initialised.
    expect(game.cop).toEqual({ callsMade: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/game/setup.test.ts --reporter=dot
```

Expected: FAIL. With both flags on today, only super-powers gets dealt (`else if (variants.cop)` is skipped); `p.role` will be undefined for every player.

- [ ] **Step 3: Update setup.ts to deal both**

Edit `src/game/setup.ts:45-53` to:

```ts
  // Deal each variant's setup independently when its flag is on. Wave 2:
  // both can be on at once, so super-powers AND cop both run their deals.
  let dealtPlayers = baseDealt;
  if (variants.superPowers) {
    dealtPlayers = dealPowers(dealtPlayers, rng);
  }
  if (variants.cop) {
    dealtPlayers = dealRoles(dealtPlayers, rng);
  }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/game/setup.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 5: Run the full suite**

```bash
npx vitest run --reporter=dot
```

Expected: 288 passed (was 287; one new test).

- [ ] **Step 6: Commit**

```bash
git add src/game/setup.ts src/game/setup.test.ts
git commit -m "feat(setup): deal both role and power when both variants on"
```

---

## Task 3: `revealAllEffects` helper

**Files:**
- Modify: `src/game/transitions.ts`
- Modify: `src/game/transitions.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/game/transitions.test.ts`:

```ts
import { revealAllEffects } from './transitions';

describe('revealAllEffects', () => {
  it('flips every effect.revealed to true', () => {
    const players = [
      { id: 'a', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [], status: 'alive' as const,
        effects: [{ kind: 'tough' as const, revealed: false, used: false }] },
      { id: 'b', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [], status: 'alive' as const,
        effects: [{ kind: 'insane' as const, revealed: true, used: true }] },
      { id: 'c', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [], status: 'alive' as const,
        effects: [] },
    ];
    const out = revealAllEffects(players);
    expect(out[0].effects[0]).toEqual({ kind: 'tough', revealed: true, used: false });
    expect(out[1].effects[0]).toEqual({ kind: 'insane', revealed: true, used: true });
    expect(out[2].effects).toEqual([]);
    // Non-mutation: the input players' effect arrays are not aliased.
    expect(out[0].effects).not.toBe(players[0].effects);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/game/transitions.test.ts --reporter=dot
```

Expected: FAIL with "revealAllEffects is not a function" (or import error).

- [ ] **Step 3: Implement the helper**

Append to `src/game/transitions.ts`:

```ts
// Flip every player's effects[].revealed to true. Used at game-end so the
// reckoning reveal can surface previously-unrevealed powers in the same
// beat as the role-reveal flip.
export function revealAllEffects(players: Player[]): Player[] {
  return players.map(p => ({
    ...p,
    effects: p.effects.map(e => (e.revealed ? e : { ...e, revealed: true })),
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/game/transitions.test.ts --reporter=dot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/transitions.ts src/game/transitions.test.ts
git commit -m "feat(transitions): add revealAllEffects helper for end-game reveal"
```

---

## Task 4: Call `revealAllEffects` at every `phase: "ended"` transition

**Files:**
- Modify: `src/hooks/useGameState.ts` (3 sites)

- [ ] **Step 1: Verify the three "ended" transition sites exist**

```bash
grep -n 'phase: "ended"\|phase: .ended.' /Users/raphaelavellar/Documents/Projects/standoff/src/hooks/useGameState.ts
```

Expected: three matches. (a) `endRoundFromGrenade` around line 111, (b) split→ended around line 461-464, (c) telephone→ended around line 519.

- [ ] **Step 2: Import the helper at the top of useGameState.ts**

Find the existing import from `../game/transitions`:

```ts
import {
  endGameStatus,
  shouldRunTelephonePhase,
  // ... existing imports
  telephoneHolderOrder,
} from "../game/transitions";
```

Add `revealAllEffects`:

```ts
import {
  endGameStatus,
  revealAllEffects,
  shouldRunTelephonePhase,
  // ... existing imports
  telephoneHolderOrder,
} from "../game/transitions";
```

- [ ] **Step 3: Site (a) — `endRoundFromGrenade`**

Edit `src/hooks/useGameState.ts` around line 108-112 to:

```ts
  const resolved = { ...game, players: result.players };
  const status = endGameStatus(resolved);
  if (status.ended) {
    store.update("", { phase: "ended", players: revealAllEffects(result.players) });
    return;
  }
```

- [ ] **Step 4: Site (b) — split → ended**

Edit `src/hooks/useGameState.ts` around line 459-466 to:

```ts
      const status = endGameStatus(resolved);
      if (status.ended) {
        store.update("", {
          phase: "ended",
          players: revealAllEffects(result.players),
        });
        return;
      }
```

- [ ] **Step 5: Site (c) — telephone → ended**

Edit `src/hooks/useGameState.ts` around line 515-521 to:

```ts
      const status = endGameStatus(game);
      if (status.ended) {
        store.update("", {
          phase: "ended",
          players: revealAllEffects(game.players),
        });
        return;
      }
```

- [ ] **Step 6: Type-check and run the suite**

```bash
npx tsc -b --pretty false
npx vitest run --reporter=dot
```

Expected: type-check clean, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat(end-game): flip all powers to revealed at end-of-game"
```

---

## Task 5: Insane × phase 8 — document the bypass

The engine already routes grenade detonation via `endRoundFromGrenade` (split → next-round/ended, bypassing `telephone` entirely). No code change is needed; just document the wiring so future readers understand the contract.

**Files:**
- Modify: `src/hooks/useGameState.ts`

- [ ] **Step 1: Add a clarifying comment at the call site**

Edit `src/hooks/useGameState.ts` inside `endRoundFromGrenade`, above the `startNextRound` call:

```ts
  // No telephone phase: Insane's grenade ends the round per paper rule.
  // Phase 8 is skipped this round even when the cop variant is on, because
  // this branch never re-enters the split → telephone gate. Manual e2e
  // covers this in the "cop-with-insane" scenario (Task 9).
  const nextGame = startNextRound(resolved, serverNowMs);
```

- [ ] **Step 2: Type-check + run the suite**

```bash
npx tsc -b --pretty false
npx vitest run --reporter=dot
```

Expected: clean, green.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "docs(cop): comment Insane × phase 8 skip in end-round-from-grenade"
```

---

## Task 6: PhoneShell — two-card tucked layout

**Files:**
- Modify: `src/components/shell/PhoneShell.tsx`

- [ ] **Step 1: Identify when "both cards" mode applies**

Both cards coexist when the player has a role AND a power. Compute this once near the top of the component:

```tsx
  const bothCards = !!me.role && !!myPower;
```

Insert this after the existing `const myPower = me.effects[0];` line in `PhoneShell.tsx:38`.

- [ ] **Step 2: Update the role card's tucked position to use bottom-LEFT in dual mode**

In the role card block (`me.role && (...)`), the tucked position currently sits at:

```tsx
                : {
                    bottom: "0.8rem",
                    right: "0.95rem",
                    transform: "scale(0.24)",
                  }),
```

Change to:

```tsx
                : bothCards
                  ? {
                      bottom: "0.8rem",
                      left: "0.95rem",
                      right: "auto",
                      transform: "scale(0.35)",
                    }
                  : {
                      bottom: "0.8rem",
                      right: "0.95rem",
                      transform: "scale(0.24)",
                    }),
```

Also update `transformOrigin` for the role card from `"bottom right"` to compute dynamically:

```tsx
                transformOrigin: bothCards ? "bottom left" : "bottom right",
```

- [ ] **Step 3: Update the power card's tucked size in dual mode**

In the power card block (`myPower && (...)`), change the closed-state position from:

```tsx
                : {
                    bottom: "0.8rem",
                    right: "0.95rem",
                    transform: "scale(0.24)",
                  }),
```

To (preserve right placement, just upscale to match role):

```tsx
                : {
                    bottom: "0.8rem",
                    right: "0.95rem",
                    transform: bothCards ? "scale(0.35)" : "scale(0.24)",
                  }),
```

- [ ] **Step 4: Type-check**

```bash
npx tsc -b --pretty false
```

Expected: clean.

- [ ] **Step 5: Manual visual check**

```bash
npm run dev
```

Navigate to mock player page with both variants on. Verify two cards visible at the bottom (role left, power right), each ~half-width. Cash strip in the middle stays readable.

- [ ] **Step 6: Run the suite**

```bash
npx vitest run --reporter=dot
```

Expected: all green (no test currently asserts layout pixel positions).

- [ ] **Step 7: Commit**

```bash
git add src/components/shell/PhoneShell.tsx
git commit -m "feat(phone): two-card tucked layout when role + power both present"
```

---

## Task 7: PhoneShell — sequential intro choreography

**Files:**
- Modify: `src/components/shell/PhoneShell.tsx`

- [ ] **Step 1: Gate the power intro on the role intro completing first**

The role intro effect currently fires unconditionally when `roleIntroOpen` becomes true. The power intro effect fires when `introOpen` becomes true. In dual mode they'd both fire simultaneously. Change the power intro effect to wait for the role intro to be either absent or already closed.

Edit `src/components/shell/PhoneShell.tsx:47-53`:

```tsx
  useEffect(() => {
    if (!introOpen || hasTriggeredIntroRef.current) return;
    // Sequential intro: when both cards have an intro queued, wait for
    // the role intro to close before triggering the power intro. The
    // role's introActive flips false in closeRoleCard, which re-fires
    // this effect.
    if (roleIntroOpen && roleIntroActive) return;
    hasTriggeredIntroRef.current = true;
    setPowerOpen(true);
    setIntroActive(true);
  }, [introOpen, roleIntroOpen, roleIntroActive]);
```

- [ ] **Step 2: Type-check**

```bash
npx tsc -b --pretty false
```

Expected: clean.

- [ ] **Step 3: Manual visual check**

```bash
npm run dev
```

Open the mock player page with both variants on, simulate round 1 commit. Verify role card auto-opens first; tap to close → role tucks to bottom-left; immediately after, power card auto-opens; tap to close → power tucks to bottom-right.

- [ ] **Step 4: Run the suite**

```bash
npx vitest run --reporter=dot
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/PhoneShell.tsx
git commit -m "feat(phone): sequential intro — role card first, then power card"
```

---

## Task 8: PhoneShell — enforce one-open-at-a-time

**Files:**
- Modify: `src/components/shell/PhoneShell.tsx`

- [ ] **Step 1: When user taps a tucked card while the opposite is open, close the opposite first**

Update `handleCardTap` (power) at `src/components/shell/PhoneShell.tsx:58-64`:

```tsx
  const handleCardTap = () => {
    if (introActive) {
      closeCard();
      return;
    }
    // One card open at a time: closing role if it's somehow open.
    if (roleOpen) {
      setRoleOpen(false);
      setRoleIntroActive(false);
    }
    setPowerOpen(o => !o);
  };
```

Update `handleRoleCardTap` similarly:

```tsx
  const handleRoleCardTap = () => {
    if (roleIntroActive) {
      closeRoleCard();
      return;
    }
    // One card open at a time: close power if it's open.
    if (powerOpen) {
      setPowerOpen(false);
      setIntroActive(false);
    }
    setRoleOpen(o => !o);
  };
```

- [ ] **Step 2: Type-check + run suite**

```bash
npx tsc -b --pretty false
npx vitest run --reporter=dot
```

Expected: clean + green.

- [ ] **Step 3: Manual visual check**

```bash
npm run dev
```

With both cards tucked, tap role → role opens, power stays tucked. Tap power (tucked) → role closes, power opens. Tap role (tucked) → power closes, role opens. Confirm there's only ever one open at a time.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/PhoneShell.tsx
git commit -m "feat(phone): only one corner card open at a time"
```

---

## Task 9: Wave-2 scenarios in dev/scenarios

**Files:**
- Modify: `src/components/dev/scenarios.ts`

- [ ] **Step 1: Add a "cop+powers" ScenarioKind and a build helper**

At the top of `src/components/dev/scenarios.ts:46`, extend the kind union:

```ts
export type ScenarioKind = "base" | "powers" | "cop" | "cop_powers";
```

Add a helper alongside `buildCopScenario` (around line 606):

```ts
// Build a scenario with BOTH variants on. Cop pinned to seat 0; powers
// dealt by the engine (deterministic by seed). The mutate hook lets
// scenarios pin specific powers per seat as needed.
function buildCopPowersScenario(seed: string, mutate: (game: Game) => void): Game {
  const game = initGame(copScenarioPlayers(), seed, Date.now(), {
    superPowers: true,
    cop: true,
  });
  game.players[0].role = "cop";
  game.players.slice(1).forEach(p => (p.role = "mafia"));
  mutate(game);
  return game;
}
```

- [ ] **Step 2: Add the four wave-2 scenarios to the SCENARIOS list**

At the bottom of the existing `SCENARIOS` array (just before its closing bracket), append four entries:

```ts
  {
    id: "cop-powers-baseline",
    kind: "cop_powers",
    label: "Cop × Powers — baseline",
    blurb: "Both variants on, no special interactions; verify layout and intros compose.",
    build: () => buildCopPowersScenario("seed-cop-powers-baseline", () => {}),
  },
  {
    id: "cop-with-insane",
    kind: "cop_powers",
    label: "Cop × Powers — cop holds Insane",
    blurb: "Cop has Pocket Inferno armed; takes a wound; round terminates, phase 8 skipped.",
    build: () => buildCopPowersScenario("seed-cop-with-insane", game => {
      game.players[0].effects = [{ kind: "insane", revealed: false, used: false }];
    }),
  },
  {
    id: "cop-with-super-coward",
    kind: "cop_powers",
    label: "Cop × Powers — cop has Yellow-Belly's Purse",
    blurb: "Cop ducks too much after the alarm; mission fails; shame inverts in scoring.",
    build: () => buildCopPowersScenario("seed-cop-with-super-coward", game => {
      game.players[0].effects = [{ kind: "super_coward", revealed: false, used: false }];
    }),
  },
  {
    id: "mafia-with-tough",
    kind: "cop_powers",
    label: "Cop × Powers — mafia holds Phantom Pain",
    blurb: "Mafia player has Tough; cop calls successfully; both systems compose.",
    build: () => buildCopPowersScenario("seed-mafia-with-tough", game => {
      game.players[1].effects = [{ kind: "tough", revealed: false, used: false }];
    }),
  },
```

- [ ] **Step 3: Update ScenarioDock to surface the new group**

Edit `src/components/dev/ScenarioDock.tsx:6-10` to add an entry:

```tsx
const GROUPS: { kind: ScenarioKind; label: string }[] = [
  { kind: "base", label: "Normal" },
  { kind: "powers", label: "Super Powers" },
  { kind: "cop", label: "Cop variant" },
  { kind: "cop_powers", label: "Cop × Powers" },
];
```

- [ ] **Step 4: Type-check**

```bash
npx tsc -b --pretty false
```

Expected: clean.

- [ ] **Step 5: Manual visual check**

```bash
npm run dev
```

Open mock big-screen. Scenario dock should now show four dropdowns (Normal / Super Powers / Cop variant / Cop × Powers). The "Cop × Powers" dropdown lists the four new scenarios. Play "Cop × Powers — baseline" and confirm the game starts with both variants active.

- [ ] **Step 6: Run the suite**

```bash
npx vitest run --reporter=dot
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add src/components/dev/scenarios.ts src/components/dev/ScenarioDock.tsx
git commit -m "feat(dev): wave-2 cop × powers scenarios in the dev dock"
```

---

## Task 10: End-to-end integration test for game-end reveal

**Files:**
- Modify: `src/game/transitions.test.ts`

- [ ] **Step 1: Write the failing integration-style test**

Append to `src/game/transitions.test.ts`:

```ts
describe('revealAllEffects across a wave-2 game shape', () => {
  it('reveals unrevealed powers held by both cop and mafia', () => {
    const players = [
      { id: 'cop', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [],
        status: 'alive' as const, role: 'cop' as const,
        effects: [{ kind: 'super_coward' as const, revealed: false, used: false }] },
      { id: 'm1', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [],
        status: 'alive' as const, role: 'mafia' as const,
        effects: [{ kind: 'tough' as const, revealed: false, used: false }] },
      { id: 'm2', displayName: '', colorOrAvatar: '', bullets: [], cash: [], wounds: 0, shame: [],
        status: 'dead' as const, role: 'mafia' as const,
        effects: [{ kind: 'insane' as const, revealed: true, used: true }] },
    ];
    const out = revealAllEffects(players);
    expect(out.every(p => p.effects.every(e => e.revealed))).toBe(true);
    // Roles untouched.
    expect(out.map(p => p.role)).toEqual(['cop', 'mafia', 'mafia']);
    // Status untouched.
    expect(out.map(p => p.status)).toEqual(['alive', 'alive', 'dead']);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
npx vitest run src/game/transitions.test.ts --reporter=dot
```

Expected: PASS (revealAllEffects was already implemented in Task 3; this is regression coverage for the wave-2 use case).

- [ ] **Step 3: Run the full suite**

```bash
npx vitest run --reporter=dot
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/game/transitions.test.ts
git commit -m "test(end-game): revealAllEffects with wave-2 role+power composition"
```

---

## Final verification

- [ ] **Step 1: Full type-check + suite**

```bash
npx tsc -b --pretty false
npx vitest run --reporter=dot
```

Expected: clean, all tests pass.

- [ ] **Step 2: Manual end-to-end**

```bash
npm run dev
```

Manually verify these flows:
1. Lobby: both toggles can be on independently.
2. Mock player page, "Cop × Powers — baseline": at round 1 commit, role card opens first (centered, "Tap when ready"); on close → tucks bottom-left at scale(0.35); power card auto-opens; on close → tucks bottom-right at scale(0.35).
3. Tucked behavior: tapping a tucked card opens it; opening one auto-closes the other.
4. "Cop × Powers — cop holds Insane": play through to a round where the cop takes a wound (or use the mock to simulate). Verify the round terminates and no phase-8 telephone appears.
5. Reckoning surface: load a "cop × powers" reckoning fixture (or extend RECKONING_SCENARIOS); at game-end, all power badges visible on crew rows alongside the role flip.

- [ ] **Step 3: Update memory note**

Run an internal note update marking wave-2 as complete. (No memory file change needed in this plan — the previous wave-1 note can be updated post-merge.)
