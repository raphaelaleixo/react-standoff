# MockBoard Dev Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backtick-toggled drawer to `MockBigScreen` that lets a developer mutate the live `Game` value (round phase, round number, per-player commit/wounds/status/shame) for free-form visual iteration.

**Architecture:** A new DEV-only `src/components/dev/` directory with two hooks (`useMockGameState`, `useDevPanelToggle`) and one MUI Drawer component (`DevControlsPanel`). `MockBigScreen` wires them together; nothing else in the prod render path is touched. State is in-memory only — every reload restarts from `FIXTURE_GAME`.

**Tech Stack:** React 19, TypeScript (strict), MUI (Drawer, Button, ToggleButtonGroup, Select, Checkbox), Vitest + `@testing-library/react` (`renderHook`, `act`), existing `Game` types from `src/game/types.ts`.

**Spec:** [`docs/superpowers/specs/2026-05-04-mockboard-dev-controls-design.md`](../specs/2026-05-04-mockboard-dev-controls-design.md)

---

## File Structure

**New files:**
- `src/components/dev/useMockGameState.ts` — `useState<Game>` + immutable action setters + `reset`.
- `src/components/dev/useMockGameState.test.ts` — unit tests for each action and `reset`.
- `src/components/dev/useDevPanelToggle.ts` — `useState<boolean>` + `window` keydown listener (backtick toggles, Esc closes; both ignored when an editable element is focused).
- `src/components/dev/useDevPanelToggle.test.ts` — listener behavior tests.
- `src/components/dev/DevControlsPanel.tsx` — MUI `<Drawer>` UI consuming `{ game, actions, onClose }`.

**Modified files:**
- `src/pages/MockBigScreen.tsx` — replaces the hardcoded `FIXTURE_GAME` with `useMockGameState(FIXTURE_GAME)`, adds `useDevPanelToggle(true)`, renders `<DevControlsPanel>` alongside the existing `<PageCanvas>` content.

**Untouched:** all of `src/game/`, all of `src/components/` outside `dev/`, `App.tsx` (route already DEV-gated), every other page.

---

## Task 1: `useMockGameState` hook

**Files:**
- Create: `src/components/dev/useMockGameState.ts`
- Test: `src/components/dev/useMockGameState.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/dev/useMockGameState.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Game, Player } from "../../game/types";
import { useMockGameState } from "./useMockGameState";

const player = (id: string, overrides: Partial<Player> = {}): Player => ({
  id,
  displayName: id.toUpperCase(),
  colorOrAvatar: "blackbeard",
  bullets: [],
  cash: [],
  wounds: 0,
  shame: 0,
  status: "alive",
  effects: [],
  ...overrides,
});

const baseGame = (): Game => ({
  phase: "in_progress",
  players: [player("a"), player("b"), player("c")],
  round: {
    number: 2,
    phase: "commit",
    phaseStartedAt: 0,
    loot: [],
    commits: { a: { bullet: "bang", target: "b" } },
  },
  bankDeck: [],
  discardedBullets: [],
  seed: "test",
});

describe("useMockGameState", () => {
  test("exposes the initial game", () => {
    const initial = baseGame();
    const { result } = renderHook(() => useMockGameState(initial));
    expect(result.current.game).toEqual(initial);
  });

  test("setPhase updates round.phase", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setPhase("split"));
    expect(result.current.game.round.phase).toBe("split");
  });

  test("setRoundNumber clamps to [1, 8]", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setRoundNumber(5));
    expect(result.current.game.round.number).toBe(5);

    act(() => result.current.actions.setRoundNumber(0));
    expect(result.current.game.round.number).toBe(1);

    act(() => result.current.actions.setRoundNumber(99));
    expect(result.current.game.round.number).toBe(8);
  });

  test("setCommit merges partial commits and clears fields with undefined", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setCommit("a", { target: "c" }));
    expect(result.current.game.round.commits.a).toEqual({ bullet: "bang", target: "c" });

    act(() => result.current.actions.setCommit("a", { bullet: undefined }));
    expect(result.current.game.round.commits.a).toEqual({ target: "c" });

    act(() => result.current.actions.setCommit("b", { withdrew: true }));
    expect(result.current.game.round.commits.b).toEqual({ withdrew: true });
  });

  test("setWounds clamps to [0, 3]", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setWounds("a", 2));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(2);

    act(() => result.current.actions.setWounds("a", -1));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(0);

    act(() => result.current.actions.setWounds("a", 7));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(3);
  });

  test("setStatus toggles between alive and dead", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setStatus("a", "dead"));
    expect(result.current.game.players.find(p => p.id === "a")?.status).toBe("dead");
    act(() => result.current.actions.setStatus("a", "alive"));
    expect(result.current.game.players.find(p => p.id === "a")?.status).toBe("alive");
  });

  test("setShame clamps to >= 0", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setShame("a", 4));
    expect(result.current.game.players.find(p => p.id === "a")?.shame).toBe(4);
    act(() => result.current.actions.setShame("a", -3));
    expect(result.current.game.players.find(p => p.id === "a")?.shame).toBe(0);
  });

  test("reset returns the original game (deep equal)", () => {
    const initial = baseGame();
    const { result } = renderHook(() => useMockGameState(initial));

    act(() => {
      result.current.actions.setPhase("split");
      result.current.actions.setWounds("a", 3);
      result.current.actions.setStatus("b", "dead");
    });
    expect(result.current.game).not.toEqual(initial);

    act(() => result.current.actions.reset());
    expect(result.current.game).toEqual(initial);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/dev/useMockGameState.test.ts
```

