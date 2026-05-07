# Design overhaul implementation plan — Part 2 (Stages 2–9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Continuation of:** `docs/superpowers/plans/2026-05-04-design-overhaul.md` — Stages 0 and 1 already shipped.

**Spec:** `docs/superpowers/specs/2026-05-04-design-overhaul-design.md`. Read it before starting.

**Goal:** Finish the Standoff visual overhaul by adding dramatic moments to the in-game ledger, rebuilding the lobby and end-game screens, redoing the phone surfaces, and tidying static pages — on top of the dark broadside foundation already shipped in Part 1.

**Architecture:** Stage 2 layers in-place dramatic moments (standoff stamp + reveal banner + line glow + fresh-pip pulse) on the in-game ledger. Stages 3 and 4 wrap the big screen with the broadside-styled lobby (THE MUSTER) and end-game (THE RECKONING). Stages 5 and 6 build the phone — shell + commit-phase hand, then standoff/yield/spectator phases. Stage 7 redoes player join. Stage 8 brushes the static pages (Home, HowToPlay, Join). Stage 9 deletes obsolete components.

**Tech Stack:** React 19 + TypeScript (strict). Vite, MUI, Emotion, react-router-dom, react-gameroom, Firebase RTDB, i18next, Vitest + @testing-library/react. No new dependencies.

---

## What Part 1 already shipped

### Stage 0 — Foundations
Commits: `8d50770` typography/theme/fonts, `82ebc7a`+`77d7f46` `PageCanvas`, `4dd0c83`+`96c511e` `Button`, `0d93d20` `Masthead`, `8367b98` `Foot`, `127f130` `DenominationIcon`.

- Dark broadside palette (`src/theme/colors.ts`) — `ink`/`inkDeep`/`inkUp`/`paper`/`paperDim`/`paperFaint`/`rule`/`ruleStrong`/`blood`/`gold`/`goldDeep`/`yellow`/`jewelPurple`/`silverGray` plus `flagSignatureColors` map and `flagColor()` helper.
- Typography (`src/theme/typography.ts`) — `fonts.{blackletter, displayCaps, body, bodySc}` over UnifrakturCook + IM Fell DW Pica SC + IM Fell English + IM Fell English SC. Pirata One has been removed.
- Shell components: `<PageCanvas>` (grain + warm-light corner spills), `<Button>` (primary/ghost/text + focus-visible), `<Masthead>`/`<Foot>` (3-slot blackletter headers/footers).
- `<DenominationIcon>` for silver/gold/jewel banknote chips, plus `Denomination` type re-exported from `src/game/types.ts`.

### Stage 1 — In-game ledger
Commits: `5409527`+`66aef47` `HoardItem`, `3aaf06a` `HoardList`, `99b406d` `Roundel`, `b65d837` `geometry`, `338a03f`+`5f5ce2c` `TargetingMap`, `af5b706`+`75099e7` `CrewRow`, `bb1a2db`+`96a3604` `CrewRoster`, `db6a5ca` `GameBoard` refactor + `navyHours`, `c8afbc7` `MockBigScreen` rebuild.

- Hoard column: `<HoardItem>` (per-banknote row with carry-over hatching) + `<HoardList>` (full column). Header reads "THE HOARD / spoils on the table".
- Targeting map: `<Roundel>` (flag cartouche, live/dim/ducked states) + `seatPositions(n, radius)` and `pairGeometry(positions)` in `src/components/standoff/geometry.ts` + `<TargetingMap>` (hex of roundels with SVG lines, blood-color arrows, gaussian-blur glow filter, **instance-scoped marker/filter IDs via `useId()`** so two maps can mount at once).
- Crew column: `<CrewRow>` (status pill, wound pips with `data-pip` attr, stash composition, optional YELLOW ×N chip; `out` styled distinct from `choosing`; dead opacity does not compound) + `<CrewRoster>` with `deriveStatus(game, p, fresh)` covering all 7 statuses.
- `<GameBoard>` rebuilt as a thin 25/50/25 orchestrator (no more chest, no more hex layout in this file).
- `RoomPage`'s `GameView` switched to a `<PageCanvas aspectRatio="16/9">` shell with `<Masthead>` (`ROUND I/VIII`, `PHASE …`) + `<GameBoard>` + `<Foot>` (alive/yielded/dead counts, navy-hours cry, "NEXT · WHO SHALL FALL?"). Old helpers `Countdown`, `CountdownTicker`, `PrevRoundSummary`, `ShotLog`, `outcomeLabel` are deleted from this file. `PlayerCard` and `totalScore` are kept for the legacy `ended` branch (replaced by Stage 4's RECKONING screen).
- `src/lib/navyHours.ts` — `navyHoursLabel(round)` and `toRoman(n)` helpers.
- `MockBigScreen` rebuilt as the visual harness; routed under `/mock/big-screen/:id` in DEV.

---

## Known follow-ups carried over from Part 1 reviews

These were flagged during the Stage 1 quality reviews and explicitly deferred. Fold them into the relevant later tasks rather than letting them rot.

- **i18n cleanup for the in-game shell.** `Masthead` and `Foot` strings (`"ROUND"`, `"of VIII"`, `"PHASE"`, `"NEXT · WHO SHALL FALL?"`) and `navyHoursLabel` bypass `t(...)`, while the codebase uses i18next consistently and `navy.navyHours` is **already a key** in `src/locales/en.json`. Fold into Stage 2 (RevealBanner/StandoffStamp will touch the same shell components). Pass `t` into `navyHoursLabel` (or convert to a hook) and translate the masthead/foot strings.
- **Move player counts to `src/lib/`.** `countAlive` / `countYielded` / `countDead` currently live at module scope in `RoomPage.tsx`. Stage 2's `RevealBanner` and Stage 4's RECKONING screen will both need them. Extract to `src/lib/playerCounts.ts` on first reuse.
- **`MockBigScreen.phaseStartedAt: 0`** will render as a 56-year-old timer once Stage 2 wires a live ticker. Set to `Date.now()` at module load when Stage 2 lands (or when needed by the visual harness).
- **`navyHours.toRoman` fallback.** No test asserts `toRoman(9) === "9"`. Add a fourth test if you touch the file.

---

## File structure (carried over from Part 1)

### Files still to create

```
src/components/shell/
  PhoneShell.tsx                  # phone-shaped PageCanvas + header strip
  PhoneShell.test.tsx
src/components/standoff/
  StandoffStamp.tsx               # countdown numeral overlay
  StandoffStamp.test.tsx
  RevealBanner.tsx                # broadside / kill banner
  RevealBanner.test.tsx
src/components/phone/
  PowderCard.tsx                  # 1 of 8 hand cards
  PowderCard.test.tsx
  Hand.tsx                        # 4×2 grid of PowderCards
  Hand.test.tsx
  TargetList.tsx                  # opponent picker on commit
  TargetList.test.tsx
  Barrel.tsx                      # flintlock muzzle (replaces FlintlockBarrel)
  Barrel.test.tsx
  YieldRibbon.tsx                 # yellow notched ribbon (replaces YieldButton)
  YieldRibbon.test.tsx
  Spectator.tsx                   # read-only mirror for reveal/eliminated
  Spectator.test.tsx
src/components/screens/
  MusterScreen.tsx                # big-screen lobby
  MusterScreen.test.tsx
  ReckoningScreen.tsx             # big-screen end-game
  ReckoningScreen.test.tsx
  EndGameRow.tsx                  # one ranked row in the reckoning
  EndGameRow.test.tsx
src/components/flags/
  FlagPickerGrid.tsx              # 3-up flag selector
  FlagPickerGrid.test.tsx
src/lib/
  playerCounts.ts                 # countAlive/countYielded/countDead (extracted)
  playerCounts.test.ts
```

### Files to modify

```
src/i18n.ts                       # unchanged shape — bundle still imports en.json
src/locales/en.json               # broadside copy + quickdraw rename + new strings
src/pages/RoomPage.tsx            # lobby/end-game branches use new screens; foot/masthead use t(...)
src/pages/PlayerPage.tsx          # phase-by-phase rewrite using new phone components
src/pages/PlayerJoinPage.tsx      # uses FlagPickerGrid, PhoneShell
src/pages/HomePage.tsx            # broadside style
src/pages/HowToPlayPage.tsx       # broadside ballad layout
src/pages/JoinPage.tsx            # broadside style
src/pages/MockBigScreen.tsx       # phaseStartedAt: Date.now() once Stage 2 lands
src/lib/navyHours.ts              # accept t (or convert to hook) for i18n
src/components/shell/Masthead.tsx # i18n if not already
src/components/shell/Foot.tsx     # i18n if not already
```

### Files to delete (Stage 9)

```
src/components/loot/CaptainsChest.tsx
src/components/loot/Coin.tsx
src/components/loot/                 # whole directory — no chest, no coin
src/components/MapFrame.tsx
src/components/FlintlockBarrel.tsx
src/components/YieldButton.tsx
src/components/PowderLoadCard.tsx
src/components/RevealOverlay.tsx     # superseded by Stage 2 RevealBanner
```

---

## Conventions

- All component tests use `@testing-library/react`. Setup at `src/test-setup.ts` wired through `vite.config.ts`. **Vitest globals are enabled** — never add `import { describe, it, expect, vi }` to test files.
- Test commands: `npm test -- <path> --run` for one file, `npm test` for the whole suite.
- Each task ends with a commit. `type(scope): subject` style (e.g. `feat(phone)`, `refactor(big-screen)`).
- TDD for logic-bearing components. Pure-presentation tasks skip the test cycle but verify with `npm test` + `npm run build`.
- Visual fidelity is verified by running `npm run dev` and inspecting `MockBigScreen` (DEV-only route at `/mock/big-screen/:id`).
- **Real-shape constants** (the spec was authored against an imagined `Game` shape; adjust fixtures to match):
  - `Game` has no `roomId` field — drop it from any fixture.
  - `GamePhase = "lobby" | "in_progress" | "ended"` — never `"playing"`.
  - `Banknote = { id: string; value: 5000 | 10000 | 20000 }` — `id` is required. Use `bn-{playerId}{n}` / `loot-{n}` patterns.
  - `Player.wounds: 0 | 1 | 2 | 3` — literal union, may need `as const` in fixtures.
  - `Player.status: "alive" | "dead"` — no `"yielded"`. Withdraw state is tracked on `game.round.commits[id]?.withdrew`.
  - `BulletCard = "clic" | "bang" | "bang_bang_bang"` — strings, not objects.
  - `RoundPhase = "commit" | "standoff" | "withdraw" | "reveal_bbb" | "reveal_others" | "split"`.

---

## Stage 2 — Dramatic moments — ✅ DONE (with deviations)

Layer in the standoff countdown stamp, the in-place reveal banner, and the line-glow + fresh-pip animations. After Stage 2 the in-game screen has its TV-moment behaviour.

