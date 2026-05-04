# MockBoard Dev Controls — Design

## Goal

Let `MockBigScreen` (the DEV-only `/mock/big-screen/:id` page) mutate its game state at runtime so we can iterate on big-screen visuals across arbitrary phases, commits, and player conditions without standing up a live room.

This first cut is **free-form state poking**: the panel sets fields directly on the `Game` value with no rules enforcement. Hooking the real resolver / phase transitions in via a "step" button is a deliberate follow-on, not part of this design.

## Scope

In scope (the state knobs the panel exposes):

1. Round phase — `commit | standoff | withdraw | reveal_bbb | reveal_others | split`
2. Round number — clamped 1–8
3. Per-player commit — `bullet`, `target`, `withdrew`
4. Per-player wounds — clamped 0–3
5. Per-player status — `alive | dead`
6. Per-player shame — non-negative integer

Out of scope (deferred):

- Loot stack editing, per-player hand/cash editing
- Game-level phase (`lobby | in_progress | ended`)
- Add/remove/rename players, change avatar
- Scenario presets ("post-shootout, 2 wounded", etc.)
- Real resolver / phase-transition stepper (option C)
- Persistence of mutated state across reloads

## Architecture

### File layout

New DEV-only directory `src/components/dev/`:

- `useMockGameState.ts` — custom hook owning `useState<Game>`, exposing typed action setters and a `reset`.
- `useDevPanelToggle.ts` — small hook for open/closed state and the backtick keyboard listener.
- `DevControlsPanel.tsx` — drawer UI; pure presentation against `{ game, actions, onClose }`.

Modified:

- `src/pages/MockBigScreen.tsx` — orchestrator: calls both hooks, renders the existing `PageCanvas`/`Masthead`/`GameBoard`/`Foot` against the live `game` value, renders the drawer.

Unchanged: `App.tsx` (the `MockBigScreen` route is already gated behind `import.meta.env.DEV`), all of `src/components/` outside `dev/`, all of `src/game/`.

### Data flow

Single source of truth is the `Game` returned by `useMockGameState`. Every input in the panel reads from `game`. Every change calls an action setter that produces a new `Game` immutably. `GameBoard` re-renders on each change. No effects, no derived caches, no async, no I/O.

### Hook API

```ts
// useMockGameState.ts
export interface MockGameActions {
  setPhase(phase: RoundPhase): void;
  setRoundNumber(n: number): void;        // clamped 1..8
  setCommit(playerId: string, partial: Partial<Commit>): void;
  setWounds(playerId: string, n: number): void;   // clamped 0..3
  setStatus(playerId: string, status: 'alive' | 'dead'): void;
  setShame(playerId: string, n: number): void;    // clamped >= 0
  reset(): void;                          // back to FIXTURE_GAME
}

export function useMockGameState(initial: Game): { game: Game; actions: MockGameActions };
```

```ts
// useDevPanelToggle.ts
export function useDevPanelToggle(initialOpen?: boolean): {
  open: boolean;
  setOpen(next: boolean): void;
  toggle(): void;
};
```

## UI

### Toggle behavior

- **Closed** is the absence of any UI — no rail, no chevron, drawer fully unmounted.
- **Open** mounts an MUI `<Drawer anchor="right" variant="persistent">` of fixed width (~360px). The `persistent` variant has no backdrop and no focus trap, so the canvas underneath stays fully visible.
- Default first-render state: **open** (so the panel announces itself).
- Toggling: a `keydown` listener on `window` (installed by `useDevPanelToggle`) handles two keys:
  - Backtick (`` ` ``) toggles open/closed.
  - `Esc` closes when open (no-op when closed). `persistent` Drawer doesn't intercept Esc itself, so we own this explicitly.
  Both checks ignore the keypress if `document.activeElement` is an `<input>`, `<textarea>`, or has `contenteditable` — typing `` ` `` or pressing `Esc` to clear a field must not close the drawer.
- The drawer header also has an `×` close button for mouse use.

### Panel contents

Header: title "Dev Controls", a "Reset" button (`actions.reset()`), `×` close.

Body, top-to-bottom:

**Round** section
- Phase: segmented control with 6 buttons (`commit | standoff | withdraw | reveal_bbb | reveal_others | split`); active phase visually distinguished.
- Round number: number input or − / + stepper, clamped 1–8.

**Players** section, one row per player in `game.players`:
- Player name as the row label.
- Status: alive / dead toggle.
- Wounds: 0 / 1 / 2 / 3 segmented buttons.
- Shame: − / value / + stepper.
- Commit → Bullet: dropdown of `none | clic | bang | bang_bang_bang`. `none` clears the bullet field on the commit.
- Commit → Target: dropdown of `none` plus the other player names. `none` clears the target.
- Commit → Withdrew: checkbox.

The drawer body scrolls internally when content overflows the viewport.

## Validation

Action setters clamp/coerce at the seam:

- `setRoundNumber` clamps to `[1, 8]`.
- `setWounds` clamps to `[0, 3]` (matches `Player.wounds` type `0 | 1 | 2 | 3`).
- `setShame` clamps to `>= 0`.
- `setCommit` accepts `Partial<Commit>` and merges into the existing commit for that player; passing `bullet: undefined` or `target: undefined` clears those fields. (We don't use `null` — `Commit` types its optional fields as `?:`.)
- `setStatus` accepts only `'alive' | 'dead'`.
- `setPhase` accepts only the six `RoundPhase` values.

Invalid-by-rules combinations (e.g. a `dead` player with a `commit`, a `withdrew: true` player with a `bullet` set, target = self) are **intentionally allowed** — the panel is for composing arbitrary visual states, including unreachable ones, to stress the UI.

## Error handling

There is none to add. No async, no I/O, no persistence. If a downstream component crashes on an unreachable state, that is a real bug worth surfacing in the UI we're building, not something to mask in the dev tool.

## Testing

- `useMockGameState.test.ts` — unit tests for each action:
  - `setPhase` updates `game.round.phase`.
  - `setRoundNumber` updates and clamps to `[1, 8]`.
  - `setCommit` performs partial merge; `bullet: undefined` clears it.
  - `setWounds` clamps to `[0, 3]`.
  - `setStatus` toggles between `alive` / `dead`.
  - `setShame` clamps to `>= 0`.
  - `reset` returns the exact initial `Game` (deep equal).
- `useDevPanelToggle.test.ts` — backtick on `window` toggles `open`; `Esc` closes when open and is a no-op when closed; both keys are ignored while an `<input>` is focused.
- **No** test for `DevControlsPanel.tsx`. It's DEV-only UI; testing it isn't worth the maintenance cost. Breakage will be caught by using it.

## Non-goals / explicit deferrals

- **No persistence** of either game state or panel-open state across reloads.
- **No** "run real resolver" button. The hooks expose action setters, not phase-transition runners. Adding option C is a separate, smaller piece of work.
- **No** scenario-preset library.
- **No** prod surface area: nothing under `src/components/dev/` is imported from any non-mock route, and `MockBigScreen` itself is already DEV-gated in `App.tsx`.