Expected: all tests fail with "Cannot find module './useMockGameState'" (the file doesn't exist yet).

- [ ] **Step 3: Implement the hook**

Create `src/components/dev/useMockGameState.ts`:

```ts
import { useMemo, useState } from "react";
import type { BulletCard, Commit, Game, Player, RoundPhase } from "../../game/types";

export interface MockGameActions {
  setPhase(phase: RoundPhase): void;
  setRoundNumber(n: number): void;
  setCommit(playerId: string, partial: Partial<Commit>): void;
  setWounds(playerId: string, n: number): void;
  setStatus(playerId: string, status: Player["status"]): void;
  setShame(playerId: string, n: number): void;
  reset(): void;
}

export interface UseMockGameStateResult {
  game: Game;
  actions: MockGameActions;
}

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

const updatePlayer = (game: Game, playerId: string, patch: Partial<Player>): Game => ({
  ...game,
  players: game.players.map(p => (p.id === playerId ? { ...p, ...patch } : p)),
});

export function useMockGameState(initial: Game): UseMockGameStateResult {
  const [game, setGame] = useState<Game>(initial);

  const actions = useMemo<MockGameActions>(() => ({
    setPhase: (phase) =>
      setGame(g => ({ ...g, round: { ...g.round, phase } })),

    setRoundNumber: (n) =>
      setGame(g => ({ ...g, round: { ...g.round, number: clamp(Math.trunc(n), 1, 8) } })),

    setCommit: (playerId, partial) =>
      setGame(g => {
        const prev = g.round.commits[playerId] ?? {};
        const merged: Commit = { ...prev, ...partial };
        // Strip keys explicitly set to undefined so they don't linger as "present" in serialization.
        const next: Commit = {};
        if (merged.bullet !== undefined) next.bullet = merged.bullet as BulletCard;
        if (merged.target !== undefined) next.target = merged.target;
        if (merged.withdrew !== undefined) next.withdrew = merged.withdrew;
        return {
          ...g,
          round: { ...g.round, commits: { ...g.round.commits, [playerId]: next } },
        };
      }),

    setWounds: (playerId, n) => {
      const wounds = clamp(Math.trunc(n), 0, 3) as Player["wounds"];
      setGame(g => updatePlayer(g, playerId, { wounds }));
    },

    setStatus: (playerId, status) =>
      setGame(g => updatePlayer(g, playerId, { status })),

    setShame: (playerId, n) => {
      const shame = Math.max(Math.trunc(n), 0);
      setGame(g => updatePlayer(g, playerId, { shame }));
    },

    reset: () => setGame(initial),
  }), [initial]);

  return { game, actions };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/dev/useMockGameState.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dev/useMockGameState.ts src/components/dev/useMockGameState.test.ts
git commit -m "feat(dev): add useMockGameState hook for mock-board state mutation"
```

---

## Task 2: `useDevPanelToggle` hook

**Files:**
- Create: `src/components/dev/useDevPanelToggle.ts`
- Test: `src/components/dev/useDevPanelToggle.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/dev/useDevPanelToggle.test.ts`:

```ts
import { describe, expect, test, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevPanelToggle } from "./useDevPanelToggle";

const fireKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDevPanelToggle", () => {
  test("starts open when initialOpen=true", () => {
    const { result } = renderHook(() => useDevPanelToggle(true));
    expect(result.current.open).toBe(true);
  });

  test("starts closed when initialOpen=false", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));
    expect(result.current.open).toBe(false);
  });

  test("backtick toggles open/closed", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));
    expect(result.current.open).toBe(false);

    act(() => fireKey("`"));
    expect(result.current.open).toBe(true);

    act(() => fireKey("`"));
    expect(result.current.open).toBe(false);
  });

  test("Escape closes when open and is a no-op when closed", () => {
    const { result } = renderHook(() => useDevPanelToggle(true));
    expect(result.current.open).toBe(true);

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(false);

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(false);
  });

  test("ignores backtick and Escape when an <input> is focused", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    const { result } = renderHook(() => useDevPanelToggle(true));

    act(() => fireKey("`"));
    expect(result.current.open).toBe(true); // unchanged

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(true); // unchanged
  });

  test("ignores backtick when a contenteditable element is focused", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();

    const { result } = renderHook(() => useDevPanelToggle(false));
    act(() => fireKey("`"));
    expect(result.current.open).toBe(false);
  });

  test("setOpen and toggle work programmatically", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));

    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/dev/useDevPanelToggle.test.ts