> **Status as of 2026-05-07:** Stage 2 is shipped. The implementation diverged from the spec — flagging the diffs here so future readers don't get confused by the unchecked task boxes below.
>
> **Deviations from the original spec:**
> - **`<RevealBanner>` was replaced by `<RevealStamp>`** (commit `c5243d0`). The red corner-banner with broadside/kill copy was reworked into a centred QUICKDRAW! / SHOTS stamp that matches the visual language of `<StandoffStamp>` and `<WithdrawStamp>`. The static phase-keyed label superseded the data-derived banner kind.
> - **Task 2.5 (`useRevealBanner`) was abandoned** as a consequence — `<RevealStamp>` reads its label from a `Partial<Record<RoundPhase, string>>` lookup in `<GameBoard>` rather than from a derivation hook over the resolution. No kill-banner variant was built; eliminations are conveyed by the dead crew row and (later) the RECKONING screen.
>
> **Added beyond the plan:**
> - `<WithdrawStamp>` (commits `4db8027`, `7842887`) — countdown numeral over the map during the yield window, mirrors the standoff stamp.
> - `<BloodSplatter>` + procedural-per-player splatter behind struck roundels (commits `f422e2a` → `be4e531`).
> - Line draw-in animation via SVG mask, with arrow-fills wiping in red as ink arrives (commits `2a24c80`, `b681079`, `53ce40f`, `fa55f41`).
> - End-of-round fade-out on the lines from `reveal_others` → `split` (commit `88ce8c5`).
> - Hoard banknote drop-in / fade-out at split, with crew-cash tick-up (commits `f336a16`, `a7e637a`, `868e213`, `cab639b`).
> - **`standoff_hold` round phase** — silent 2s beat between the standoff count and the yield countdown, where the targeting lines draw in. Required additions to `RoundPhase`, `phaseDurations`, `useGameState`, `TargetingMap`, `CrewRoster`, `DevControlsPanel`, `MockBigScreen`, `PlayerPage`. Also fixed a stale-timestamp bug in `useSecondsRemaining` / `useStandoffCount` and the resolution-apply timing in `useGameState` (resolution now lands at split, not reveal entry, so reveal-phase visual deltas don't double-count).
> - Per-color jolly roger silhouettes for the central targeting roundels and crew-row flags.
>
> **Carried-over follow-ups still open:** the i18n cleanup for the in-game shell strings (`Masthead`/`Foot`/`navyHoursLabel`) noted at the top of this plan was not absorbed into Stage 2 — fold into Stage 3 (Task 3.1 is already i18n-shaped).

### Task 2.1: `<StandoffStamp>` — ✅ done

**Files:**
- Create: `src/components/standoff/StandoffStamp.tsx`
- Create: `src/components/standoff/StandoffStamp.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { StandoffStamp } from "./StandoffStamp";

describe("StandoffStamp", () => {
  it("renders the count numeral", () => {
    render(<StandoffStamp count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
  it("renders the eyebrow and the cry", () => {
    render(<StandoffStamp count={2} />);
    expect(screen.getByText(/AT THE COUNT OF/)).toBeInTheDocument();
    expect(screen.getByText(/STAND\./)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/standoff/StandoffStamp.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface StandoffStampProps {
  count: number;
}

export function StandoffStamp({ count }: StandoffStampProps) {
  return (
    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 5 }}>
      <Box sx={{ textAlign: "center", position: "relative" }}>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontSize: "0.95rem",
            letterSpacing: "0.6em",
            color: palette.paperDim,
            marginBottom: "0.3rem",
          }}
        >
          — AT THE COUNT OF —
        </Box>
        <Box sx={{ position: "relative", display: "inline-block" }}>
          {/* concentric ink-stamp circles */}
          <Box sx={{ position: "absolute", inset: "-1.5rem -2rem", border: `6px solid ${palette.paper}`, borderRadius: "50%", transform: "rotate(-3deg)", opacity: 0.6 }} />
          <Box sx={{ position: "absolute", inset: "-2.6rem -3.2rem", border: `2.5px solid ${palette.paper}`, borderRadius: "50%", transform: "rotate(-3deg)", opacity: 0.4 }} />
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontSize: "18rem",
              lineHeight: 0.85,
              color: palette.paper,
              textShadow: "0 0 24px rgba(255, 195, 120, 0.25)",
            }}
          >
            {count}
          </Box>
        </Box>
        <Box
          sx={{
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: "1.05rem",
            letterSpacing: "0.05em",
            color: palette.paperDim,
            marginTop: "0.5rem",
          }}
        >
          three… two… one…{" "}
          <Box component="span" sx={{ fontFamily: fonts.displayCaps, fontStyle: "normal", letterSpacing: "0.3em", color: palette.blood }}>
            STAND.
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/standoff/StandoffStamp.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/standoff/StandoffStamp.tsx src/components/standoff/StandoffStamp.test.tsx
git commit -m "feat(standoff): add StandoffStamp countdown overlay"
```

### Task 2.2: `<RevealBanner>` — ❌ superseded by `<RevealStamp>`

Built differently (see Stage-2 deviations note above). The red corner-banner spec below was discarded in favour of a centred phase-keyed stamp matching the standoff/withdraw stamps. Steps below are **kept for historical reference only** — do not re-execute.

**Files:**
- Create: `src/components/standoff/RevealBanner.tsx`
- Create: `src/components/standoff/RevealBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { RevealBanner } from "./RevealBanner";

describe("RevealBanner", () => {
  it("renders the broadside banner with subline", () => {
    render(<RevealBanner kind="broadside" struckCount={2} />);
    expect(screen.getByText(/BROADSIDE/)).toBeInTheDocument();
    expect(screen.getByText(/2 struck/i)).toBeInTheDocument();
  });

  it("renders a kill banner with the player name", () => {
    render(<RevealBanner kind="kill" name="Stede Bonnet" />);
    expect(screen.getByText(/WALKED THE PLANK/)).toBeInTheDocument();
    expect(screen.getByText(/Stede Bonnet/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/standoff/RevealBanner.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Kind = "broadside" | "kill";

interface RevealBannerProps {
  kind: Kind;
  struckCount?: number;
  name?: string;
}

export function RevealBanner({ kind, struckCount, name }: RevealBannerProps) {
  const headline = kind === "broadside" ? "BROADSIDE!" : "— WALKED THE PLANK —";
  const sub = kind === "broadside"
    ? `they double-loaded the powder · ${struckCount ?? 0} struck`
    : name ?? "";
  return (
    <Box
      role="alert"
      sx={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        background: palette.blood,
        color: palette.paper,
        padding: "0.5rem 1.6rem",
        border: `3px solid ${palette.paper}`,
        boxShadow: `0 0 0 4px ${palette.blood}, 6px 6px 0 ${palette.inkDeep}`,
        textAlign: "center",
        fontFamily: fonts.displayCaps,
        fontSize: "1.6rem",
        letterSpacing: "0.32em",
      }}
    >
      {headline}
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          marginTop: "0.1rem",
          fontWeight: 400,
        }}
      >
        {sub}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/standoff/RevealBanner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/standoff/RevealBanner.tsx src/components/standoff/RevealBanner.test.tsx
git commit -m "feat(standoff): add RevealBanner for broadside and kill moments"
```

### Task 2.3: Wire `<StandoffStamp>` into the GameBoard middle column during phase 2 — ✅ done

**Files:**
- Modify: `src/components/GameBoard.tsx`
- Create: `src/hooks/useStandoffCount.ts`
- Create: `src/hooks/useStandoffCount.test.ts`

- [ ] **Step 1: Write the failing test for the hook**

```ts
import { renderHook, act } from "@testing-library/react";
import { useStandoffCount } from "./useStandoffCount";

describe("useStandoffCount", () => {
  it("returns null when not in standoff phase", () => {
    const { result } = renderHook(() => useStandoffCount({ active: false, durationMs: 4000, startedAt: 0 }));
    expect(result.current).toBeNull();
  });

  it("counts down from 3 in 4s steps when active", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    const { result, rerender } = renderHook(() => useStandoffCount({ active: true, durationMs: 4000, startedAt }));
    expect(result.current).toBe(3);
    act(() => { vi.advanceTimersByTime(1100); });
    rerender();
    expect(result.current).toBe(2);
    act(() => { vi.advanceTimersByTime(1100); });
    rerender();
    expect(result.current).toBe(1);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/hooks/useStandoffCount.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useStandoffCount.ts`:

```ts
import { useEffect, useState } from "react";

interface Args {
  active: boolean;
  startedAt: number; // server-time ms
  durationMs: number;
}

export function useStandoffCount({ active, startedAt, durationMs }: Args): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  const elapsed = now - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  // Bucket into 3 / 2 / 1 over the duration. Last second hits 0; cap to 1 minimum
  // until the phase transitions out (so the stamp keeps reading "1" rather than blank).
  const stepMs = durationMs / 3;
  const step = Math.max(1, Math.ceil(remaining / stepMs));
  return Math.min(3, step);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/hooks/useStandoffCount.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `<StandoffStamp>` into `<GameBoard>` middle column**

Update `src/components/GameBoard.tsx` to overlay the stamp during the standoff phase. Replace the middle column block:

```tsx
import { StandoffStamp } from "./standoff/StandoffStamp";
import { useStandoffCount } from "../hooks/useStandoffCount";

// ... inside GameBoard ...
const inStandoff = game.round.phase === "standoff";
const count = useStandoffCount({
  active: inStandoff,
  startedAt: game.round.phaseStartedAt,
  durationMs: 4000,
});
```

Replace the middle-column `<Box>` with:

```tsx
<Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0, position: "relative" }}>
  <TargetingMap game={game} dim={inStandoff} />
  {inStandoff && count !== null && <StandoffStamp count={count} />}
</Box>
```

- [ ] **Step 6: Verify build + tests still pass**

Run: `npm run build && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/GameBoard.tsx src/hooks/useStandoffCount.ts src/hooks/useStandoffCount.test.ts
git commit -m "feat(standoff): overlay StandoffStamp on the map during phase 2"
```

### Task 2.4: Wire `<RevealBanner>` during reveal phases — ✅ done as `<RevealStamp>`

Wired in `<GameBoard>` via a `Partial<Record<RoundPhase, string>>` lookup (`reveal_bbb` → "Quickdraw!", `reveal_others` → "Shots"), faded with the same `Fade` wrapper used by the standoff/withdraw stamps. No props passed from `RoomPage`. Steps below are kept for historical reference only.

**Files:**
- Modify: `src/components/GameBoard.tsx`
- Modify: `src/pages/MockBigScreen.tsx`

- [ ] **Step 1: Update `<GameBoard>` to render the banner above the columns**

Add the banner as a sibling of the columns grid. The reveal banner only shows when:
- phase === "reveal_bbb" → broadside banner with the count of struck players
- a player just transitioned to dead during phase 4 or 5 → kill banner

For now, expose this through props so the parent decides:

```tsx
import { RevealBanner } from "./standoff/RevealBanner";

interface GameBoardProps {
  game: Game;
  freshlyStruck?: Set<string>;
  banner?: { kind: "broadside"; struckCount: number } | { kind: "kill"; name: string } | null;
}

export function GameBoard({ game, freshlyStruck, banner }: GameBoardProps) {
  // ... existing logic ...
  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {banner && (
        banner.kind === "broadside"
          ? <RevealBanner kind="broadside" struckCount={banner.struckCount} />
          : <RevealBanner kind="kill" name={banner.name} />
      )}
      {/* columns grid as before */}
    </Box>
  );
}
```

- [ ] **Step 2: Verify in MockBigScreen by setting a banner**

Update `MockBigScreen.tsx` temporarily to pass a banner so you can see it. Example:

```tsx
<GameBoard game={FIXTURE_GAME} banner={{ kind: "broadside", struckCount: 2 }} />
```

Run dev server, verify the banner sits at the top of the columns area (~10% from top), red, paper border, ink shadow.

Revert the banner prop to `null` (or omit) before committing.

- [ ] **Step 3: Run build + tests**

Run: `npm run build && npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameBoard.tsx src/pages/MockBigScreen.tsx
git commit -m "feat(big-screen): wire RevealBanner into GameBoard via prop"
```

### Task 2.5: Reveal-phase banner derivation in RoomPage — ❌ abandoned

Obsoleted when `<RevealBanner>` was reworked into the static-label `<RevealStamp>` (see Task 2.2). No `useRevealBanner` hook was built; eliminations are not announced by a banner — they're shown via the dead crew row and (later) the RECKONING end-game screen. Steps below kept for historical reference only.

**Files:**
- Modify: `src/pages/RoomPage.tsx`
- Create: `src/hooks/useRevealBanner.ts`
- Create: `src/hooks/useRevealBanner.test.ts`

- [ ] **Step 1: Write failing test for the hook**

```ts
import { renderHook } from "@testing-library/react";
import { useRevealBanner } from "./useRevealBanner";
import type { Game } from "../game/types";

const baseGame: Game = {
  seed: "x", roomId: "x",
  players: [
    { id: "a", displayName: "A", colorOrAvatar: "generic", bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
    { id: "b", displayName: "B", colorOrAvatar: "generic", bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
  ],
  round: {
    number: 1, phase: "reveal_bbb", phaseStartedAt: 0,
    loot: [], commits: {},
    resolution: { shots: [{ shooter: "a", target: "b", card: "bang_bang_bang", outcome: "hit" }], ducks: [], eliminated: [] },
  },
  bankDeck: [], discardedBullets: [], phase: "playing",
};

describe("useRevealBanner", () => {
  it("returns broadside banner during reveal_bbb when bbb hits exist", () => {
    const { result } = renderHook(() => useRevealBanner(baseGame));
    expect(result.current).toEqual({ kind: "broadside", struckCount: 1 });
  });

  it("returns null when phase is not a reveal", () => {
    const g = { ...baseGame, round: { ...baseGame.round, phase: "commit" as const } };
    const { result } = renderHook(() => useRevealBanner(g));
    expect(result.current).toBeNull();
  });

  it("returns kill banner when someone was eliminated this round", () => {
    const g: Game = {
      ...baseGame,
      players: [...baseGame.players, { id: "c", displayName: "Stede Bonnet", colorOrAvatar: "stede_bonnet", bullets: [], cash: [], wounds: 3, shame: 0, status: "dead", effects: [] }],
      round: { ...baseGame.round, phase: "reveal_others", resolution: { shots: [], ducks: [], eliminated: ["c"] } },
    };
    const { result } = renderHook(() => useRevealBanner(g));
    expect(result.current).toEqual({ kind: "kill", name: "Stede Bonnet" });
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/hooks/useRevealBanner.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the hook**

```ts
import type { Game } from "../game/types";

type Banner = { kind: "broadside"; struckCount: number } | { kind: "kill"; name: string } | null;

export function useRevealBanner(game: Game): Banner {
  const phase = game.round.phase;
  const res = game.round.resolution;
  if (!res) return null;

  // Kill banner takes priority during phases 4 and 5 — it's the louder beat.
  if ((phase === "reveal_bbb" || phase === "reveal_others") && res.eliminated.length > 0) {
    const killedId = res.eliminated[0];
    const killed = game.players.find(p => p.id === killedId);
    return killed ? { kind: "kill", name: killed.displayName } : null;
  }
  if (phase === "reveal_bbb") {
    const bbbHits = res.shots.filter(s => s.card === "bang_bang_bang" && s.outcome === "hit").length;
    if (bbbHits === 0) return null;
    return { kind: "broadside", struckCount: bbbHits };
  }
  return null;
}
```

- [ ] **Step 4: Wire into RoomPage**

In `src/pages/RoomPage.tsx`'s `GameView`, derive the banner and pass it to `GameBoard`:

```tsx
import { useRevealBanner } from "../hooks/useRevealBanner";
// ...
const banner = useRevealBanner(game);
// ...
<GameBoard game={game} banner={banner} />
```

- [ ] **Step 5: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRevealBanner.ts src/hooks/useRevealBanner.test.ts src/pages/RoomPage.tsx
git commit -m "feat(reveal): derive RevealBanner from round resolution"
```

### Task 2.6: Visual fidelity sweep in MockBigScreen across phases — ✅ done via `DevControlsPanel`

Implemented as a richer `<DevControlsPanel>` (already shipped under the `mockboard-dev-controls` plan) that drives `useMockGameState` through every phase including the new `standoff_hold`. Steps below kept for historical reference only.

**Files:**
- Modify: `src/pages/MockBigScreen.tsx`

- [ ] **Step 1: Add a phase selector to MockBigScreen**

Add a small floating control (top-right, DEV-only chrome) that lets you switch the fixture between phases: `commit`, `standoff`, `withdraw`, `reveal_bbb`, `reveal_others`, `split`. For each phase the fixture sets the right `commits` / `resolution` shape so the banner, stamp, ducked roundels, and crew pills all render correctly.

```tsx
import { useState } from "react";
import type { RoundPhase } from "../game/types";

const PHASES: RoundPhase[] = ["commit", "standoff", "withdraw", "reveal_bbb", "reveal_others", "split"];

export default function MockBigScreen() {
  const [phase, setPhase] = useState<RoundPhase>("withdraw");
  const game = buildFixture(phase);
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box", position: "relative" }}>
      <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 100, display: "flex", gap: 0.5 }}>
        {PHASES.map(p => (
          <button key={p} onClick={() => setPhase(p)} style={{ padding: "4px 8px", fontSize: 11 }}>
            {p}{phase === p ? " ✓" : ""}
          </button>
        ))}
      </Box>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead left={<>ROUND <em>III of VIII</em></>} right={<>PHASE <em>{phase}</em></>} />
        <GameBoard game={game} />
        <Foot left="VI ALIVE · I YIELDED · 0 DEAD" cry={navyHoursLabel(3)} right="NEXT · WHO SHALL FALL?" />
      </PageCanvas>
    </Box>
  );
}

function buildFixture(phase: RoundPhase): Game {
  const base: Game = {
    /* same PLAYERS + loot as before — see Task 1.10 */
    /* fill in commits / resolution per phase */
    /* ...this is dev-only scaffolding, write inline rather than abstract */
  } as Game;
  // ... implement per-phase tweaks
  return base;
}
```

Implement `buildFixture` to:
- `commit`: 4 players ready, 2 still choosing, no resolution
- `standoff`: all 6 ready, no resolution, `phaseStartedAt: Date.now()` so the count reads "3"
- `withdraw`: all targets locked, one player yielded
- `reveal_bbb`: resolution with one bbb hit, banner shows broadside
- `reveal_others`: resolution with shots and a kill, banner shows kill
- `split`: resolution complete, all loot still on table

- [ ] **Step 2: Verify visually**

Run: `npm run dev`. Open `/mock/big-screen/x`. Click through each phase button.
Expected: every phase renders the correct chrome (stamp during standoff, banner during reveals, ducked roundels during reveal/split, struck rows in crew column during reveals).

- [ ] **Step 3: Commit**

```bash
git add src/pages/MockBigScreen.tsx
git commit -m "feat(mock): phase selector in MockBigScreen for visual QA"
```

---

## Stage 3 — Lobby (THE MUSTER) — ✅ DONE

> Built `<MusterScreen>` + `<InvertedQR>`, wired into `RoomPage`. Followed the spec's structure with small adjustments — used the existing `toRoman` from `lib/navyHours`, foot row uses a 3-column grid (rather than space-between flex) so the `ABOARD` / `Hoist the colours` button / `SEATS LEFT` cluster aligns regardless of chip width. Empty seat tiles are simplified to a dashed-border square with the EMPTY SEAT / awaiting crew labels.

Big-screen lobby state. Replaces the QR-and-player-list layout in `RoomPage` with a broadside-styled muster screen.

### Task 3.1: i18n strings for the muster

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Update lobby copy in `en.json`**

Replace the `room` and `playerJoin` sections to match the broadside voice. Specifically:

```json
"room": {
  "loading": "Hoisting the colours…",
  "notFound": "No such ship in port",
  "lobbyTitle": "The Muster",
  "lobbyEyebrow": "— captain's absence —",
  "code": "ROOM",
  "scanToJoin": "Join the mutiny",
  "scanHint": "scan with a phone",
  "orPunchIn": "— or punch in the code —",
  "codeUrl": "at standoff.party/join",
  "playersHeading": "The crew so far",
  "playersHint": "raise yer flag",
  "waitingForPlayers": "Awaiting crew…",
  "startGame": "Hoist the colours",
  "startGameSub": "— start the mutiny —",
  "aboard": "{{n}} ABOARD",
  "aboardEnoughCry": "· enough to mutiny ·",
  "aboardWaitingCry": "· need at least IV ·",
  "seatsLeft": "{{n}} SEATS LEFT",
  "seatsCap": "· up to VI ·",
  "emptySeat": "EMPTY SEAT",
  "emptySeatHint": "awaiting crew",
  "started": "Mutiny in progress"
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS — new strings are referenced by Stage 3 components, not by anything yet.

- [ ] **Step 3: Commit**

```bash
git add src/locales/en.json
git commit -m "feat(i18n): muster-screen copy"
```

### Task 3.2: Inverted QR rendering

**Files:**
- Create: `src/components/screens/InvertedQR.tsx`
- Create: `src/components/screens/InvertedQR.test.tsx`

The lobby uses a cream-on-ink QR (paper modules on dark canvas). `react-gameroom`'s `RoomQRCode` uses default colors; we wrap it.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { InvertedQR } from "./InvertedQR";

describe("InvertedQR", () => {
  it("renders a wrapper around RoomQRCode", () => {
    const { container } = render(<InvertedQR roomId="ABCD" url="https://example.test/join/ABCD" size={180} />);
    // RoomQRCode renders an SVG; we just verify the wrapper is present and forwards the size.
    expect(container.querySelector("[data-inverted-qr]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/screens/InvertedQR.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { RoomQRCode } from "react-gameroom";
import { palette } from "../../theme/colors";

interface InvertedQRProps {
  roomId: string;
  url: string;
  size?: number;
}

export function InvertedQR({ roomId, url, size = 180 }: InvertedQRProps) {
  // RoomQRCode draws black-on-white; we invert via a CSS filter so we don't fork
  // its render output. Phones decode this fine because it's still a strict
  // luminance contrast — invert(1) flips black↔white.
  return (
    <Box
      data-inverted-qr
      sx={{
        width: size,
        height: size,
        background: palette.ink,
        padding: "10px",
        boxSizing: "content-box",
        border: `2px solid ${palette.paper}`,
        boxShadow: `0 0 0 4px ${palette.ink}, 6px 6px 0 ${palette.inkDeep}`,
        filter: "invert(1) hue-rotate(180deg)",
      }}
    >
      <RoomQRCode roomId={roomId} url={url} size={size} />
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/screens/InvertedQR.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/InvertedQR.tsx src/components/screens/InvertedQR.test.tsx
git commit -m "feat(screens): InvertedQR for cream-on-ink QR codes"
```

### Task 3.3: `<MusterScreen>`

**Files:**
- Create: `src/components/screens/MusterScreen.tsx`
- Create: `src/components/screens/MusterScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { MusterScreen } from "./MusterScreen";
import "../../i18n";

const sampleRoom = {
  roomId: "QSPY",
  status: "lobby" as const,
  players: [
    { id: 1, name: "Cap'n Maud", status: "claimed", data: { colorOrAvatar: "calico_jack", displayName: "Cap'n Maud" } },
    { id: 2, name: "Mad Mary",   status: "claimed", data: { colorOrAvatar: "blackbeard",  displayName: "Mad Mary" } },
    { id: 3, name: "One-Eye",    status: "claimed", data: { colorOrAvatar: "stede_bonnet", displayName: "One-Eye" } },
    { id: 4, name: "Old Salt",   status: "claimed", data: { colorOrAvatar: "black_bart",  displayName: "Old Salt" } },
    { id: 5, status: "empty" },
    { id: 6, status: "empty" },
  ],
  config: { minPlayers: 4, maxPlayers: 6, requireFull: false },
};

describe("MusterScreen", () => {
  it("renders the room code", () => {
    render(<MusterScreen roomState={sampleRoom as any} joinUrl="https://x/join/QSPY" canStart={true} onStart={() => {}} />);
    expect(screen.getByText("QSPY")).toBeInTheDocument();
  });

  it("renders all crew slots — claimed and empty", () => {
    render(<MusterScreen roomState={sampleRoom as any} joinUrl="https://x" canStart={true} onStart={() => {}} />);
    expect(screen.getByText("CAP'N MAUD")).toBeInTheDocument();
    expect(screen.getAllByText(/EMPTY SEAT/i)).toHaveLength(2);
  });

  it("disables the start button when canStart is false", () => {
    render(<MusterScreen roomState={sampleRoom as any} joinUrl="https://x" canStart={false} onStart={() => {}} />);
    const btn = screen.getByText(/HOIST THE COLOURS/i).closest("[role='button']");
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/screens/MusterScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import type { RoomState } from "react-gameroom";
import type { Player as GamePlayer } from "../../game/types";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { Foot } from "../shell/Foot";
import { Button } from "../shell/Button";
import { InvertedQR } from "./InvertedQR";
import { FlagFor } from "../flags";
import { FLAG_LABELS } from "../../game/playerFlags";

interface MusterScreenProps {
  roomState: RoomState<GamePlayer>;
  joinUrl: string;
  canStart: boolean;
  onStart: () => void;
}

export function MusterScreen({ roomState, joinUrl, canStart, onStart }: MusterScreenProps) {
  const { t } = useTranslation();
  const claimed = roomState.players.filter(p => p.status !== "empty");
  const empty = roomState.players.filter(p => p.status === "empty");
  const minPlayers = roomState.config.minPlayers ?? 4;

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={t("room.lobbyTitle").toUpperCase()}
          right={t("room.lobbyEyebrow")}
        />

        <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "38% 1fr", borderTop: `4px double ${palette.ruleStrong}`, borderBottom: `4px double ${palette.ruleStrong}`, minHeight: 0 }}>
          {/* LEFT: join column */}
          <Box sx={{ borderRight: `1px solid ${palette.ruleStrong}`, padding: "1rem 1.4rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.7rem" }}>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.75rem", letterSpacing: "0.4em", color: palette.paperDim }}>
              {t("room.scanToJoin").toUpperCase()}
              <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", letterSpacing: "0.04em", color: palette.paper, marginTop: "0.15rem" }}>
                {t("room.scanHint")}
              </Box>
            </Box>
            <InvertedQR roomId={roomState.roomId} url={joinUrl} size={180} />
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", color: palette.paperDim }}>{t("room.orPunchIn")}</Box>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "2.6rem", letterSpacing: "0.36em", lineHeight: 1, color: palette.paper, borderTop: `2px solid ${palette.ruleStrong}`, borderBottom: `2px solid ${palette.ruleStrong}`, padding: "0.4rem 1rem", boxShadow: `4px 4px 0 ${palette.inkDeep}` }}>
              {roomState.roomId}
            </Box>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.6rem", letterSpacing: "0.3em", color: palette.paperDim }}>
              {t("room.codeUrl")}
            </Box>
          </Box>

          {/* RIGHT: crew column */}
          <Box sx={{ padding: "1rem 1.4rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ textAlign: "center", fontFamily: fonts.displayCaps, fontSize: "0.75rem", letterSpacing: "0.4em", color: palette.paperDim, marginBottom: "0.6rem" }}>
              {t("room.playersHeading").toUpperCase()}
              <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", color: palette.paper, marginTop: "0.15rem" }}>
                {t("room.playersHint")}
              </Box>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.7rem", flex: 1, alignContent: "start" }}>
              {claimed.map(p => {
                const flagId = p.data?.colorOrAvatar ?? "generic";
                const pirateName = (FLAG_LABELS as Record<string, string>)[flagId] ?? flagId.toUpperCase();
                return (
                  <Box key={p.id} sx={{ background: palette.inkUp, border: `2px solid ${palette.paper}`, boxShadow: `3px 3px 0 ${palette.inkDeep}`, padding: "0.55rem", textAlign: "center" }}>
                    <Box sx={{ width: 56, height: 56, margin: "0 auto", border: `2px solid ${palette.paper}`, background: flagColor(flagId), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FlagFor id={flagId} size={40} />
                    </Box>
                    <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.78rem", letterSpacing: "0.16em", marginTop: "0.45rem" }}>{pirateName.toUpperCase()}</Box>
                    <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", color: palette.paperDim, marginTop: "0.1rem" }}>— {p.name} —</Box>
                  </Box>
                );
              })}
              {empty.map(p => (
                <Box key={p.id} sx={{ border: `2px dashed ${palette.paperFaint}`, padding: "0.55rem", textAlign: "center", color: palette.paperFaint }}>
                  <Box sx={{ width: 56, height: 56, margin: "0 auto", border: `2px dashed ${palette.paperFaint}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem" }}>
                    — pick a flag —
                  </Box>
                  <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.78rem", letterSpacing: "0.16em", marginTop: "0.45rem" }}>{t("room.emptySeat")}</Box>
                  <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", marginTop: "0.1rem" }}>{t("room.emptySeatHint")}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Foot with the start button at center */}
        <Box sx={{ padding: "0.7rem 1.5rem 0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.85rem", letterSpacing: "0.32em", color: claimed.length >= minPlayers ? palette.paperDim : palette.blood }}>
            {t("room.aboard", { n: toRoman(claimed.length) })}
            <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.04em", color: palette.blood, paddingLeft: "0.5em" }}>
              {claimed.length >= minPlayers ? t("room.aboardEnoughCry") : t("room.aboardWaitingCry")}
            </Box>
          </Box>
          <Button
            variant="primary"
            emphasis
            disabled={!canStart}
            onClick={onStart}
            caption={t("room.startGameSub")}
          >
            {t("room.startGame").toUpperCase()}
          </Button>
          <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.85rem", letterSpacing: "0.32em", color: palette.paperDim, textAlign: "right" }}>
            {t("room.seatsLeft", { n: toRoman(empty.length) })}
            <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.04em", paddingLeft: "0.5em" }}>
              {t("room.seatsCap")}
            </Box>
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}

const ROMAN = ["", "I","II","III","IV","V","VI","VII","VIII","IX","X"];
const toRoman = (n: number) => ROMAN[n] ?? String(n);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/screens/MusterScreen.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens
git commit -m "feat(screens): add MusterScreen for big-screen lobby"
```

### Task 3.4: Wire MusterScreen into RoomPage

**Files:**
- Modify: `src/pages/RoomPage.tsx`

- [ ] **Step 1: Replace the lobby branch**

In `src/pages/RoomPage.tsx`, the existing lobby JSX (the section that renders `<Container maxWidth="lg">` with the Stack of QR + crew) is replaced with `<MusterScreen>`. Replace lines 79-127 with:

```tsx
import { MusterScreen } from "../components/screens/MusterScreen";

// ... at the lobby branch ...
return (
  <MusterScreen
    roomState={roomState}
    joinUrl={joinUrl}
    canStart={derived.canStart}
    onStart={onStart}
  />
);
```

Remove the now-unused imports (`Container`, `Stack`, `Typography`, `Button` from MUI in this file, `RoomQRCode` from react-gameroom — keep what's still used by GameView).

- [ ] **Step 2: Run dev server, verify lobby visually**

Run: `npm run dev`. Create a new room (the dev firebase rules from `.env` apply). Don't have a phone? Open the app twice in two browser windows and join from a tab.
Expected: dark canvas, broadside masthead, two-column lobby with QR + crew, blood-shadowed start button at the foot. Joining from a second tab adds a crew card; empty seats show as dashed-border placeholders.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat(big-screen): wire MusterScreen into RoomPage lobby branch"
```

---

## Stage 4 — End-game (THE RECKONING) — ✅ DONE

> Built `<EndGameRow>` + `<ReckoningScreen>`, wired into `RoomPage`. Several iterations on top of the spec:
>
> - Header matches the in-game Masthead (`ROUND VIII of VIII · The Standoff · ROOM <code>`) instead of the bespoke "ROUND VIII PASSED / NAVY at the dock" treatment — visual continuity with the rest of the big-screen surfaces. The reckoning's title/subtitle/passedRound/navyDocked i18n keys were dropped.
> - Pirate flag-names dropped throughout — display name promoted to the prominent blackletter title in the winner section, and to the row label in EndGameRow.
> - All flag chips use `jollyRogerForColor()` (per-color jolly roger) instead of the player's pirate flag SVG.
> - EndGameRow rebuilt as an 8-column ledger grid (rank · chip · name · wounds · shame · cash · penalty · score) with each piece of info in its own column. Wound + shame pip clusters extracted into `<WoundPips>` / `<ShamePips>` (`src/components/marks/PlayerMarks.tsx`) and shared with `CrewRow`.
> - Money displays use blackletter bold to match `CrewRow`'s cash chip; `MoneyCell` falls back to a faint italic em-dash when the column doesn't apply (cash + penalty for dead players, penalty for shame-clean players).
> - Staggered entrance animations: rows announce in reverse (last place enters first, second place last) at 110ms apart via a new `slideUpIn` keyframe; after a 280ms beat the winner enthronement pops in (eyebrow → medallion popIn → cry); buttons fade in last.
> - Extracted `netScore` + `SHAME_PENALTY` to `src/lib/score.ts`.
> - `<Masthead>` grew a `centerSub` prop, used here.

The climax screen. One row at the top for the winner; the rest in rank order below.

### Task 4.1: i18n strings for the reckoning

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Add reckoning strings**

Add a new section to `en.json`:

```json
"reckoning": {
  "title": "The Reckoning",
  "subtitle": "THE LEDGER OF THE MUTINY · CLOSED THIS DAY",
  "passedRound": "— ROUND VIII PASSED —",
  "navyDocked": "NAVY at the dock",
  "winnerEyebrow": "— AND THE LION'S SHARE GOES TO —",
  "winnerCry": "— walks away with the lot —",
  "rankShame": "− ${{amount}} ({{n}} streak)",
  "rankShames": "− ${{amount}} ({{n}} streaks)",
  "forfeit": "— forfeit —",
  "dead": "DEAD",
  "plankedRound": "walked the plank, rd. {{round}}",
  "playAgain": "Another round",
  "returnToPort": "Return to port"
}
```

- [ ] **Step 2: Commit**

```bash
git add src/locales/en.json
git commit -m "feat(i18n): reckoning copy for end-game screen"
```

### Task 4.2: `<EndGameRow>`

**Files:**
- Create: `src/components/screens/EndGameRow.tsx`
- Create: `src/components/screens/EndGameRow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { EndGameRow } from "./EndGameRow";
import type { Player } from "../../game/types";

const ALIVE: Player = {
  id: "a", displayName: "Mad Mary", colorOrAvatar: "blackbeard",
  bullets: [], cash: [{ value: 50000 }], wounds: 0, shame: 1,
  status: "alive", effects: [],
};

const DEAD: Player = {
  ...ALIVE,
  id: "b", displayName: "Wet Match", colorOrAvatar: "edward_low",
  cash: [], status: "dead",
};

describe("EndGameRow", () => {
  it("renders rank, flag name, nickname, and final score for alive player", () => {
    render(<EndGameRow rank={2} player={ALIVE} flagName="BLACKBEARD" eliminatedRound={null} />);
    expect(screen.getByText("II")).toBeInTheDocument();
    expect(screen.getByText("BLACKBEARD")).toBeInTheDocument();
    expect(screen.getByText(/Mad Mary/)).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument(); // 50k - 5k shame
  });

  it("shows shame penalty in the breakdown", () => {
    render(<EndGameRow rank={2} player={ALIVE} flagName="X" eliminatedRound={null} />);
    expect(screen.getByText(/− \$5,000/)).toBeInTheDocument();
  });

  it("renders DEAD score for an eliminated player with elimination round in nickname", () => {
    render(<EndGameRow rank={5} player={DEAD} flagName="EDWARD LOW" eliminatedRound={6} />);
    expect(screen.getByText("DEAD")).toBeInTheDocument();
    expect(screen.getByText(/walked the plank, rd\. 6/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/screens/EndGameRow.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import type { Player } from "../../game/types";

const ROMAN = ["", "I","II","III","IV","V","VI","VII","VIII"];

interface EndGameRowProps {
  rank: number;
  player: Player;
  flagName: string;
  eliminatedRound: number | null;
}

export function EndGameRow({ rank, player, flagName, eliminatedRound }: EndGameRowProps) {
  const { t } = useTranslation();
  const dead = player.status === "dead";
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const shamePenalty = player.shame * 5000;
  const score = dead ? null : cash - shamePenalty;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "64px 48px 1fr auto auto",
        gap: "1.2rem",
        alignItems: "center",
        padding: "0.4rem 0",
        borderBottom: `1px solid ${palette.rule}`,
        opacity: dead ? 0.55 : 1,
      }}
    >
      <Box sx={{ textAlign: "right", fontFamily: fonts.displayCaps, fontSize: "1.5rem", color: palette.paperDim }}>
        {ROMAN[rank] ?? rank}
      </Box>
      <Box
        sx={{
          width: 44,
          height: 44,
          border: `2px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={player.colorOrAvatar} size={32} />
      </Box>
      <Box>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "1rem", letterSpacing: "0.16em" }}>
          {flagName}
          <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.04em", color: palette.paperDim, paddingLeft: "0.6em", fontSize: "0.9rem" }}>
            {player.displayName}
            {eliminatedRound != null && (
              <> · {t("reckoning.plankedRound", { round: eliminatedRound })}</>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.78rem", color: palette.paperDim }}>
        {dead ? (
          t("reckoning.forfeit")
        ) : (
          <>
            ${(cash / 1000).toFixed(0)}k
            {player.shame > 0 && (
              <Box component="span" sx={{ color: palette.blood, paddingLeft: "0.4em" }}>
                {t(player.shame === 1 ? "reckoning.rankShame" : "reckoning.rankShames", {
                  amount: shamePenalty.toLocaleString(),
                  n: ROMAN[player.shame] ?? player.shame,
                })}
              </Box>
            )}
          </>
        )}
      </Box>
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "1.2rem", letterSpacing: "0.04em", color: dead ? palette.blood : palette.paper, fontStyle: dead ? "italic" : "normal" }}>
        {dead ? t("reckoning.dead") : `$${score!.toLocaleString()}`}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/screens/EndGameRow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/EndGameRow.tsx src/components/screens/EndGameRow.test.tsx
git commit -m "feat(screens): add EndGameRow for ranked reveal rows"
```

### Task 4.3: `<ReckoningScreen>`

**Files:**
- Create: `src/components/screens/ReckoningScreen.tsx`
- Create: `src/components/screens/ReckoningScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { ReckoningScreen } from "./ReckoningScreen";
import type { Game } from "../../game/types";
import "../../i18n";

function makeGame(): Game {
  return {
    seed: "x", roomId: "x",
    players: [
      { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack", bullets: [], cash: [{ value: 85000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
      { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",  bullets: [], cash: [{ value: 50000 }], wounds: 0, shame: 1, status: "alive", effects: [] },
      { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",  bullets: [], cash: [], wounds: 3, shame: 0, status: "dead", effects: [] },
    ],
    round: { number: 8, phase: "split", phaseStartedAt: 0, loot: [], commits: {} },
    bankDeck: [], discardedBullets: [], phase: "ended",
  } as Game;
}

describe("ReckoningScreen", () => {
  it("crowns the highest-scoring alive player", () => {
    render(<ReckoningScreen game={makeGame()} eliminatedByRound={{}} onPlayAgain={() => {}} onReturn={() => {}} />);
    // winner name appears in the enthronement region
    expect(screen.getByText(/Calico Jack/i)).toBeInTheDocument();
  });

  it("renders the rest in rank order", () => {
    render(<ReckoningScreen game={makeGame()} eliminatedByRound={{}} onPlayAgain={() => {}} onReturn={() => {}} />);
    const rows = screen.getAllByText(/MAD MARY|WET MATCH/i);
    expect(rows).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/screens/ReckoningScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { Button } from "../shell/Button";
import { FlagFor } from "../flags";
import { FLAG_LABELS } from "../../game/playerFlags";
import { EndGameRow } from "./EndGameRow";
import type { Game, Player } from "../../game/types";

interface ReckoningScreenProps {
  game: Game;
  /** Optional map of playerId -> round number when they were eliminated. */
  eliminatedByRound: Record<string, number>;
  onPlayAgain: () => void;
  onReturn: () => void;
}

function score(p: Player) {
  if (p.status !== "alive") return -Infinity;
  return p.cash.reduce((s, n) => s + n.value, 0) - 5000 * p.shame;
}

function tieBreak(a: Player, b: Player) {
  // 1. score
  const ds = score(b) - score(a);
  if (ds !== 0) return ds;
  // 2. fewer shame wins
  const dShame = a.shame - b.shame;
  if (dShame !== 0) return dShame;
  // 3. more wounds wins
  return b.wounds - a.wounds;
}

export function ReckoningScreen({ game, eliminatedByRound, onPlayAgain, onReturn }: ReckoningScreenProps) {
  const { t } = useTranslation();
  const ranked = [...game.players].sort(tieBreak);
  const winner = ranked[0];
  const rest = ranked.slice(1);
  const winnerName = (FLAG_LABELS as Record<string, string>)[winner.colorOrAvatar] ?? winner.colorOrAvatar.toUpperCase();
  const winnerCash = winner.cash.reduce((s, n) => s + n.value, 0);
  const winnerScore = winnerCash - 5000 * winner.shame;

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={t("reckoning.passedRound")}
          center={t("reckoning.title")}
          centerSub={t("reckoning.subtitle")}
          right={t("reckoning.navyDocked")}
        />

        <Box sx={{ flex: 1, padding: "0.6rem 2rem", display: "flex", flexDirection: "column", borderTop: `4px double ${palette.ruleStrong}`, borderBottom: `4px double ${palette.ruleStrong}`, minHeight: 0 }}>
          {/* Winner enthronement */}
          <Box sx={{ textAlign: "center", padding: "0.8rem 0 0.6rem", borderBottom: `1px solid ${palette.rule}`, marginBottom: "0.6rem" }}>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.78rem", letterSpacing: "0.6em", color: palette.paperDim }}>
              {t("reckoning.winnerEyebrow")}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", marginTop: "0.5rem" }}>
              <Box sx={{ fontFamily: fonts.blackletter, fontSize: "5.5rem", lineHeight: 0.85, color: palette.blood, letterSpacing: "0.02em" }}>I</Box>
              <Box sx={{ width: 100, height: 100, border: `4px solid ${palette.paper}`, background: flagColor(winner.colorOrAvatar), borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `6px 6px 0 ${palette.inkDeep}` }}>
                <FlagFor id={winner.colorOrAvatar} size={70} />
              </Box>
              <Box sx={{ textAlign: "left" }}>
                <Box sx={{ fontFamily: fonts.blackletter, fontSize: "3.5rem", lineHeight: 0.9, color: palette.paper }}>{winnerName.split("").map((c, i) => i === 0 ? c.toUpperCase() : c.toLowerCase()).join("")}</Box>
                <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "1rem", color: palette.paperDim, marginTop: "0.1rem" }}>
                  — {winner.displayName} —
                </Box>
                <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "1.15rem", letterSpacing: "0.32em", marginTop: "0.4rem" }}>
                  ${winnerScore.toLocaleString()}
                </Box>
              </Box>
            </Box>
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "1.15rem", color: palette.blood, marginTop: "0.5rem" }}>
              {t("reckoning.winnerCry")}
            </Box>
          </Box>

          {/* The rest */}
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto" }}>
            {rest.map((p, i) => {
              const flagName = (FLAG_LABELS as Record<string, string>)[p.colorOrAvatar] ?? p.colorOrAvatar.toUpperCase();
              return (
                <EndGameRow
                  key={p.id}
                  rank={i + 2}
                  player={p}
                  flagName={flagName}
                  eliminatedRound={eliminatedByRound[p.id] ?? null}
                />
              );
            })}
          </Box>
        </Box>

        <Box sx={{ padding: "0.6rem 1.5rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <Button variant="primary" onClick={onPlayAgain}>{t("reckoning.playAgain").toUpperCase()}</Button>
          <Button variant="ghost" onClick={onReturn}>{t("reckoning.returnToPort").toUpperCase()}</Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/screens/ReckoningScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/ReckoningScreen.tsx src/components/screens/ReckoningScreen.test.tsx
git commit -m "feat(screens): add ReckoningScreen with winner enthronement"
```

### Task 4.4: Wire ReckoningScreen into RoomPage

**Files:**
- Modify: `src/pages/RoomPage.tsx`
- Modify: `src/game/types.ts` (if `eliminatedByRound` doesn't already exist) — *check first; if absent, do not add it as part of this task*. Plan B: derive from `previousRoundSummary` chain or accept an empty map.

- [ ] **Step 1: Replace the end-game branch**

In `GameView`, replace the `if (game.phase === "ended")` branch with:

```tsx
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { useNavigate } from "react-router-dom";

// ... inside GameView ...
const navigate = useNavigate();

if (game.phase === "ended") {
  // For now we don't track per-player elimination round in game state. Stage 4
  // accepts an empty map; if/when game state grows that field, swap it in.
  return (
    <ReckoningScreen
      game={game}
      eliminatedByRound={{}}
      onPlayAgain={() => window.location.reload()}
      onReturn={() => navigate("/")}
    />
  );
}
```

Drop the previous `Container`/`PlayerCard` end-game block and the `totalScore` / `outcomeLabel` helpers if they're now unused.

- [ ] **Step 2: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat(big-screen): wire ReckoningScreen into RoomPage end-game branch"
```

---

## Stage 5 — Phone foundation + commit — ✅ DONE

> Built `<PhoneShell>`, `<PowderCard>`, `<Hand>`, `<TargetList>`. Wired commit phase into `PlayerPage`. Adjustments from the spec:
>
> - PhoneShell drops the spec's pirate flag-name slot — the displayName is the only label, in displayCaps small caps. Cash in blackletter bold + a `WoundPips` chip on the right.
> - `<TargetList>` was iterated twice: first as a vertical card list (per spec), then as a horizontal aim-scroller, then unified with the standoff aim view by being rebuilt around a shared `<AimBarrel>` primitive (`src/components/phone/AimBarrel.tsx`). The final shape: a 130px AimBarrel showing whoever's currently in the sights, with the target's display name + cash beneath, plus a small chip row at the bottom for picking. When the round locks into standoff, the same sights stay on screen — visual continuity instead of swapping picker UIs.
> - All flag chips on the phone surface use `jollyRogerForColor()`.
> - Pre-loaded the phone-mock fixture's commits (in `mockFixtures.ts`) so `MockPlayerPage` can demo the withdraw threat readout per seat.
> - PhaseView extracted from `PlayerPage` into `src/components/phone/PhaseView.tsx` so `MockPlayerPage` can render the same UI against fixture state.
> - **Bonus mock**: `MockPlayerPage` at `/mock/player[/:id]` mirrors `MockBigScreen` for phone surface iteration. SEAT chip pinned top-left toggles which player is "me"; DevControlsPanel drives phase / round / commits / wounds.

Build the phone shell and the most-input-heavy phase (commit).

### Task 5.1: BROADSIDE → QUICKDRAW i18n rename

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Update load + reveal copy**

In `en.json`:

```json
"load": {
  "clic": "Click",
  "bang": "Shot",
  "bang_bang_bang": "Quickdraw",
  "description": {
    "clic": "Empty hammer-snap",
    "bang": "A clean shot",
    "bang_bang_bang": "Triple-loaded — devastating"
  }
},
"reveal": {
  "broadside": "BROADSIDE!",
  "quickdraw": "QUICKDRAW!",
  "shot": "SHOT!",
  "hit": "{{shooter}} shot {{target}}!",
  "click": "{{shooter}} aimed at {{target}}… *click*",
  "voidedDuck": "{{shooter}}'s shot wasted — {{target}} yielded.",
  "voidedSurprised": "{{shooter}} caught off guard — shot wasted."
},
"player": {
  "lobbyWaiting": "Waiting for the captain to call it…",
  "started": "Mutiny in progress",
  "spectator": "Ye walked the plank.",
  "watchScreen": "Watch the big screen…",
  "header": {
    "wounds": "wounds {{n}}/III"
  }
}
```

The card type code keeps `bang_bang_bang` per CLAUDE.md (theme-neutral). Only the rendered string changes.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/locales/en.json
git commit -m "feat(i18n): rename Broadside card to Quickdraw"
```

### Task 5.2: `<PhoneShell>`

**Files:**
- Create: `src/components/shell/PhoneShell.tsx`
- Create: `src/components/shell/PhoneShell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { PhoneShell } from "./PhoneShell";
import type { Player } from "../../game/types";

const me: Player = {
  id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
  bullets: [], cash: [{ value: 15000 }], wounds: 1, shame: 0,
  status: "alive", effects: [],
};

describe("PhoneShell", () => {
  it("renders the player header strip with flag, pirate-name, nickname, and stash", () => {
    render(<PhoneShell me={me} flagName="CALICO JACK" round={3} phaseLabel="LOAD & AIM"><div>body</div></PhoneShell>);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
    expect(screen.getByText(/Cap'n Maud/)).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
  });

  it("renders the round indicator strip", () => {
    render(<PhoneShell me={me} flagName="X" round={3} phaseLabel="LOAD & AIM"><div /></PhoneShell>);
    expect(screen.getByText(/III of VIII/)).toBeInTheDocument();
    expect(screen.getByText(/LOAD & AIM/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/shell/PhoneShell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "./PageCanvas";
import { FlagFor } from "../flags";
import type { Player } from "../../game/types";

const ROMAN = ["", "I","II","III","IV","V","VI","VII","VIII"];

interface PhoneShellProps {
  me: Player;
  flagName: string;
  round: number;
  phaseLabel: string;
  children: React.ReactNode;
}

export function PhoneShell({ me, flagName, round, phaseLabel, children }: PhoneShellProps) {
  const cash = me.cash.reduce((s, n) => s + n.value, 0);
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: "8px", boxSizing: "border-box" }}>
      <PageCanvas borderRadius={28} sx={{ width: "100%", height: "100%" }}>
        {/* header strip */}
        <Box sx={{
          borderBottom: `3px double ${palette.ruleStrong}`,
          padding: "0.65rem 0.85rem 0.5rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: "0.6rem",
        }}>
          <Box sx={{
            width: 36, height: 36,
            border: `2px solid ${palette.paper}`,
            background: flagColor(me.colorOrAvatar),
            color: palette.paper,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FlagFor id={me.colorOrAvatar} size={26} />
          </Box>
          <Box>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.78rem", letterSpacing: "0.18em", lineHeight: 1 }}>
              {flagName}
            </Box>
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", color: palette.paperDim, marginTop: "0.2rem" }}>
              {me.displayName}
            </Box>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.7rem", letterSpacing: "0.05em", lineHeight: 1 }}>
              ${cash.toLocaleString()}
            </Box>
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.55rem", letterSpacing: "0.15em", color: palette.paperDim, marginTop: "0.18rem" }}>
              ·· wounds {ROMAN[me.wounds] ?? me.wounds}/III
            </Box>
          </Box>
        </Box>

        {/* round strip */}
        <Box sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontSize: "0.6rem",
          letterSpacing: "0.32em",
          padding: "0.35rem 0",
          borderBottom: `1px solid ${palette.ruleStrong}`,
          color: palette.paperDim,
        }}>
          ROUND <Box component="em" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.04em", paddingLeft: "0.35em", color: palette.blood }}>
            {ROMAN[round] ?? round} of VIII
          </Box>
          {" · "}
          <Box component="span" sx={{ color: palette.paper }}>{phaseLabel}</Box>
        </Box>

        {/* body */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </Box>
      </PageCanvas>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/shell/PhoneShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/PhoneShell.tsx src/components/shell/PhoneShell.test.tsx
git commit -m "feat(shell): add PhoneShell with player header and round strip"
```

### Task 5.3: `<PowderCard>`

**Files:**
- Create: `src/components/phone/PowderCard.tsx`
- Create: `src/components/phone/PowderCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { PowderCard } from "./PowderCard";

describe("PowderCard", () => {
  it("renders the click face", () => {
    render(<PowderCard load="clic" onClick={() => {}} />);
    expect(screen.getByText("CLICK")).toBeInTheDocument();
  });
  it("renders the shot face", () => {
    render(<PowderCard load="bang" onClick={() => {}} />);
    expect(screen.getByText("SHOT")).toBeInTheDocument();
  });
  it("renders the quickdraw face with gold border indicator", () => {
    render(<PowderCard load="bang_bang_bang" onClick={() => {}} data-testid="qd" />);
    expect(screen.getByText("QUICKDRAW")).toBeInTheDocument();
    expect(screen.getByTestId("qd").dataset.special).toBe("true");
  });
  it("flips face-down when spent", () => {
    render(<PowderCard load="bang" spent />);
    expect(screen.getByText("SPENT")).toBeInTheDocument();
    expect(screen.queryByText("SHOT")).not.toBeInTheDocument();
  });
  it("calls onClick when not spent and not selected", () => {
    const fn = vi.fn();
    render(<PowderCard load="bang" onClick={fn} data-testid="c" />);
    fireEvent.click(screen.getByTestId("c"));
    expect(fn).toHaveBeenCalledOnce();
  });
  it("does not call onClick when spent", () => {
    const fn = vi.fn();
    render(<PowderCard load="bang" onClick={fn} spent data-testid="c" />);
    fireEvent.click(screen.getByTestId("c"));
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/phone/PowderCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { BulletCard } from "../../game/types";

interface PowderCardProps {
  load: BulletCard;
  selected?: boolean;
  spent?: boolean;
  onClick?: () => void;
  "data-testid"?: string;
}

const NAMES: Record<BulletCard, string> = {
  clic: "CLICK",
  bang: "SHOT",
  bang_bang_bang: "QUICKDRAW",
};

const CORNERS: Record<BulletCard, string> = {
  clic: "×",
  bang: "●",
  bang_bang_bang: "⚡",
};

export function PowderCard({ load, selected, spent, onClick, "data-testid": testid }: PowderCardProps) {
  const isQuickdraw = load === "bang_bang_bang";
  const handle = () => {
    if (spent) return;
    onClick?.();
  };

  if (spent) {
    return (
      <Box
        data-testid={testid}
        sx={{
          aspectRatio: "2 / 3",
          background: palette.inkDeep,
          border: `1.5px solid ${palette.paperFaint}`,
          color: palette.paperDim,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "0.2rem",
        }}
      >
        <Box sx={{ fontSize: "1.3rem" }}>☠</Box>
        <Box sx={{ width: "50%", borderTop: `1px solid ${palette.paperDim}`, opacity: 0.5 }} />
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.4rem", letterSpacing: "0.2em", opacity: 0.55 }}>
          SPENT
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      data-testid={testid}
      data-special={isQuickdraw ? "true" : "false"}
      onClick={handle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle();
        }
      }}
      sx={{
        aspectRatio: "2 / 3",
        background: selected ? palette.blood : palette.inkUp,
        color: selected ? palette.paper : palette.paper,
        border: `1.5px solid ${isQuickdraw ? palette.gold : palette.paper}`,
        boxShadow: selected
          ? `3px 3px 0 ${palette.inkDeep}, inset 0 0 0 2px ${palette.paper}`
          : isQuickdraw
            ? `2px 2px 0 ${palette.goldDeep}, inset 0 0 0 1.5px ${palette.gold}`
            : `2px 2px 0 ${palette.inkDeep}`,
        position: "relative",
        display: "flex", flexDirection: "column",
        textAlign: "center",
        cursor: "pointer",
        transform: selected ? "translateY(-3px)" : "none",
        transition: "transform 0.1s ease",
      }}
    >
      <Box sx={{ position: "absolute", top: 3, left: 4, fontFamily: fonts.displayCaps, fontSize: "0.55rem" }}>
        {CORNERS[load]}
      </Box>
      <Box sx={{ position: "absolute", top: 3, right: 4, fontFamily: fonts.displayCaps, fontSize: "0.55rem" }}>
        {CORNERS[load]}
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.18rem" }}>
        <ChamberSVG load={load} color={selected ? palette.paper : palette.paper} />
      </Box>
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.5rem", letterSpacing: "0.2em", paddingBottom: "0.25rem", color: isQuickdraw ? palette.gold : "inherit" }}>
        {NAMES[load]}
      </Box>
    </Box>
  );
}

function ChamberSVG({ load, color }: { load: BulletCard; color: string }) {
  return (
    <svg viewBox="0 0 60 50" width="92%" height="92%">
      <rect x="10" y="15" width="40" height="20" fill="none" stroke={color} strokeWidth="2.2" />
      <rect x="6" y="22" width="6" height="6" fill={color} />
      <rect x="48" y="22" width="6" height="6" fill={color} />
      {load === "clic" && (
        <line x1="14" y1="13" x2="46" y2="37" stroke={palette.blood} strokeWidth="2.2" />
      )}
      {load === "bang" && (
        <circle cx="30" cy="25" r="5" fill={color} />
      )}
      {load === "bang_bang_bang" && (
        <>
          <circle cx="20" cy="25" r="4.5" fill={color} />
          <circle cx="30" cy="25" r="4.5" fill={color} />
          <circle cx="40" cy="25" r="4.5" fill={color} />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/phone/PowderCard.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/phone/PowderCard.tsx src/components/phone/PowderCard.test.tsx
git commit -m "feat(phone): add PowderCard with click/shot/quickdraw faces and spent back"
```

### Task 5.4: `<Hand>`

**Files:**
- Create: `src/components/phone/Hand.tsx`
- Create: `src/components/phone/Hand.test.tsx`

The hand always renders 8 slots derived from `Player.bullets` (face up) and the inferred spent count (face down).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Hand } from "./Hand";
import type { BulletCard } from "../../game/types";

describe("Hand", () => {
  it("always renders 8 slots", () => {
    const { container } = render(<Hand bullets={["bang"]} />);
    expect(container.querySelectorAll("[data-card-slot]")).toHaveLength(8);
  });
  it("renders face-up cards in click → shot → quickdraw order", () => {
    const bullets: BulletCard[] = ["bang_bang_bang", "bang", "clic", "clic"];
    render(<Hand bullets={bullets} />);
    const cards = screen.getAllByText(/CLICK|SHOT|QUICKDRAW/);
    expect(cards.map(c => c.textContent)).toEqual(["CLICK", "CLICK", "SHOT", "QUICKDRAW"]);
  });
  it("renders 8 - bullets.length spent slots", () => {
    const bullets: BulletCard[] = ["bang"];
    render(<Hand bullets={bullets} />);
    expect(screen.getAllByText("SPENT")).toHaveLength(7);
  });
  it("calls onPick when an unspent card is tapped", () => {
    const fn = vi.fn();
    render(<Hand bullets={["bang", "clic"]} onPick={fn} />);
    const shotCard = screen.getByText("SHOT").closest("[data-card-slot]") as HTMLElement;
    shotCard.click();
    expect(fn).toHaveBeenCalledWith("bang", expect.any(Number));
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/phone/Hand.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import type { BulletCard } from "../../game/types";
import { PowderCard } from "./PowderCard";

const ORDER: Record<BulletCard, number> = { clic: 0, bang: 1, bang_bang_bang: 2 };

interface HandProps {
  bullets: BulletCard[];
  selectedIndex?: number;
  onPick?: (load: BulletCard, index: number) => void;
}

export function Hand({ bullets, selectedIndex, onPick }: HandProps) {
  const sorted = [...bullets].sort((a, b) => ORDER[a] - ORDER[b]);
  const spentCount = Math.max(0, 8 - sorted.length);
  return (
    <Box sx={{
      padding: "0.4rem 0.6rem 0.2rem",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "0.35rem",
    }}>
      {sorted.map((b, i) => (
        <Box key={`up-${i}`} data-card-slot>
          <PowderCard
            load={b}
            selected={selectedIndex === i}
            onClick={() => onPick?.(b, i)}
          />
        </Box>
      ))}
      {Array.from({ length: spentCount }).map((_, i) => (
        <Box key={`spent-${i}`} data-card-slot>
          <PowderCard load="bang" spent />
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/phone/Hand.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/phone/Hand.tsx src/components/phone/Hand.test.tsx
git commit -m "feat(phone): add Hand grid that always renders 8 slots"
```

### Task 5.5: `<TargetList>`

**Files:**
- Create: `src/components/phone/TargetList.tsx`
- Create: `src/components/phone/TargetList.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { TargetList } from "./TargetList";
import type { Player } from "../../game/types";

const opponents: Player[] = [
  { id: "b", displayName: "Mad Mary", colorOrAvatar: "blackbeard", bullets: [], cash: [{ value: 25000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "One-Eye",  colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
];

describe("TargetList", () => {
  it("renders each opponent's flag-name and stash", () => {
    render(<TargetList opponents={opponents} flagNames={{ blackbeard: "BLACKBEARD", stede_bonnet: "STEDE BONNET" }} />);
    expect(screen.getByText("BLACKBEARD")).toBeInTheDocument();
    expect(screen.getByText("STEDE BONNET")).toBeInTheDocument();
    expect(screen.getByText("$25k")).toBeInTheDocument();
  });
  it("highlights the selected target and calls onPick", () => {
    const fn = vi.fn();
    render(<TargetList opponents={opponents} flagNames={{}} selectedId="b" onPick={fn} />);
    const blackbeardRow = screen.getByText(/Mad Mary/i).closest("[data-target-id]") as HTMLElement;
    expect(blackbeardRow.getAttribute("data-selected")).toBe("true");
    fireEvent.click(blackbeardRow);
    expect(fn).toHaveBeenCalledWith("b");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/phone/TargetList.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import type { Player } from "../../game/types";

interface TargetListProps {
  opponents: Player[];
  flagNames: Record<string, string>;
  selectedId?: string | null;
  onPick?: (id: string) => void;
}

export function TargetList({ opponents, flagNames, selectedId, onPick }: TargetListProps) {
  return (
    <Box sx={{ padding: "0.35rem 0.6rem", flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: "0.32rem" }}>
      {opponents.map(o => {
        const cash = o.cash.reduce((s, n) => s + n.value, 0);
        const isSel = selectedId === o.id;
        const flagName = flagNames[o.colorOrAvatar] ?? o.colorOrAvatar.toUpperCase();
        return (
          <Box
            key={o.id}
            role="button"
            tabIndex={0}
            data-target-id={o.id}
            data-selected={isSel ? "true" : "false"}
            onClick={() => onPick?.(o.id)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick?.(o.id); }
            }}
            sx={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              gap: "0.5rem",
              alignItems: "center",
              padding: "0.35rem 0.5rem",
              background: isSel ? palette.paper : palette.inkUp,
              color: isSel ? palette.ink : palette.paper,
              border: `1.5px solid ${palette.paper}`,
              boxShadow: isSel ? `4px 4px 0 ${palette.blood}` : `2px 2px 0 ${palette.inkDeep}`,
              cursor: "pointer",
            }}
          >
            <Box sx={{ width: 28, height: 28, border: `1.5px solid ${isSel ? palette.ink : palette.paper}`, background: flagColor(o.colorOrAvatar), color: palette.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlagFor id={o.colorOrAvatar} size={20} />
            </Box>
            <Box>
              <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.66rem", letterSpacing: "0.16em" }}>
                {flagName}
                <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.03em", fontSize: "0.58rem", paddingLeft: "0.4em", color: isSel ? palette.paperFaint : palette.paperDim }}>
                  {o.displayName}
                </Box>
              </Box>
            </Box>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", letterSpacing: "0.04em", color: isSel ? palette.ink : palette.paperDim }}>
              ${(cash / 1000).toFixed(0)}k
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/phone/TargetList.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/phone/TargetList.tsx src/components/phone/TargetList.test.tsx
git commit -m "feat(phone): add TargetList for opponent picking"
```

### Task 5.6: Wire phone commit phase

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Replace `CommitPicker` with the new components**

In `src/pages/PlayerPage.tsx`, find the `CommitPicker` function. Replace its body to use `Hand` + `TargetList` + `Button`:

```tsx
import { Hand } from "../components/phone/Hand";
import { TargetList } from "../components/phone/TargetList";
import { Button } from "../components/shell/Button";
import { FLAG_LABELS } from "../game/playerFlags";

function CommitPicker({ me, opponents, myCommit, onSubmit }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [load, setLoad] = useState<BulletCard | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    return (
      <Stack spacing={1} sx={{ padding: 2 }}>
        <Alert severity="success">
          {t("phase.commit.locked", { load: t(`load.${myCommit.bullet!}`), target: opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target })}
        </Alert>
        <Typography color="text.secondary">{t("phase.commit.waiting")}</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Hand
        bullets={me.bullets}
        selectedIndex={load != null ? me.bullets.findIndex(b => b === load) : undefined}
        onPick={(b) => setLoad(b)}
      />
      <Box sx={{ padding: "0.55rem 0 0.15rem", textAlign: "center" }}>
        <Typography variant="overline" color="text.secondary">{t("phase.commit.pickTarget")}</Typography>
      </Box>
      <TargetList
        opponents={opponents}
        flagNames={FLAG_LABELS as Record<string, string>}
        selectedId={target}
        onPick={(id) => setTarget(id)}
      />
      <Box sx={{ padding: "0.6rem 0.85rem 0.85rem" }}>
        <Button
          fullWidth
          disabled={!load || !target}
          onClick={() => load && target && onSubmit(me.id, load, target)}
          caption={load && target ? `— ${t(`load.${load}`).toLowerCase()} · ${opponents.find(o => o.id === target)?.displayName ?? "?"} —` : undefined}
        >
          {t("phase.commit.ready").toUpperCase()}
        </Button>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Wrap PlayerPage in PhoneShell**

The top-level render of `PlayerPage` (the in-game branch) should wrap its `Stack` in `<PhoneShell>`. Replace the in-game return JSX:

```tsx
import { PhoneShell } from "../components/shell/PhoneShell";

// inside PlayerPage, the in-game branch:
return (
  <PhoneShell
    me={me}
    flagName={FLAG_LABELS[me.colorOrAvatar as keyof typeof FLAG_LABELS] ?? me.colorOrAvatar.toUpperCase()}
    round={game.round.number}
    phaseLabel={t(`phase.${game.round.phase}`).toUpperCase()}
  >
    <PhaseView game={game} me={me} submitCommit={submitCommit} submitDuck={submitDuck} />
  </PhoneShell>
);
```

If `phase.standoff` etc. don't exist as i18n keys yet, use literal labels (`LOAD & AIM`, `STANDOFF`, `YIELD?`, `WATCH`, `THE SPLIT`).

- [ ] **Step 3: Verify visually + run tests**

Run: `npm run dev` and join a room as a player. Verify the commit screen renders with the 8-card hand and target list.
Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PlayerPage.tsx
git commit -m "feat(phone): wire PhoneShell + Hand + TargetList for commit phase"
```

---

## Stage 6 — Phone other phases (standoff / yield / spectator) — ✅ DONE

> Built `<YieldRibbon>` + `<Spectator>`, added a count-overlay variant to `<AimBarrel>` for the standoff phase, broadside-styled threat readout for the withdraw phase. Adjustments from the spec:
>
> - The spec's separate `<Barrel>` component (with iron sights + bore rings) was rolled into the existing `<AimBarrel>` instead — when `count` is set, the silhouette dims to ~40% and a giant blackletter numeral overlays + STAND label sits beneath. Same primitive used for both commit (no count) and standoff (with count) so the two phases stay visually continuous.
> - Withdraw phase: spec's "Aimed at by: X, Y, Z" sentence replaced with a full `<ThreatPanel>` — "AT EASE / the field be quiet" reflective state, or "MARK ON YE" / "II MARKS ON YE" headline with attacker chips below, each chip pairing a per-color jolly roger with the shooter's display name. Plus the spec's COST: ONE YELLOW STREAK / —$5,000 reminder beneath the ribbon (interpolated from `SHAME_PENALTY`).
> - `<YieldRibbon>` builds the spec but with cleaner CSS clip-path notched ends instead of pseudo-element wedges.
> - `<Spectator>` per spec — optional 'YE WALKED THE PLANK' banner (with roman-numeral round) + 'WATCH THE BIG SCREEN' eyebrow + the live `<CrewRoster>` (mirrors the in-game ledger from the phone).
> - Sub-cleanup: `FlintlockBarrel.tsx` and `YieldButton.tsx` were the only consumers of the older paper-on-ink yield treatment — both deleted.

### Task 6.1: `<Barrel>`

**Files:**
- Create: `src/components/phone/Barrel.tsx`
- Create: `src/components/phone/Barrel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Barrel } from "./Barrel";

describe("Barrel", () => {
  it("renders the count and the target name below the rings", () => {
    render(<Barrel targetFlag="stede_bonnet" targetName="STEDE BONNET" targetNickname="One-Eye" count={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("STEDE BONNET")).toBeInTheDocument();
    expect(screen.getByText(/One-Eye/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/phone/Barrel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";

interface BarrelProps {
  targetFlag: string;
  targetName: string;
  targetNickname?: string;
  count: number;
}

export function Barrel({ targetFlag, targetName, targetNickname, count }: BarrelProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0.8rem 0.8rem 1.2rem" }}>
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.78rem", letterSpacing: "0.4em", textAlign: "center", marginBottom: "0.6rem", color: palette.paperDim }}>
        — AIM TRUE —
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", letterSpacing: "0.05em", color: palette.paper, marginTop: "0.1rem" }}>
          down the barrel
        </Box>
      </Box>

      <Box sx={{ position: "relative", width: "88%", aspectRatio: "1 / 1", margin: "0 auto" }}>
        {/* outer ring */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle at center,
              ${palette.ink} 0%, ${palette.ink} 38%,
              ${palette.inkUp} 39%, ${palette.inkUp} 44%,
              ${palette.blood} 45%, ${palette.blood} 47%,
              ${palette.inkUp} 48%, ${palette.inkUp} 53%,
              ${palette.ink} 54%, ${palette.ink} 100%)`,
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.7), 0 0 0 2px ${palette.ink}, 0 0 0 4px ${palette.paper}, 0 0 0 5px ${palette.ink}`,
          }}
        />
        {/* iron sights */}
        {(["t","b","l","r"] as const).map(d => (
          <Box
            key={d}
            sx={{
              position: "absolute",
              background: palette.paper,
              width: "2px", height: "14px",
              ...(d === "t" ? { top: "4%", left: "50%", transform: "translateX(-50%)" } : {}),
              ...(d === "b" ? { bottom: "4%", left: "50%", transform: "translateX(-50%)" } : {}),
              ...(d === "l" ? { left: "4%", top: "50%", transform: "translateY(-50%) rotate(90deg)" } : {}),
              ...(d === "r" ? { right: "4%", top: "50%", transform: "translateY(-50%) rotate(90deg)" } : {}),
            }}
          />
        ))}
        {/* bore */}
        <Box
          sx={{
            position: "absolute",
            inset: "8%",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${palette.inkUp} 0%, ${palette.ink} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.9), inset 6px 6px 18px rgba(0,0,0,0.5)`,
          }}
        >
          {/* dimmed target flag */}
          <Box
            sx={{
              position: "absolute",
              width: "56%", aspectRatio: 1,
              borderRadius: "50%",
              background: flagColor(targetFlag),
              border: `3px solid rgba(237, 224, 196, 0.55)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 28px rgba(0,0,0,0.7)`,
              opacity: 0.55,
              color: "rgba(237, 224, 196, 0.55)",
            }}
          >
            <FlagFor id={targetFlag} size={56} />
          </Box>
          {/* count over the flag */}
          <Box
            sx={{
              position: "absolute",
              fontFamily: fonts.blackletter,
              fontSize: "8rem",
              lineHeight: 1,
              color: palette.paper,
              textShadow: "0 0 18px rgba(0,0,0,0.95)",
              zIndex: 2,
            }}
          >
            {count}
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: "12%",
              fontFamily: fonts.displayCaps,
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              color: palette.paper,
              opacity: 0.85,
            }}
          >
            — STAND —
          </Box>
        </Box>
      </Box>

      <Box sx={{ textAlign: "center", marginTop: "1.1rem" }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "1.05rem", letterSpacing: "0.28em" }}>{targetName}</Box>
        {targetNickname && (
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.78rem", color: palette.paperDim, marginTop: "0.18rem" }}>
            — {targetNickname} —
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/phone/Barrel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/phone/Barrel.tsx src/components/phone/Barrel.test.tsx
git commit -m "feat(phone): add Barrel with count-inside-bore composition"
```

### Task 6.2: Wire phone standoff phase

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Replace the standoff branch in `PhaseView`**

```tsx
import { Barrel } from "../components/phone/Barrel";
import { useStandoffCount } from "../hooks/useStandoffCount";

// inside PhaseView, replacing the standoff branch:
if (phase === "standoff") {
  const target = game.players.find(p => p.id === myCommit?.target);
  const count = useStandoffCount({
    active: true,
    startedAt: game.round.phaseStartedAt,
    durationMs: 4000,
  }) ?? 1;
  return (
    <Barrel
      targetFlag={target?.colorOrAvatar ?? "generic"}
      targetName={(FLAG_LABELS as Record<string, string>)[target?.colorOrAvatar ?? ""] ?? "?"}
      targetNickname={target?.displayName}
      count={count}
    />
  );
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Trigger a standoff phase (4 players, all commit). Verify the barrel renders with the count over the target flag and the name underneath.

- [ ] **Step 3: Run tests**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PlayerPage.tsx
git commit -m "feat(phone): wire Barrel for standoff phase with live count"
```

### Task 6.3: `<YieldRibbon>`

**Files:**
- Create: `src/components/phone/YieldRibbon.tsx`
- Create: `src/components/phone/YieldRibbon.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { YieldRibbon } from "./YieldRibbon";

describe("YieldRibbon", () => {
  it("shows YIELD when not yielded", () => {
    render(<YieldRibbon yielded={false} onToggle={() => {}} />);
    expect(screen.getByText("YIELD")).toBeInTheDocument();
  });
  it("shows the yielded prompt when yielded", () => {
    render(<YieldRibbon yielded onToggle={() => {}} />);
    expect(screen.getByText(/CHANGE YER MIND/)).toBeInTheDocument();
  });
  it("calls onToggle when clicked", () => {
    const fn = vi.fn();
    render(<YieldRibbon yielded={false} onToggle={fn} />);
    fireEvent.click(screen.getByText("YIELD"));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/phone/YieldRibbon.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface YieldRibbonProps {
  yielded: boolean;
  onToggle: () => void;
}

export function YieldRibbon({ yielded, onToggle }: YieldRibbonProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
      }}
      sx={{
        width: "100%",
        background: yielded ? palette.ink : palette.yellow,
        color: yielded ? palette.paper : palette.ink,
        textAlign: "center",
        border: `3px solid ${yielded ? palette.paper : palette.ink}`,
        boxShadow: yielded ? `6px 6px 0 ${palette.inkDeep}` : `6px 6px 0 ${palette.ink}`,
        padding: "1.5rem 1rem",
        position: "relative",
        cursor: "pointer",
      }}
    >
      <Box sx={{ fontFamily: fonts.blackletter, fontSize: "3.4rem", letterSpacing: "0.04em", lineHeight: 1 }}>
        {yielded ? "YIELDED" : "YIELD"}
      </Box>
      <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", letterSpacing: "0.05em", marginTop: "0.4rem" }}>
        {yielded ? "— CHANGE YER MIND? —" : "— hands up, powder dry —"}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/phone/YieldRibbon.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/phone/YieldRibbon.tsx src/components/phone/YieldRibbon.test.tsx
git commit -m "feat(phone): add YieldRibbon yellow notched banner"
```

### Task 6.4: Wire phone yield phase

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Replace the withdraw branch in `PhaseView`**

```tsx
import { YieldRibbon } from "../components/phone/YieldRibbon";

// inside PhaseView, replacing the withdraw branch:
if (phase === "withdraw") {
  const aimedAt = Object.entries(game.round.commits)
    .filter(([sid, c]) => sid !== me.id && c.target === me.id && !c.withdrew)
    .map(([sid]) => game.players.find(p => p.id === sid))
    .filter(Boolean) as Player[];
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", padding: "1rem" }}>
      <Box sx={{ textAlign: "center" }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", letterSpacing: "0.36em", color: palette.paperDim }}>
          {aimedAt.length === 0 ? "— NO ONE TAKES AIM AT YE —" : `— ${ROMAN[aimedAt.length] ?? aimedAt.length} TAKE AIM AT YE —`}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", gap: "0.55rem", marginTop: "0.45rem", flexWrap: "wrap" }}>
          {aimedAt.map(p => (
            <Box key={p.id} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0.35rem", alignItems: "center", border: `1.5px solid ${palette.blood}`, padding: "0.25rem 0.5rem 0.25rem 0.3rem" }}>
              <Box sx={{ width: 28, height: 28, border: `1.5px solid ${palette.paper}`, background: flagColor(p.colorOrAvatar), color: palette.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FlagFor id={p.colorOrAvatar} size={20} />
              </Box>
              <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", letterSpacing: "0.14em" }}>{p.displayName}</Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
        <YieldRibbon
          yielded={!!myCommit?.withdrew}
          onToggle={() => submitDuck(me.id, !myCommit?.withdrew)}
        />
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.65rem", letterSpacing: "0.3em", textAlign: "center", color: palette.paperDim, marginTop: "1rem" }}>
          COST: ONE YELLOW STREAK
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.78rem", letterSpacing: "0.04em", color: palette.paper, marginTop: "0.15rem" }}>
            —$5,000 at the end of the day
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

const ROMAN = ["", "I","II","III","IV","V","VI","VII","VIII"];
```

Add the necessary imports at the top: `palette`, `flagColor`, `FlagFor`, `fonts`.

- [ ] **Step 2: Run tests + dev**

Run: `npm test && npm run build`
Expected: PASS.

Verify in dev that the yield phase renders the attacker chips, ribbon, and cost line.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlayerPage.tsx
git commit -m "feat(phone): wire YieldRibbon for withdraw phase with attackers list"
```

### Task 6.5: `<Spectator>` view

**Files:**
- Create: `src/components/phone/Spectator.tsx`
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { Game } from "../../game/types";
import { CrewRoster } from "../crew/CrewRoster";

interface SpectatorProps {
  game: Game;
  eliminated?: boolean;
  eliminatedRound?: number;
}

const ROMAN = ["", "i","ii","iii","iv","v","vi","vii","viii"];

export function Spectator({ game, eliminated, eliminatedRound }: SpectatorProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", padding: "0.8rem 0.6rem", overflow: "auto" }}>
      {eliminated && (
        <Box sx={{ textAlign: "center", padding: "1rem", marginBottom: "0.5rem", border: `1px solid ${palette.blood}`, color: palette.blood }}>
          <Box sx={{ fontFamily: fonts.blackletter, fontSize: "1.6rem", lineHeight: 1 }}>
            YE WALKED THE PLANK
          </Box>
          {eliminatedRound != null && (
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", marginTop: "0.3rem" }}>
              — round {ROMAN[eliminatedRound] ?? eliminatedRound} —
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", letterSpacing: "0.4em", textAlign: "center", color: palette.paperDim, marginBottom: "0.4rem" }}>
        WATCH THE BIG SCREEN
      </Box>
      <CrewRoster game={game} />
    </Box>
  );
}
```

- [ ] **Step 2: Wire into PlayerPage**

Replace the `me.status === "dead"` branch and the `phase === "reveal_*" / "split"` branches in `PhaseView` with:

```tsx
import { Spectator } from "../components/phone/Spectator";

// in PhaseView
if (me.status === "dead") {
  return <Spectator game={game} eliminated />;
}
if (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
  return <Spectator game={game} />;
}
```

- [ ] **Step 3: Run tests**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/phone/Spectator.tsx src/pages/PlayerPage.tsx
git commit -m "feat(phone): add Spectator mirror for reveal/split/eliminated states"
```

---

## Stage 7 — Player join — ✅ DONE

> Built `<FlagPickerGrid>`, refactored `PlayerJoinPage`. Followed the spec closely. The picker is the one place in the app where the original pirate flag SVGs are still used (rather than the per-color jolly rogers) — the player is choosing which historical pirate to fly under, and the distinct flag designs are how they tell the options apart. After they've picked, `jollyRogerForColor` represents them in-game.
>
> Sub-cleanup: extracted `jollyRogerForColor` into its own file (`src/components/flags/jollyRogerForColor.ts`) so `flags/index.tsx` is exclusively components, satisfying the `react-refresh/only-export-components` lint rule. Existing import sites are unchanged (re-exported from the index).

The first thing each player sees on their device.

### Task 7.1: `<FlagPickerGrid>`

**Files:**
- Create: `src/components/flags/FlagPickerGrid.tsx`
- Create: `src/components/flags/FlagPickerGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FlagPickerGrid } from "./FlagPickerGrid";

describe("FlagPickerGrid", () => {
  it("renders all flag tiles", () => {
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={() => {}} />);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
    expect(screen.getByText("BLACKBEARD")).toBeInTheDocument();
    expect(screen.getByText("STEDE BONNET")).toBeInTheDocument();
  });

  it("disables taken flags", () => {
    render(<FlagPickerGrid taken={new Set(["calico_jack"])} value={null} onChange={() => {}} />);
    const tile = screen.getByText("CALICO JACK").closest("[data-flag-id]") as HTMLElement;
    expect(tile.getAttribute("data-disabled")).toBe("true");
  });

  it("calls onChange when an available flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={fn} />);
    fireEvent.click(screen.getByText("BLACKBEARD").closest("[data-flag-id]")!);
    expect(fn).toHaveBeenCalledWith("blackbeard");
  });

  it("does not call onChange when a taken flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set(["blackbeard"])} value={null} onChange={fn} />);
    fireEvent.click(screen.getByText("BLACKBEARD").closest("[data-flag-id]")!);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/flags/FlagPickerGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from ".";
import { FLAG_IDS, FLAG_LABELS } from "../../game/playerFlags";

interface FlagPickerGridProps {
  taken: Set<string>;
  value: string | null;
  onChange: (id: string) => void;
}

export function FlagPickerGrid({ taken, value, onChange }: FlagPickerGridProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.55rem", padding: "0.4rem 0.85rem" }}>
      {FLAG_IDS.map((id, i) => {
        const isTaken = taken.has(id);
        const isSel = value === id;
        const lastSlot = i === FLAG_IDS.length - 1 && FLAG_IDS.length % 3 === 1;
        return (
          <Box
            key={id}
            role="button"
            tabIndex={isTaken ? -1 : 0}
            data-flag-id={id}
            data-disabled={isTaken ? "true" : "false"}
            onClick={() => !isTaken && onChange(id)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (isTaken) return;
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(id); }
            }}
            sx={{
              gridColumn: lastSlot ? 2 : undefined,
              background: isSel ? palette.ink : isTaken ? "rgba(20,17,13,0.06)" : palette.inkUp,
              border: `2px ${isTaken ? "dashed" : "solid"} ${isTaken ? palette.paperFaint : palette.paper}`,
              boxShadow: isSel ? `3px 3px 0 ${palette.blood}, inset 0 0 0 2px ${palette.paper}` : !isTaken ? `2px 2px 0 ${palette.inkDeep}` : "none",
              transform: isSel ? "translateY(-2px)" : "none",
              aspectRatio: "1",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: isTaken ? palette.paperFaint : flagColor(id),
              cursor: isTaken ? "not-allowed" : "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <FlagFor id={id} size={36} />
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.5rem", letterSpacing: "0.16em", marginTop: "0.25rem", color: isTaken ? palette.paperFaint : isSel ? palette.paper : palette.paper }}>
              {FLAG_LABELS[id]}
            </Box>
            {isTaken && (
              <Box sx={{ position: "absolute", bottom: 5, left: 0, right: 0, textAlign: "center", fontFamily: fonts.displayCaps, fontSize: "0.5rem", letterSpacing: "0.2em", color: palette.paperFaint }}>
                TAKEN
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/flags/FlagPickerGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/flags/FlagPickerGrid.tsx src/components/flags/FlagPickerGrid.test.tsx
git commit -m "feat(flags): add FlagPickerGrid for player-join flag selection"
```

### Task 7.2: Refactor `PlayerJoinPage`

**Files:**
- Modify: `src/pages/PlayerJoinPage.tsx`

- [ ] **Step 1: Rewrite using shell + FlagPickerGrid**

```tsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Alert, CircularProgress } from "@mui/material";
import { joinPlayer } from "react-gameroom";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { FlagPickerGrid } from "../components/flags/FlagPickerGrid";
import { takenFlags } from "../game/playerFlags";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import type { Player } from "../game/types";

export default function PlayerJoinPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { roomState, loading, error, updateRoom } = useFirebaseRoom(id);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }
  if (error || !roomState) {
    return <Alert severity="error">{error ?? t("room.notFound")}</Alert>;
  }
  if (roomState.status === "started") {
    const claimed = roomState.players.filter(p => p.status !== "empty");
    return (
      <Box sx={{ width: "100vw", height: "100vh", padding: "8px", boxSizing: "border-box" }}>
        <PageCanvas borderRadius={28} sx={{ width: "100%", height: "100%" }}>
          <Box sx={{ flex: 1, padding: "1.5rem" }}>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.85rem", letterSpacing: "0.32em", color: palette.paperDim, textAlign: "center", marginBottom: "1rem" }}>
              {t("playerJoin.rejoinTitle")}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {claimed.map(p => (
                <Button key={p.id} variant="ghost" onClick={() => navigate(`/room/${id}/player/${p.id}`)} fullWidth>
                  {(p.name ?? `Player ${p.id}`).toString()}
                </Button>
              ))}
            </Box>
          </Box>
        </PageCanvas>
      </Box>
    );
  }

  const empty = roomState.players.find(p => p.status === "empty");
  if (!empty) {
    return <Alert severity="info">{t("playerJoin.lobbyFull")}</Alert>;
  }

  const taken = takenFlags(roomState.players.map(p => p.data));

  const onSubmit = async () => {
    if (!name.trim() || !flag || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const newPlayer: Player = {
        id: String(empty.id),
        displayName: name.trim(),
        colorOrAvatar: flag,
        bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
      };
      const updated = joinPlayer(roomState, empty.id, name.trim(), newPlayer);
      await updateRoom(updated);
      navigate(`/room/${id}/player/${empty.id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: "8px", boxSizing: "border-box" }}>
      <PageCanvas borderRadius={28} sx={{ width: "100%", height: "100%" }}>
        <Box sx={{ textAlign: "center", padding: "1rem 0 0.4rem" }}>
          <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.7rem", letterSpacing: "0.4em", color: palette.paperDim }}>
            ROOM <Box component="em" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.1em", color: palette.paper }}>{roomState.roomId}</Box>
          </Box>
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", color: palette.paperDim, marginTop: "0.15rem" }}>
            The Standoff
          </Box>
        </Box>
        <Box sx={{ textAlign: "center", padding: "0.7rem 0 0.4rem", fontFamily: fonts.blackletter, fontSize: "1.6rem", lineHeight: 1, letterSpacing: "0.02em" }}>
          — RAISE YER FLAG —
        </Box>

        <FlagPickerGrid taken={taken} value={flag} onChange={(id) => setFlag(id)} />

        <Box sx={{ padding: "0.7rem 0.85rem 0.4rem" }}>
          <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.6rem", letterSpacing: "0.36em", color: palette.paperDim, textAlign: "center", marginBottom: "0.35rem" }}>
            CHOOSE A NICKNAME
          </Box>
          <Box
            component="input"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Cap'n Maud"
            sx={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${palette.paper}`,
              textAlign: "center",
              width: "100%",
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              color: palette.paper,
              padding: "0.4rem 0.4rem 0.3rem",
              "&:focus": { outline: "none", borderColor: palette.blood },
            }}
            maxLength={24}
          />
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", color: palette.paperFaint, textAlign: "center", marginTop: "0.3rem" }}>
            — or leave it &amp; we'll pick one —
          </Box>
        </Box>

        {submitError && <Alert severity="error" sx={{ margin: "0 0.85rem" }}>{submitError}</Alert>}

        <Box sx={{ padding: "0.6rem 0.85rem 0.85rem" }}>
          <Button
            fullWidth
            disabled={!name.trim() || !flag || submitting}
            onClick={onSubmit}
            caption="— join the mutiny —"
          >
            RAISE THE FLAG
          </Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Open `/room/<id>/player`. Verify the flag picker grid renders, the nickname input has the inked underline, and tapping RAISE THE FLAG joins the room.

- [ ] **Step 3: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PlayerJoinPage.tsx
git commit -m "feat(phone): rebuild PlayerJoinPage with FlagPickerGrid and PageCanvas"
```

---

## Stage 8 — Static pages — ✅ DONE

> Refactored `HomePage`, `HowToPlayPage`, `JoinPage` per spec. HowToPlayPage's lead "mutiny" paragraph gets a blood-coloured displayCaps drop-cap on its first letter; step list updated to `Quickdraw!` (was `Broadside!`) to match the i18n rename.

Light pass on Home / How-To-Play / Join. The user explicitly noted these as low-leverage; we keep the changes simple but consistent with the broadside identity.

### Task 8.1: Refactor `HomePage`

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Rewrite the page**

```tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { GenericFlag } from "../components/flags/GenericFlag";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: "8px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PageCanvas sx={{ width: "min(560px, 100%)", padding: "3rem 2rem" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", padding: "1rem" }}>
          <Box sx={{ color: palette.paper }}><GenericFlag size={96} /></Box>
          <Box sx={{ fontFamily: fonts.blackletter, fontSize: "4rem", lineHeight: 0.9, color: palette.paper, textShadow: "0 0 12px rgba(255, 195, 120, 0.18)" }}>
            {t("home.title")}
          </Box>
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", textAlign: "center", color: palette.paperDim, fontSize: "1rem" }}>
            {t("home.subtitle")}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "0.7rem", width: "min(320px, 100%)", marginTop: "1rem" }}>
            <Button fullWidth onClick={() => navigate("/join")}>{t("home.newGame").toUpperCase()}</Button>
            <Button variant="ghost" fullWidth onClick={() => navigate("/join")}>{t("home.resumeGame").toUpperCase()}</Button>
            <Button variant="text" fullWidth onClick={() => navigate("/how-to-play")}>{t("home.howToPlay")}</Button>
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}
```

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`. Open `/`. Verify dark canvas, blackletter "Standoff" title, three buttons in primary/ghost/text variants.

- [ ] **Step 3: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(home): rebuild HomePage on PageCanvas with broadside button stack"
```

### Task 8.2: Refactor `HowToPlayPage`

**Files:**
- Modify: `src/pages/HowToPlayPage.tsx`

- [ ] **Step 1: Rewrite as a 2-column ballad**

```tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Button } from "../components/shell/Button";

export default function HowToPlayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", padding: "8px", boxSizing: "border-box" }}>
      <PageCanvas sx={{ width: "min(960px, 100%)", margin: "0 auto", minHeight: "calc(100vh - 16px)" }}>
        <Masthead
          left="HOW TO PLAY"
          right="— a true ballad —"
        />
        <Box sx={{ padding: "1.5rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderTop: `4px double ${palette.ruleStrong}`, borderBottom: `4px double ${palette.ruleStrong}` }}>
          <Section title="The mutiny">
            <FirstLetter>The captain is dead. His hoard is on the table. The navy is hours out. Eight rounds — each one a fresh chance to point a flintlock at a crewmate, see who flinches first, and take a cut of the spoils.</FirstLetter>
          </Section>
          <Section title="Each round">
            <ol style={{ paddingLeft: "1rem", margin: 0 }}>
              <li><strong>Load &amp; aim.</strong> On yer phone, pick a powder load and a mate to point at.</li>
              <li><strong>Standoff.</strong> Three… two… one… aim true. Targets revealed.</li>
              <li><strong>Yield.</strong> Anyone aimed at can yield (and take a yellow streak). Yielded mates can't be shot.</li>
              <li><strong>Quickdraw!</strong> Triple-loaded shots hit first.</li>
              <li><strong>Shots.</strong> Single shots resolve. <em>Click</em> means yer powder were wet — no harm.</li>
              <li><strong>Split.</strong> Mates still standing divide the hoard. Whole coins only.</li>
            </ol>
          </Section>
          <Section title="Winning">
            Survive eight rounds with the most coin (minus $5,000 per yellow streak). Or be the last mate standing. Either way: ye walk away rich, or ye walk the plank.
          </Section>
          <Section title="The crew">
            Four to six mates per game. Each picks a flag and a nickname. Once the captain hoists the colours, no new crew can join.
          </Section>
        </Box>
        <Box sx={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "center" }}>
          <Button variant="ghost" onClick={() => navigate("/")}>{t("howToPlay.back").toUpperCase()}</Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.95rem", letterSpacing: "0.1em", marginBottom: "0.4rem", color: palette.paper }}>
        {title}
      </Box>
      <Box sx={{ fontFamily: fonts.body, fontSize: "0.95rem", lineHeight: 1.5, color: palette.paper }}>
        {children}
      </Box>
    </Box>
  );
}

function FirstLetter({ children }: { children: string }) {
  // Drop-cap on the first letter of the first paragraph.
  return (
    <Box sx={{
      "&::first-letter": {
        fontFamily: fonts.displayCaps,
        fontSize: "3.4em",
        float: "left",
        lineHeight: 0.85,
        padding: "0.05em 0.18em 0 0",
      },
    }}>
      {children}
    </Box>
  );
}
```

- [ ] **Step 2: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HowToPlayPage.tsx
git commit -m "feat(how-to-play): rebuild as 2-column broadside ballad with drop-cap"
```

### Task 8.3: Refactor `JoinPage`

**Files:**
- Modify: `src/pages/JoinPage.tsx`

- [ ] **Step 1: Rewrite the join form**

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Divider } from "@mui/material";
import { createInitialRoom, generateRoomId } from "react-gameroom";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { roomExists } from "../hooks/useFirebaseRoom";
import type { Player } from "../game/types";

const ROOM_CONFIG = { minPlayers: 4, maxPlayers: 6, requireFull: false };

async function createRoom(): Promise<string> {
  const roomId = generateRoomId();
  const initial = { ...createInitialRoom<Player>(ROOM_CONFIG), roomId };
  await set(ref(database, `rooms/${roomId}/state`), initial);
  return roomId;
}

export default function JoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"create" | "join" | null>(null);

  const onCreate = async () => {
    setSubmitting("create");
    setError(null);
    try {
      const id = await createRoom();
      navigate(`/room/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(null);
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitting("join");
    setError(null);
    try {
      const exists = await roomExists(trimmed);
      if (!exists) {
        setError(t("join.notFound"));
        setSubmitting(null);
        return;
      }
      navigate(`/room/${trimmed}/player`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(null);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", padding: "8px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PageCanvas sx={{ width: "min(480px, 100%)", padding: "2rem" }}>
        <Box sx={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Box sx={{ fontFamily: fonts.blackletter, fontSize: "2rem", textAlign: "center", color: palette.paper }}>
            {t("join.title")}
          </Box>

          <Button fullWidth onClick={onCreate} disabled={submitting !== null} caption="— hoist new colours —">
            {submitting === "create" ? "Boarding…" : t("join.createNew").toUpperCase()}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}

          <Divider sx={{ borderColor: palette.ruleStrong, "&::before, &::after": { borderColor: palette.ruleStrong }, color: palette.paperDim, fontFamily: fonts.body, fontStyle: "italic" }}>
            {t("join.or")}
          </Divider>

          <Box component="form" onSubmit={onJoin} sx={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", letterSpacing: "0.36em", color: palette.paperDim, textAlign: "center" }}>
              {t("join.codeLabel").toUpperCase()}
            </Box>
            <Box
              component="input"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
              placeholder={t("join.codePlaceholder")}
              autoFocus
              maxLength={8}
              sx={{
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${palette.paper}`,
                textAlign: "center",
                fontFamily: fonts.displayCaps,
                fontSize: "2rem",
                letterSpacing: "0.36em",
                color: palette.paper,
                padding: "0.4rem 0.4rem 0.3rem",
                textTransform: "uppercase",
                "&:focus": { outline: "none", borderColor: palette.blood },
              }}
            />
            <Button type="ghost" fullWidth disabled={!code.trim() || submitting !== null} onClick={(onJoin as unknown as () => void)}>
              {submitting === "join" ? "Boarding…" : t("join.joinSubmit").toUpperCase()}
            </Button>
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}
```

Note: `<Button>` doesn't currently take a `type` prop. The form submit can be wired through onClick instead, or extended in Task 0.4 if `submit` semantics matter; for now `onJoin` passes through.

- [ ] **Step 2: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/JoinPage.tsx
git commit -m "feat(join): rebuild JoinPage with broadside form on PageCanvas"
```

---

## Stage 9 — Cleanup — ✅ DONE

> Deleted obsolete components: `loot/CaptainsChest`, `loot/Coin`, `loot/` (dir), `MapFrame`, `PowderLoadCard`, `RevealOverlay`. (`FlintlockBarrel` and `YieldButton` were already removed earlier alongside their replacements.)
>
> Pruned 25 unused i18n keys from `en.json` via a script that walks `src/` looking for literal references; kept the dynamic-use false-positives (i18next plural variants `marks_one` / `_other`, plus `load.${id}` template entries).
>
> Final state: 193 tests pass, `tsc -b` clean, `npm run build` clean.

Delete obsolete components, sweep for dead references, run the full suite + build.

### Task 9.1: Delete obsolete components

**Files:**
- Delete: `src/components/loot/CaptainsChest.tsx`
- Delete: `src/components/loot/Coin.tsx`
- Delete: `src/components/loot/` (directory after files are gone)
- Delete: `src/components/MapFrame.tsx`
- Delete: `src/components/FlintlockBarrel.tsx`
- Delete: `src/components/YieldButton.tsx`
- Delete: `src/components/PowderLoadCard.tsx`

- [ ] **Step 1: Verify no live references to each file**

Run:
```bash
for f in CaptainsChest Coin MapFrame FlintlockBarrel YieldButton PowderLoadCard; do
  echo "== $f =="
  grep -rn "$f" src --exclude-dir=node_modules || echo "(no references)"
done
```

Expected: every grep returns "(no references)" or only references inside the file being deleted itself. If any reference remains, fix it before deleting (route the consumer to the new replacement: `Barrel`, `YieldRibbon`, etc.).

- [ ] **Step 2: Delete the files**

```bash
rm src/components/loot/CaptainsChest.tsx
rm src/components/loot/Coin.tsx
rmdir src/components/loot
rm src/components/MapFrame.tsx
rm src/components/FlintlockBarrel.tsx
rm src/components/YieldButton.tsx
rm src/components/PowderLoadCard.tsx
```

- [ ] **Step 3: Run tests + build**

Run: `npm test && npm run build`
Expected: PASS. If any ghost reference surfaces, route it to the new component.

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "chore(cleanup): delete obsolete components after broadside overhaul"
```

### Task 9.2: Sweep for dead i18n keys + dead code

**Files:**
- Modify: `src/locales/en.json` (if dead keys are found)
- Possibly: `src/components/RevealOverlay.tsx` (the existing reveal overlay may now be redundant — if so, delete; if still used by a phase, leave)

- [ ] **Step 1: Search for unused i18n keys**

```bash
node -e "
const en = require('./src/locales/en.json');
const fs = require('fs');
const path = require('path');
function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(f.name)) yield p;
  }
}
const src = [...walk('src')].map(p => fs.readFileSync(p, 'utf8')).join('\n');
function flatten(o, prefix='') {
  for (const k of Object.keys(o)) {
    const key = prefix ? prefix+'.'+k : k;
    if (typeof o[k] === 'object' && o[k] != null) flatten(o[k], key);
    else if (!src.includes(key)) console.log('UNUSED:', key);
  }
}
flatten(en);
"
```

- [ ] **Step 2: Remove any unused keys** (only if the search reports them; some keys are referenced via interpolation and will appear false-positive — be conservative).

- [ ] **Step 3: Decide on RevealOverlay**

Read `src/components/RevealOverlay.tsx`. It was previously used by `RoomPage` for shot toasts. If it's still wired in (via an import in RoomPage), evaluate:
- If the new `RevealBanner` covers its responsibility, delete it.
- If it does something the new banner doesn't (per-shot toasts, click-fizzle audio cues), keep it. The banner is for the "hero" beats; per-shot fizzle stays useful.

Document the decision in the commit message.

- [ ] **Step 4: Run the full suite + build + lint**

```bash
npm test
npm run build
npm run lint
```

Expected: all green.

- [ ] **Step 5: Run the dev server one last time and walk through every surface**

`npm run dev` → visit:
- `/` — home
- `/how-to-play`
- `/join`
- `/room/:id` — lobby state
- `/room/:id` — in-game state (need a phone or second browser tab to start)
- `/room/:id/player` — player join
- `/room/:id/player/:playerId` — phone, all four phases
- `/mock/big-screen/x` — mock with phase selector

Confirm the verification criteria from the spec:
- No surface still uses Pirata One.
- No surface still references "Broadside" as the card name (only as the dramatic-event copy on the reveal banner is acceptable per spec).
- No surface still renders a captain's chest illustration.
- Every surface is on the dark canvas.
- Targeting lines glow during reveal phases.
- Standoff stamp + reveal banner fire in place.

- [ ] **Step 6: Commit**

```bash
git add src/locales/en.json src/components
git commit -m "chore(cleanup): prune dead i18n keys, decide RevealOverlay fate"
```

---

## Self-review notes

- **Spec coverage:** Visual identity (Stage 0), three-column ledger (Stage 1), dramatic moments (Stage 2), lobby (Stage 3), end-game (Stage 4), phone phases (Stages 5–6), player join (Stage 7), static pages (Stage 8), cleanup (Stage 9). Verification criteria from the spec are explicitly walked in Task 9.2 Step 5.
- **Naming consistency:** `<PageCanvas>` (not `PaperCanvas`) used everywhere. Test file convention: `*.test.tsx` for components, `*.test.ts` for pure logic.
- **Game state untouched:** No task modifies anything under `src/game/` — preserves the rule that `react-gameroom` and the game state stay as-is. Nothing changes the `BulletCard` type name; only the rendered string for `bang_bang_bang` flips to "Quickdraw."
- **Open items deferred to playtest** (per spec): wound pips on commit-screen target list, spectator view fidelity, card-back density, empty-seat tile design, sequential rank-by-rank end-game animation. These are noted in the spec's "Open decisions" and intentionally not in the plan.
- **`eliminatedByRound`** is passed as an empty map for now (Task 4.4) because the existing game state does not record it. If/when it lands, swap in.