```

Expected: all tests fail because the module doesn't exist.

- [ ] **Step 3: Implement the hook**

Create `src/components/dev/useDevPanelToggle.ts`:

```ts
import { useCallback, useEffect, useState } from "react";

export interface UseDevPanelToggleResult {
  open: boolean;
  setOpen(next: boolean): void;
  toggle(): void;
}

const isEditableTarget = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLInputElement) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return false;
};

export function useDevPanelToggle(initialOpen = true): UseDevPanelToggleResult {
  const [open, setOpen] = useState<boolean>(initialOpen);

  const toggle = useCallback(() => setOpen(o => !o), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(document.activeElement)) return;
      if (event.key === "`") {
        event.preventDefault();
        setOpen(o => !o);
      } else if (event.key === "Escape") {
        setOpen(o => (o ? false : o));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen, toggle };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/dev/useDevPanelToggle.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dev/useDevPanelToggle.ts src/components/dev/useDevPanelToggle.test.ts
git commit -m "feat(dev): add useDevPanelToggle with backtick/Esc keyboard handling"
```

---

## Task 3: `DevControlsPanel` component

**Files:**
- Create: `src/components/dev/DevControlsPanel.tsx`

This is DEV-only UI; per the spec we deliberately skip a unit test for it.

- [ ] **Step 1: Implement the panel**

Create `src/components/dev/DevControlsPanel.tsx`:

```tsx
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { BulletCard, Game, RoundPhase } from "../../game/types";
import type { MockGameActions } from "./useMockGameState";

const PHASES: RoundPhase[] = [
  "commit",
  "standoff",
  "withdraw",
  "reveal_bbb",
  "reveal_others",
  "split",
];

const BULLETS: Array<BulletCard | "none"> = ["none", "clic", "bang", "bang_bang_bang"];
const WOUNDS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

interface DevControlsPanelProps {
  open: boolean;
  game: Game;
  actions: MockGameActions;
  onClose(): void;
}

export function DevControlsPanel({ open, game, actions, onClose }: DevControlsPanelProps) {
  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={open}
      PaperProps={{ sx: { width: 360, padding: 2 } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Dev Controls</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={actions.reset}>
            Reset
          </Button>
          <IconButton size="small" onClick={onClose} aria-label="Close dev controls">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ overflowY: "auto", flex: 1 }}>
        <Section title="Round">
          <Typography variant="caption">Phase</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={game.round.phase}
            onChange={(_, value: RoundPhase | null) => value && actions.setPhase(value)}
            sx={{ flexWrap: "wrap", mt: 0.5 }}
          >
            {PHASES.map(p => (
              <ToggleButton key={p} value={p} sx={{ textTransform: "none" }}>
                {p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
            <Typography variant="caption" sx={{ minWidth: 56 }}>Round #</Typography>
            <Button size="small" variant="outlined" onClick={() => actions.setRoundNumber(game.round.number - 1)}>−</Button>
            <Typography sx={{ minWidth: 24, textAlign: "center" }}>{game.round.number}</Typography>
            <Button size="small" variant="outlined" onClick={() => actions.setRoundNumber(game.round.number + 1)}>+</Button>
          </Stack>
        </Section>

        <Section title="Players">
          <Stack spacing={2}>
            {game.players.map(player => {
              const commit = game.round.commits[player.id] ?? {};
              const targetOptions = game.players.filter(p => p.id !== player.id);
              return (
                <Box key={player.id} sx={{ borderTop: "1px solid rgba(0,0,0,0.12)", pt: 1 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{player.displayName}</Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={player.status}
                      onChange={(_, value) => value && actions.setStatus(player.id, value)}
                    >
                      <ToggleButton value="alive">alive</ToggleButton>
                      <ToggleButton value="dead">dead</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Wounds</Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={player.wounds}
                      onChange={(_, value: 0 | 1 | 2 | 3 | null) => value !== null && actions.setWounds(player.id, value)}
                    >
                      {WOUNDS.map(w => (
                        <ToggleButton key={w} value={w}>{w}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Shame</Typography>
                    <Button size="small" variant="outlined" onClick={() => actions.setShame(player.id, player.shame - 1)}>−</Button>
                    <Typography sx={{ minWidth: 24, textAlign: "center" }}>{player.shame}</Typography>
                    <Button size="small" variant="outlined" onClick={() => actions.setShame(player.id, player.shame + 1)}>+</Button>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Bullet</Typography>
                    <Select
                      size="small"
                      value={commit.bullet ?? "none"}
                      onChange={e => {
                        const value = e.target.value as BulletCard | "none";
                        actions.setCommit(player.id, { bullet: value === "none" ? undefined : value });
                      }}
                      sx={{ flex: 1 }}
                    >
                      {BULLETS.map(b => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                    <Typography variant="caption" sx={{ minWidth: 56 }}>Target</Typography>
                    <Select
                      size="small"
                      value={commit.target ?? "none"}
                      onChange={e => {
                        const value = e.target.value;
                        actions.setCommit(player.id, { target: value === "none" ? undefined : value });
                      }}
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value="none">none</MenuItem>
                      {targetOptions.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.displayName}</MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={!!commit.withdrew}
                        onChange={e => actions.setCommit(player.id, { withdrew: e.target.checked || undefined })}
                      />
                    }
                    label={<Typography variant="caption">Withdrew</Typography>}
                  />
                </Box>
              );
            })}
          </Stack>
        </Section>
      </Box>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Box>{children}</Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
npx tsc -b
```

Expected: clean exit (no TS errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/dev/DevControlsPanel.tsx
git commit -m "feat(dev): add DevControlsPanel drawer for mock-board mutation"
```

---

## Task 4: Wire panel into `MockBigScreen`

**Files:**
- Modify: `src/pages/MockBigScreen.tsx`

- [ ] **Step 1: Update `MockBigScreen` to consume the hooks and render the drawer**

Replace the entire body of `src/pages/MockBigScreen.tsx` with:

```tsx
// DEV-only mock for the big-screen view. Renders the new GameBoard with
// fixture data so you can iterate on layout without a live room.
import { Box } from "@mui/material";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { navyHoursLabel } from "../lib/navyHours";
import type { Game, Player } from "../game/types";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel } from "../components/dev/DevControlsPanel";

const PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",  bullets: ["bang","clic","clic","clic","clic","bang","bang_bang_bang"], cash: [{ id: "bn-a1", value: 10000 }, { id: "bn-a2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",   bullets: [], cash: [{ id: "bn-b1", value: 20000 }, { id: "bn-b2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",   bullets: [], cash: [{ id: "bn-c1", value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ id: "bn-d1", value: 20000 }, { id: "bn-d2", value: 5000 }], wounds: 2, shame: 1, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart",   bullets: [], cash: [{ id: "bn-e1", value: 10000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery",  bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
];

const FIXTURE_GAME: Game = {
  seed: "mock",
  players: PLAYERS,
  round: {
    number: 3,
    phase: "withdraw",
    phaseStartedAt: 0,
    loot: [
      { id: "loot-1", value: 20000 },
      { id: "loot-2", value: 10000 },
      { id: "loot-3", value: 10000 },
      { id: "loot-4", value: 5000 },
      { id: "loot-5", value: 5000 },
    ],
    commits: {
      a: { bullet: "bang", target: "c" },
      b: { bullet: "bang_bang_bang", target: "a" },
      c: { bullet: "bang", target: "e" },
      d: { bullet: "bang", target: "b" },
      e: { bullet: "clic", target: "f" },
      f: { withdrew: true, bullet: "clic", target: "a" },
    },
  },
  bankDeck: [],
  discardedBullets: [],
  phase: "in_progress",
};

export default function MockBigScreen() {
  const { game, actions } = useMockGameState(FIXTURE_GAME);
  const { open, setOpen } = useDevPanelToggle(true);

  const aliveCount = game.players.filter(p => p.status === "alive").length;
  const deadCount = game.players.filter(p => p.status === "dead").length;
  const yieldedCount = Object.values(game.round.commits).filter(c => c.withdrew).length;

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>ROUND <em>{game.round.number} of VIII</em></>}
          right={<>PHASE <em>{game.round.phase}</em></>}
        />
        <GameBoard game={game} />
        <Foot
          left={`${aliveCount} ALIVE · ${yieldedCount} YIELDED · ${deadCount} DEAD`}
          cry={navyHoursLabel(game.round.number)}
          right="NEXT · WHO SHALL FALL?"
        />
      </PageCanvas>
      <DevControlsPanel
        open={open}
        game={game}
        actions={actions}
        onClose={() => setOpen(false)}
      />
    </Box>
  );
}
```

Rationale for the masthead/foot tweaks: those strings used to be hardcoded (`III of VIII`, `VI ALIVE · I YIELDED · 0 DEAD`); now that state is mutable, the display has to track it or the panel will look broken when you change phase/wounds/etc.

- [ ] **Step 2: Type-check the project**

```bash
npx tsc -b
```

Expected: clean exit.

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (existing + the two new hook test files).

- [ ] **Step 4: Manual verification in the browser**

```bash
npm run dev
```

Open `http://localhost:5173/mock/big-screen/test` and verify each of the following by hand:

1. Drawer is visible on the right edge on first load.
2. Press backtick — drawer disappears entirely (no rail / no chevron).
3. Press backtick again — drawer reappears.
4. Open the drawer; press `Esc` — drawer closes.
5. Click each phase button in the segmented control — the masthead's `PHASE` value updates and the canvas reflects the change.
6. Click `+` / `−` on round number — masthead's `ROUND` value updates; clamped at 1 and 8.
7. For one player, change Wounds from 0 → 3 — the crew roster reflects it.
8. Toggle a player's status to `dead` — the crew roster updates and the foot summary count updates.
9. Change a player's Bullet and Target — the targeting map / commit display updates.
10. Click a text input inside the drawer (e.g. focus a Select), then press backtick on the keyboard — drawer should NOT close (focus on a form control suppresses the toggle). *Note: MUI Selects use a button trigger, not an `<input>` — the suppressed-keypress check applies when MUI opens its menu; if this is awkward in practice we can revisit, but the listener already gates on `<input>`/`<textarea>`/contenteditable.*
11. Click "Reset" — the canvas snaps back to the original fixture (Round 3, withdraw phase, original commits).

If any step fails, fix and re-verify before committing.

- [ ] **Step 5: Commit**

```bash
git add src/pages/MockBigScreen.tsx
git commit -m "feat(mock): wire DevControlsPanel into MockBigScreen"
```

---

## Self-Review

Spec coverage check (from `2026-05-04-mockboard-dev-controls-design.md`):

- ✅ Round phase knob — Task 1 (action) + Task 3 (UI) + Task 4 (live binding to masthead).
- ✅ Round number knob — Task 1 + Task 3 + Task 4.
- ✅ Per-player commit (bullet/target/withdrew) — Task 1 + Task 3.
- ✅ Per-player wounds — Task 1 + Task 3.
- ✅ Per-player status (alive/dead) — Task 1 + Task 3 + Task 4 (foot count).
- ✅ Per-player shame — Task 1 + Task 3.
- ✅ Drawer right anchor, persistent variant, no backdrop — Task 3.
- ✅ Closed = no UI at all — Task 3 (`<Drawer>` `open={false}` unmounts paper).
- ✅ Default open on first render — Task 4 (`useDevPanelToggle(true)`).
- ✅ Backtick toggle, Esc close, ignore when editable focused — Task 2.
- ✅ `×` close button — Task 3.
- ✅ Reset to fixture — Task 1 (action) + Task 3 (button).
- ✅ Per-action clamping — Task 1 tests + impl.
- ✅ No persistence — none of the tasks introduces storage.
- ✅ DEV-only — everything lives under `src/components/dev/`; route already DEV-gated in `App.tsx`.
- ✅ Tests on both hooks; no test on `DevControlsPanel.tsx` — explicit per spec.
