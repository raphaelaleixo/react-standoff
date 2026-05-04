# Design overhaul implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Standoff visual layer as a high-contrast broadside print on a dark canvas, replacing the cream-paper scaffolding with an information-rich three-column ledger, an 8-card phone hand, in-place dramatic reveals, and broadside-styled lobby/end-game/static surfaces.

**Architecture:** Bottom-up. Stage 0 lays palette + typography + reusable shells (`<PageCanvas>`, `<Button>`, `<Masthead>`, `<Foot>`). Stage 1 builds the in-game ledger (the most-watched surface). Stage 2 layers in dramatic moments (standoff stamp + reveal banner + line glow). Stages 3–4 wrap big-screen lobby/end-game. Stages 5–6 do the phone surfaces. Stage 7 redoes player join. Stage 8 does the small static-page pass. Stage 9 deletes obsolete components.

**Tech Stack:** React 19 + TypeScript (strict). Vite, MUI, Emotion, react-router-dom, react-gameroom, Firebase RTDB, i18next, Vitest + @testing-library/react. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-04-design-overhaul-design.md`. Read it before starting.

---

## Architecture overview

The dependency graph between stages:

```
Stage 0 (foundations)
  ├─→ Stage 1 (ledger)
  │     ├─→ Stage 2 (dramatic moments)
  │     ├─→ Stage 3 (lobby)
  │     └─→ Stage 4 (end-game)
  ├─→ Stage 5 (phone shell + commit)
  │     └─→ Stage 6 (phone other phases)
  ├─→ Stage 7 (player join — uses phone shell + Stage 0 primitives)
  └─→ Stage 8 (static pages — uses Stage 0 primitives)

Stage 9 (cleanup) runs last; nothing depends on it.
```

Stages 1–4 (big screen) and Stages 5–6 (phone) are independent after Stage 0 finishes. They can run in parallel if multiple workers are available; otherwise the order above is safe.

## File structure

### Files to create

```
src/theme/typography.ts           # font-family stack tokens
src/components/shell/
  PageCanvas.tsx                  # dark canvas + grain + warm spills
  PageCanvas.test.tsx
  Button.tsx                      # primary / ghost / text variants
  Button.test.tsx
  Masthead.tsx                    # 3-column blackletter masthead
  Masthead.test.tsx
  Foot.tsx                        # 3-column foot
  Foot.test.tsx
  PhoneShell.tsx                  # phone-shaped PageCanvas + header strip
  PhoneShell.test.tsx
src/components/icons/
  DenominationIcon.tsx            # silver / gold / jewel
  DenominationIcon.test.tsx
src/components/hoard/
  HoardItem.tsx                   # one banknote row
  HoardItem.test.tsx
  HoardList.tsx                   # full hoard column
  HoardList.test.tsx
src/components/standoff/
  Roundel.tsx                     # flag-cartouche for the map
  Roundel.test.tsx
  TargetingMap.tsx                # hex of roundels + SVG lines
  TargetingMap.test.tsx
  geometry.ts                     # seat positions + pair geometry helpers
  geometry.test.ts
  StandoffStamp.tsx               # countdown numeral overlay
  StandoffStamp.test.tsx
  RevealBanner.tsx                # broadside / kill banner
  RevealBanner.test.tsx
src/components/crew/
  CrewRow.tsx                     # one player row
  CrewRow.test.tsx
  CrewRoster.tsx                  # full crew column
  CrewRoster.test.tsx
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
  navyHours.ts                    # round → "navy ~N hours" string helper
  navyHours.test.ts
```

### Files to modify

```
index.html                       # google fonts <link> tags
src/theme/colors.ts              # full palette rewrite
src/theme/theme.ts               # MUI theme rebuilt around new typography
src/i18n.ts                      # unchanged shape — bundle still imports en.json
src/locales/en.json              # broadside copy + quickdraw rename + new strings
src/components/GameBoard.tsx     # becomes 25/50/25 orchestrator
src/pages/RoomPage.tsx           # lobby/in-game/end-game branches use new screens
src/pages/PlayerPage.tsx         # phase-by-phase rewrite using new phone components
src/pages/PlayerJoinPage.tsx     # uses FlagPickerGrid, PhoneShell
src/pages/HomePage.tsx           # broadside style
src/pages/HowToPlayPage.tsx      # broadside ballad layout
src/pages/JoinPage.tsx           # broadside style
src/pages/MockBigScreen.tsx      # rebuilt to render the ledger with fixture data
```

### Files to delete

```
src/components/loot/CaptainsChest.tsx
src/components/loot/Coin.tsx
src/components/loot/                 # whole directory — no chest, no coin
src/components/MapFrame.tsx
src/components/FlintlockBarrel.tsx
src/components/YieldButton.tsx
src/components/PowderLoadCard.tsx
```

## Conventions used in this plan

- All component tests use `@testing-library/react`. The setup file (`src/test-setup.ts`) is already wired through `vite.config.ts`. Vitest globals are enabled — `describe / it / expect` are global.
- Test commands: `npm test -- <path>` for one file (Vitest's `run` mode), `npm test` for the whole suite.
- Each task ends with a commit. Commit messages follow the project's `type(scope): subject` style (see recent log: `feat(big-screen)`, `refactor(loads)`, etc.).
- New components live in topic folders under `src/components/`. Existing flat-file components stay where they are unless deleted.
- TDD applies to logic-bearing components. Pure-presentation tasks (e.g. updating `colors.ts`) skip the test cycle but still verify by running the existing suite + `npm run build` to catch type breakage.
- Visual fidelity is verified by running `npm run dev` and inspecting `MockBigScreen` (DEV-only route at `/mock/big-screen/:id` — any id works since fixtures are static). Stage 1 rebuilds this mock to drive the rest of the work.

---

## Stage 0 — Foundations

Lay down palette tokens, typography, and the four shell components used by every subsequent stage. After Stage 0, every screen can be assembled out of the foundation pieces; before it, nothing else compiles cleanly.

### Task 0.1: Update palette tokens

**Files:**
- Modify: `src/theme/colors.ts`

- [ ] **Step 1: Replace the full palette export**

Open `src/theme/colors.ts` and replace the entire contents with:

```ts
// Semantic color tokens. The broadside metaphor is preserved: "ink" is the dark
// tone, "paper" is the cream tone. Their roles are inverted vs. a printed page —
// the canvas is ink, the type is paper.

export const palette = {
  // Page surfaces — dark
  ink: "#14110d",
  inkDeep: "#0a0807",
  inkUp: "#2a2118",

  // Type & line work — cream
  paper: "#ede0c4",
  paperDim: "#b8a888",
  paperFaint: "#6e5c40",

  // Hairlines & rules — translucent cream
  rule: "rgba(237, 224, 196, 0.22)",
  ruleStrong: "rgba(237, 224, 196, 0.45)",

  // Accents — calibrated for dark backgrounds
  blood: "#c93a30",
  gold: "#d4a85a",
  goldDeep: "#a8842c",
  yellow: "#e6c440",
  jewelPurple: "#b48ac8",
  silverGray: "#d8d2c4",
} as const;

// Per-flag signature color used for card borders, target-picker accents, and chips.
// Lifted vs. previous values where dark contrast required it (blackbeard, edward_low).
export const flagSignatureColors = {
  calico_jack: "#e0473e",  // red, lifted
  blackbeard: "#5a7290",   // navy → slate-blue, lifted for dark contrast
  black_bart: "#d4a85a",   // gold
  henry_avery: "#3a8a78",  // sea green, lifted
  edward_low: "#c0423a",   // burgundy → red, lifted for dark contrast
  stede_bonnet: "#9069a8", // purple, lifted
  generic: "#b8a888",      // paperDim (was ink — unusable on dark)
} as const;

export type FlagId = keyof typeof flagSignatureColors;

export function flagColor(id: string): string {
  return (flagSignatureColors as Record<string, string>)[id] ?? flagSignatureColors.generic;
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run build`
Expected: PASS. Any import sites that referenced `palette.parchment`, `palette.parchmentDark`, `palette.inkSoft`, or `palette.signal` will surface as type errors here. Note the failing files for the next step.

- [ ] **Step 3: Sweep call sites for renamed tokens**

The likely break sites (from the existing code): `src/components/GameBoard.tsx`, `src/components/MapFrame.tsx`, `src/components/PowderLoadCard.tsx`, `src/components/RevealOverlay.tsx`, `src/components/FlintlockBarrel.tsx`, `src/components/YieldButton.tsx`, `src/components/loot/*`, `src/pages/RoomPage.tsx`, `src/pages/PlayerJoinPage.tsx`, `src/pages/HomePage.tsx`.

Update each surfaced reference:
- `palette.parchment` → `palette.paper`
- `palette.parchmentDark` → `palette.paperDim`
- `palette.signal` → `palette.blood`
- `palette.inkSoft` → `palette.paperDim` (these sites get rebuilt later anyway, this just unblocks type-check)
- `palette.goldDeep` stays as is

These files will all be rebuilt in later stages — the goal here is only to keep the build green between commits.

- [ ] **Step 4: Re-run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/colors.ts src/components src/pages
git commit -m "refactor(theme): rewrite palette for dark broadside print"
```

### Task 0.2: Typography tokens & Google Fonts

**Files:**
- Create: `src/theme/typography.ts`
- Modify: `index.html`
- Modify: `src/theme/theme.ts`

- [ ] **Step 1: Create the typography token file**

Create `src/theme/typography.ts`:

```ts
// Font-family tokens. The four-face broadside stack:
//   - blackletter:    masthead title, standoff numeral
//   - displayCaps:    UI labels, button text, headings, status pills, column heads
//   - body:           italic captions, nicknames, flavor lines, hints
//   - bodySc:         small caps for masthead sub-rule
//
// Loaded via Google Fonts <link> in index.html.

export const fonts = {
  blackletter: '"UnifrakturCook", "IM Fell DW Pica SC", Georgia, serif',
  displayCaps: '"IM Fell DW Pica SC", Georgia, serif',
  body: '"IM Fell English", Georgia, serif',
  bodySc: '"IM Fell English SC", Georgia, serif',
} as const;
```

- [ ] **Step 2: Add the Google Fonts link tag to index.html**

Open `index.html` and add inside `<head>`, before the closing tag:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=IM+Fell+DW+Pica+SC&family=IM+Fell+DW+Pica:ital@0;1&family=UnifrakturCook:wght@700&display=swap"
  rel="stylesheet">
```

- [ ] **Step 3: Rewrite the MUI theme**

Replace `src/theme/theme.ts` contents entirely:

```ts
import { createTheme } from "@mui/material/styles";
import { palette } from "./colors";
import { fonts } from "./typography";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: palette.ink,
      paper: palette.inkUp,
    },
    text: {
      primary: palette.paper,
      secondary: palette.paperDim,
      disabled: palette.paperFaint,
    },
    primary: { main: palette.paper, contrastText: palette.ink },
    error: { main: palette.blood },
    warning: { main: palette.yellow },
    success: { main: palette.gold, contrastText: palette.ink },
    divider: palette.ruleStrong,
  },
  typography: {
    fontFamily: fonts.body,
    h1: { fontFamily: fonts.blackletter, letterSpacing: "0.02em" },
    h2: { fontFamily: fonts.blackletter, letterSpacing: "0.02em" },
    h3: { fontFamily: fonts.displayCaps, letterSpacing: "0.04em" },
    h4: { fontFamily: fonts.displayCaps, letterSpacing: "0.06em" },
    h5: { fontFamily: fonts.displayCaps, letterSpacing: "0.18em" },
    h6: { fontFamily: fonts.displayCaps, letterSpacing: "0.18em" },
    button: {
      fontFamily: fonts.displayCaps,
      letterSpacing: "0.32em",
      fontWeight: 400,
    },
    overline: {
      fontFamily: fonts.displayCaps,
      letterSpacing: "0.36em",
      fontSize: "0.75rem",
    },
  },
});

export default theme;
```

- [ ] **Step 4: Verify build still passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/typography.ts src/theme/theme.ts index.html
git commit -m "feat(theme): broadside typography stack on a dark MUI theme"
```

### Task 0.3: `<PageCanvas>` component

**Files:**
- Create: `src/components/shell/PageCanvas.tsx`
- Create: `src/components/shell/PageCanvas.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/shell/PageCanvas.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { PageCanvas } from "./PageCanvas";

describe("PageCanvas", () => {
  it("renders children on the canvas", () => {
    render(
      <PageCanvas data-testid="canvas">
        <span>hello</span>
      </PageCanvas>
    );
    expect(screen.getByTestId("canvas")).toContainHTML("hello");
  });

  it("applies aspect ratio when provided", () => {
    render(<PageCanvas aspectRatio="16 / 9" data-testid="canvas">x</PageCanvas>);
    const node = screen.getByTestId("canvas");
    expect(node.style.aspectRatio).toBe("16 / 9");
  });

  it("applies border radius when provided", () => {
    render(<PageCanvas borderRadius={28} data-testid="canvas">x</PageCanvas>);
    const node = screen.getByTestId("canvas");
    expect(node.style.borderRadius).toBe("28px");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/components/shell/PageCanvas.test.tsx`
Expected: FAIL — module `./PageCanvas` not found.

- [ ] **Step 3: Implement `<PageCanvas>`**

Create `src/components/shell/PageCanvas.tsx`:

```tsx
import { Box, type BoxProps } from "@mui/material";
import { palette } from "../../theme/colors";

const NOISE_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
  "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/>" +
  "<feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.88  0 0 0 0 0.74  0 0 0 0.10 0'/></filter>" +
  "<rect width='240' height='240' filter='url(%23n)'/></svg>\")";

interface PageCanvasProps extends Omit<BoxProps, "children"> {
  aspectRatio?: string;
  borderRadius?: number;
  children: React.ReactNode;
}

export function PageCanvas({ aspectRatio, borderRadius, children, sx, ...rest }: PageCanvasProps) {
  return (
    <Box
      {...rest}
      sx={[
        {
          background: palette.ink,
          color: palette.paper,
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${palette.inkUp}`,
          boxShadow: "inset 0 0 100px rgba(0,0,0,0.6)",
          aspectRatio,
          borderRadius: borderRadius != null ? `${borderRadius}px` : undefined,
          // grain — cream noise, screen blend
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage: NOISE_SVG,
            backgroundSize: "240px 240px",
            mixBlendMode: "screen",
            opacity: 0.45,
            borderRadius: "inherit",
          },
          // warm-light corner spills
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            background:
              "radial-gradient(ellipse at 8% 10%, rgba(255, 195, 120, 0.06), transparent 35%)," +
              "radial-gradient(ellipse at 95% 92%, rgba(255, 195, 120, 0.05), transparent 35%)",
            borderRadius: "inherit",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* contents render above the ::before/::after layers via z-index 2 */}
      <Box sx={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/components/shell/PageCanvas.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/PageCanvas.tsx src/components/shell/PageCanvas.test.tsx
git commit -m "feat(shell): add PageCanvas with grain and warm-light corners"
```

### Task 0.4: `<Button>` component

**Files:**
- Create: `src/components/shell/Button.tsx`
- Create: `src/components/shell/Button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the label", () => {
    render(<Button onClick={() => {}}>RAISE THE FLAG</Button>);
    expect(screen.getByRole("button", { name: /raise the flag/i })).toBeInTheDocument();
  });

  it("renders an italic caption underneath when provided", () => {
    render(<Button caption="— shot · stede bonnet —">READY</Button>);
    expect(screen.getByText("— shot · stede bonnet —")).toBeInTheDocument();
  });

  it("calls onClick when not disabled", () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const fn = vi.fn();
    render(<Button onClick={fn} disabled>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("renders ghost and text variants", () => {
    const { rerender } = render(<Button variant="ghost">A</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "ghost");
    rerender(<Button variant="text">B</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "text");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/shell/Button.test.tsx`
Expected: FAIL — `./Button` not found.

- [ ] **Step 3: Implement `<Button>`**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Variant = "primary" | "ghost" | "text";

interface ButtonProps {
  variant?: Variant;
  children: React.ReactNode;
  caption?: string;
  emphasis?: boolean;       // primary only — adds the blood drop-shadow (HOIST THE COLOURS)
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export function Button({
  variant = "primary",
  children,
  caption,
  emphasis,
  onClick,
  disabled,
  fullWidth,
  ariaLabel,
}: ButtonProps) {
  const baseSx = {
    display: fullWidth ? "block" : "inline-block",
    width: fullWidth ? "100%" : "auto",
    fontFamily: fonts.displayCaps,
    letterSpacing: "0.32em",
    fontSize: "1rem",
    textAlign: "center" as const,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    border: "none",
    "&:active": disabled ? undefined : { transform: "translateY(1px)" },
  };

  const variantSx =
    variant === "primary"
      ? {
          background: palette.paper,
          color: palette.ink,
          padding: "0.85rem 1.4rem",
          boxShadow: emphasis
            ? `0 0 0 4px ${palette.ink}, 5px 5px 0 ${palette.blood}`
            : `5px 5px 0 ${palette.inkDeep}`,
        }
      : variant === "ghost"
      ? {
          background: "transparent",
          color: palette.paper,
          padding: "0.7rem 1.2rem",
          border: `1.5px solid ${palette.paper}`,
        }
      : {
          background: "transparent",
          color: palette.paper,
          padding: "0.4rem 0.6rem",
          textDecoration: "underline",
          textUnderlineOffset: "4px",
        };

  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-variant={variant}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{ ...baseSx, ...variantSx }}
    >
      <Box>{children}</Box>
      {caption && (
        <Box
          sx={{
            display: "block",
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: "0.66rem",
            letterSpacing: "0.04em",
            color: variant === "primary" ? palette.paperFaint : palette.paperDim,
            marginTop: "0.15rem",
          }}
        >
          {caption}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/shell/Button.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/Button.tsx src/components/shell/Button.test.tsx
git commit -m "feat(shell): add Button with primary/ghost/text variants and emphasis"
```

### Task 0.5: `<Masthead>` component

**Files:**
- Create: `src/components/shell/Masthead.tsx`
- Create: `src/components/shell/Masthead.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Masthead } from "./Masthead";

describe("Masthead", () => {
  it("renders all three slots", () => {
    render(<Masthead left="ROUND III" center="The Standoff" right="PHASE standoff" />);
    expect(screen.getByText("ROUND III")).toBeInTheDocument();
    expect(screen.getByText("The Standoff")).toBeInTheDocument();
    expect(screen.getByText("PHASE standoff")).toBeInTheDocument();
  });

  it("renders the sub-rule when provided", () => {
    render(<Masthead center="The Standoff" centerSub="A NEW & TRUE BALLAD OF MUTINY" />);
    expect(screen.getByText(/A NEW & TRUE BALLAD/)).toBeInTheDocument();
  });

  it("falls back to default centre when center omitted", () => {
    render(<Masthead left="x" right="y" />);
    expect(screen.getByText("The Standoff")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/shell/Masthead.test.tsx`
Expected: FAIL — `./Masthead` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface MastheadProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  centerSub?: React.ReactNode;
  right?: React.ReactNode;
}

const DEFAULT_SUB = "A NEW & TRUE BALLAD OF MUTINY · MMXXVI";

export function Masthead({ left, center = "The Standoff", centerSub = DEFAULT_SUB, right }: MastheadProps) {
  return (
    <Box
      component="header"
      sx={{
        borderBottom: `4px double ${palette.ruleStrong}`,
        padding: "0.7rem 1.5rem 0.55rem",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "end",
        gap: "1.2rem",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "0.78rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          paddingBottom: "0.45rem",
        }}
      >
        {left}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "2.1rem",
            lineHeight: 0.9,
            letterSpacing: "0.02em",
            color: palette.paper,
            textShadow: "0 0 12px rgba(255, 195, 120, 0.15)",
          }}
        >
          {center}
        </Box>
        {centerSub && (
          <Box
            sx={{
              fontFamily: fonts.bodySc,
              fontSize: "0.6rem",
              letterSpacing: "0.36em",
              color: palette.paperDim,
              marginTop: "0.18rem",
            }}
          >
            {centerSub}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          textAlign: "right",
          fontFamily: fonts.displayCaps,
          fontSize: "0.78rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          paddingBottom: "0.45rem",
        }}
      >
        {right}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/shell/Masthead.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/Masthead.tsx src/components/shell/Masthead.test.tsx
git commit -m "feat(shell): add Masthead with 3-slot blackletter header"
```

### Task 0.6: `<Foot>` component

**Files:**
- Create: `src/components/shell/Foot.tsx`
- Create: `src/components/shell/Foot.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Foot } from "./Foot";

describe("Foot", () => {
  it("renders the three slots", () => {
    render(<Foot left="VI ALIVE" cry="— hold the line —" right="NEXT" />);
    expect(screen.getByText("VI ALIVE")).toBeInTheDocument();
    expect(screen.getByText("— hold the line —")).toBeInTheDocument();
    expect(screen.getByText("NEXT")).toBeInTheDocument();
  });

  it("renders nothing for an undefined slot", () => {
    const { container } = render(<Foot cry="x" />);
    // both side slots collapse to empty divs but the layout stays 3-column
    expect(container.querySelectorAll("[data-foot-slot]")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/shell/Foot.test.tsx`
Expected: FAIL — `./Foot` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface FootProps {
  left?: React.ReactNode;
  cry?: React.ReactNode;
  right?: React.ReactNode;
}

export function Foot({ left, cry, right }: FootProps) {
  return (
    <Box
      component="footer"
      sx={{
        padding: "0.4rem 1.5rem 0.45rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        fontFamily: fonts.displayCaps,
        fontSize: "0.65rem",
        letterSpacing: "0.18em",
        color: palette.paper,
        flexShrink: 0,
      }}
    >
      <Box data-foot-slot="left">{left}</Box>
      <Box
        data-foot-slot="cry"
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.95rem",
          letterSpacing: "0.05em",
          color: palette.paperDim,
        }}
      >
        {cry}
      </Box>
      <Box data-foot-slot="right" sx={{ textAlign: "right" }}>
        {right}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/shell/Foot.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/Foot.tsx src/components/shell/Foot.test.tsx
git commit -m "feat(shell): add Foot with 3-slot layout"
```

---

## Stage 1 — In-game ledger

The most important surface. Builds the 25/50/25 column structure and every component inside it. After this stage, the in-game big screen reads as the broadside ledger from the spec.

### Task 1.1: `<DenominationIcon>`

**Files:**
- Create: `src/components/icons/DenominationIcon.tsx`
- Create: `src/components/icons/DenominationIcon.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { DenominationIcon } from "./DenominationIcon";

describe("DenominationIcon", () => {
  it("renders the silver variant", () => {
    render(<DenominationIcon value={5000} aria-label="silver" />);
    expect(screen.getByLabelText("silver")).toBeInTheDocument();
  });
  it("renders the gold variant", () => {
    render(<DenominationIcon value={10000} aria-label="gold" />);
    expect(screen.getByLabelText("gold")).toBeInTheDocument();
  });
  it("renders the jewel variant", () => {
    render(<DenominationIcon value={20000} aria-label="jewel" />);
    expect(screen.getByLabelText("jewel")).toBeInTheDocument();
  });
  it("respects the size prop", () => {
    render(<DenominationIcon value={5000} size={32} aria-label="x" />);
    const svg = screen.getByLabelText("x");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/icons/DenominationIcon.test.tsx`
Expected: FAIL — `./DenominationIcon` not found.

- [ ] **Step 3: Implement**

```tsx
import { palette } from "../../theme/colors";

type Denomination = 5000 | 10000 | 20000;

interface DenominationIconProps {
  value: Denomination;
  size?: number;
  "aria-label"?: string;
}

export function DenominationIcon({ value, size = 22, "aria-label": ariaLabel }: DenominationIconProps) {
  if (value === 5000) {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="9" fill={palette.silverGray} stroke={palette.paper} strokeWidth="2" />
      </svg>
    );
  }
  if (value === 10000) {
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
        <circle cx="14" cy="14" r="10" fill={palette.gold} stroke={palette.paper} strokeWidth="2" />
        <circle cx="14" cy="14" r="6" fill="none" stroke={palette.paper} strokeWidth="1" />
      </svg>
    );
  }
  // 20000 — jeweled piece
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-label={ariaLabel}>
      <circle cx="14" cy="14" r="11" fill={palette.yellow} stroke={palette.paper} strokeWidth="2" />
      <path
        d="M14 8a3 3 0 100 6 3 3 0 100 6 3 3 0 110-6 3 3 0 110-6z"
        fill={palette.jewelPurple}
      />
    </svg>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/icons/DenominationIcon.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/icons
git commit -m "feat(icons): add DenominationIcon for silver/gold/jewel"
```

### Task 1.2: `<HoardItem>`

**Files:**
- Create: `src/components/hoard/HoardItem.tsx`
- Create: `src/components/hoard/HoardItem.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { HoardItem } from "./HoardItem";

describe("HoardItem", () => {
  it("renders the silver row", () => {
    render(<HoardItem value={5000} />);
    expect(screen.getByText("SILVER PIECE")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });
  it("renders the gold doubloon row", () => {
    render(<HoardItem value={10000} />);
    expect(screen.getByText("GOLD DOUBLOON")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });
  it("renders the jeweled piece with the cut-stone subline", () => {
    render(<HoardItem value={20000} />);
    expect(screen.getByText("JEWELED PIECE")).toBeInTheDocument();
    expect(screen.getByText("$20,000")).toBeInTheDocument();
  });
  it("shows a carry-over tag when carry is true", () => {
    render(<HoardItem value={5000} carry />);
    expect(screen.getByText(/from rd\./i)).toBeInTheDocument();
  });
  it("renders the carry-over round number when provided", () => {
    render(<HoardItem value={5000} carry carryFromRound={2} />);
    expect(screen.getByText(/rd\.\s*ii/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/hoard/HoardItem.test.tsx`
Expected: FAIL — `./HoardItem` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { DenominationIcon } from "../icons/DenominationIcon";

const NAMES: Record<number, string> = {
  5000: "SILVER PIECE",
  10000: "GOLD DOUBLOON",
  20000: "JEWELED PIECE",
};

const SUBLINES: Record<number, string | undefined> = {
  20000: "cut emerald",
};

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII",
};

interface HoardItemProps {
  value: 5000 | 10000 | 20000;
  carry?: boolean;
  carryFromRound?: number;
}

export function HoardItem({ value, carry, carryFromRound }: HoardItemProps) {
  const subline = carry
    ? `from rd. ${carryFromRound ? ROMAN[carryFromRound]?.toLowerCase() ?? carryFromRound : "?"}`
    : SUBLINES[value];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.28rem 0.32rem",
        background: carry
          ? `repeating-linear-gradient(45deg, transparent 0 5px, rgba(237,224,196,0.08) 5px 10px)`
          : "rgba(237, 224, 196, 0.05)",
        border: `1px solid ${palette.ruleStrong}`,
      }}
    >
      <DenominationIcon value={value} aria-label={NAMES[value].toLowerCase()} />
      <Box>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.6rem", letterSpacing: "0.16em" }}>
          {NAMES[value]}
        </Box>
        {subline && (
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.55rem", color: palette.paperDim }}>
            {subline}
          </Box>
        )}
      </Box>
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.7rem", letterSpacing: "0.04em" }}>
        ${value.toLocaleString()}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/hoard/HoardItem.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/hoard
git commit -m "feat(hoard): add HoardItem with carry-over hatching and roman round tag"
```

### Task 1.3: `<HoardList>`

**Files:**
- Create: `src/components/hoard/HoardList.tsx`
- Create: `src/components/hoard/HoardList.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { HoardList } from "./HoardList";

describe("HoardList", () => {
  const loot = [
    { value: 20000 as const },
    { value: 10000 as const },
    { value: 10000 as const },
    { value: 5000 as const },
    { value: 5000 as const },
  ];

  it("renders one row per banknote", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getAllByText(/PIECE|DOUBLOON/)).toHaveLength(5);
  });

  it("renders the total", () => {
    render(<HoardList loot={loot} />);
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("shows note count and carry-over count in the subline", () => {
    const withCarry = [...loot, { value: 5000 as const, carryFromRound: 2 }];
    render(<HoardList loot={withCarry} />);
    expect(screen.getByText(/6 NOTES/)).toBeInTheDocument();
    expect(screen.getByText(/1 CARRY-OVER/)).toBeInTheDocument();
  });

  it("hides the carry-over fragment when there are none", () => {
    render(<HoardList loot={loot} />);
    expect(screen.queryByText(/CARRY-OVER/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/hoard/HoardList.test.tsx`
Expected: FAIL — `./HoardList` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { HoardItem } from "./HoardItem";

interface HoardListEntry {
  value: 5000 | 10000 | 20000;
  carryFromRound?: number;
}

interface HoardListProps {
  loot: HoardListEntry[];
}

export function HoardList({ loot }: HoardListProps) {
  const total = loot.reduce((s, n) => s + n.value, 0);
  const carryCount = loot.filter(n => n.carryFromRound != null).length;
  const subline =
    `${loot.length} NOTES` + (carryCount > 0 ? ` · ${carryCount} CARRY-OVER` : "");

  return (
    <Box sx={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontSize: "0.62rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          padding: "0 0 0.25rem",
          borderBottom: `1px solid ${palette.ruleStrong}`,
          marginBottom: "0.45rem",
        }}
      >
        ON THE TABLE
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", letterSpacing: "0.05em", color: palette.paper, marginTop: "0.1rem" }}>
          the captain's hoard
        </Box>
      </Box>
      <Box
        sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontSize: "1.5rem",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: palette.gold,
        }}
      >
        ${total.toLocaleString()}
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.6rem", letterSpacing: "0.18em", color: palette.paperDim, marginTop: "0.12rem" }}>
          {subline}
        </Box>
      </Box>
      <Box sx={{ borderTop: `1px solid ${palette.ruleStrong}`, margin: "0.35rem 0 0.3rem" }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, overflow: "hidden" }}>
        {loot.map((n, i) => (
          <HoardItem
            key={i}
            value={n.value}
            carry={n.carryFromRound != null}
            carryFromRound={n.carryFromRound}
          />
        ))}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/hoard/HoardList.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/hoard/HoardList.tsx src/components/hoard/HoardList.test.tsx
git commit -m "feat(hoard): add HoardList with total, count, and carry-over subline"
```

### Task 1.4: `<Roundel>` flag-cartouche

**Files:**
- Create: `src/components/standoff/Roundel.tsx`
- Create: `src/components/standoff/Roundel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { Roundel } from "./Roundel";

describe("Roundel", () => {
  it("renders the flag and the name", () => {
    render(<Roundel flagId="calico_jack" name="CALICO JACK" />);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
  });

  it("applies a ducked style when ducked", () => {
    render(<Roundel flagId="generic" name="X" ducked data-testid="r" />);
    const node = screen.getByTestId("r");
    expect(node.dataset.state).toBe("ducked");
  });

  it("applies a dim style when dim", () => {
    render(<Roundel flagId="generic" name="X" dim data-testid="r" />);
    const node = screen.getByTestId("r");
    expect(node.dataset.state).toBe("dim");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/standoff/Roundel.test.tsx`
Expected: FAIL — `./Roundel` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";

interface RoundelProps {
  flagId: string;
  name: string;
  ducked?: boolean;
  dim?: boolean;
  size?: number;
  "data-testid"?: string;
}

export function Roundel({
  flagId,
  name,
  ducked,
  dim,
  size = 64,
  "data-testid": testid,
}: RoundelProps) {
  const state = ducked ? "ducked" : dim ? "dim" : "live";
  const transform = ducked ? "rotate(-6deg) scale(0.92)" : "none";
  return (
    <Box data-testid={testid} data-state={state} sx={{ textAlign: "center" }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: palette.inkUp,
          border: `2.5px ${ducked ? "dashed" : "solid"} ${ducked ? palette.paperDim : palette.paper}`,
          boxShadow: `3px 3px 0 ${palette.inkDeep}, inset 0 0 8px rgba(0,0,0,0.4)`,
          color: flagColor(flagId),
          opacity: ducked ? 0.45 : dim ? 0.55 : 1,
          filter: dim ? "saturate(0.6)" : undefined,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform,
          transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
        }}
      >
        <FlagFor id={flagId} size={size * 0.6} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "0.55rem",
          letterSpacing: "0.16em",
          marginTop: "0.25rem",
          color: dim ? palette.paperDim : palette.paper,
          opacity: dim ? 0.7 : 1,
        }}
      >
        {name}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/standoff/Roundel.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/standoff/Roundel.tsx src/components/standoff/Roundel.test.tsx
git commit -m "feat(standoff): add Roundel flag-cartouche with live/dim/ducked states"
```

### Task 1.5: Targeting-map geometry helpers

**Files:**
- Create: `src/components/standoff/geometry.ts`
- Create: `src/components/standoff/geometry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { seatPositions, pairGeometry } from "./geometry";

describe("seatPositions", () => {
  it("returns N positions on a circle of radius RADIUS, top-first clockwise", () => {
    const pos = seatPositions(4, 100);
    expect(pos).toHaveLength(4);
    // 0: top (-90deg) → x=0, y=-100
    expect(pos[0].x).toBeCloseTo(0);
    expect(pos[0].y).toBeCloseTo(-100);
    // 1: right (0deg) → x=100, y=0
    expect(pos[1].x).toBeCloseTo(100);
    expect(pos[1].y).toBeCloseTo(0);
  });

  it("returns 6 positions for the standard hex layout", () => {
    const pos = seatPositions(6, 100);
    expect(pos).toHaveLength(6);
    expect(pos[0].x).toBeCloseTo(0);
    expect(pos[0].y).toBeCloseTo(-100);
  });
});

describe("pairGeometry", () => {
  it("returns C(N, 2) entries", () => {
    const pos = seatPositions(6, 100);
    expect(pairGeometry(pos)).toHaveLength(15);
  });

  it("computes length and rotation for each unordered pair", () => {
    const pairs = pairGeometry([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].length).toBeCloseTo(100);
    expect(pairs[0].rotation).toBeCloseTo(0);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/standoff/geometry.test.ts`
Expected: FAIL — `./geometry` not found.

- [ ] **Step 3: Implement**

```ts
export interface Pos {
  x: number;
  y: number;
}

export interface PairGeom {
  i: number;
  j: number;
  length: number;
  rotation: number; // degrees, atan2(dy, dx)
}

// Top-centered seat positions on a circle of given radius. The first seat
// sits at the top (-90deg) and the rest follow clockwise.
export function seatPositions(n: number, radius: number): Pos[] {
  const out: Pos[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (i * 360) / n) * (Math.PI / 180);
    out.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return out;
}

// Returns geometry for every unordered pair (i < j), with the segment's
// length and the rotation needed to lay a horizontal element from i to j.
export function pairGeometry(positions: Pos[]): PairGeom[] {
  const out: PairGeom[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      out.push({
        i,
        j,
        length: Math.hypot(dx, dy),
        rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/standoff/geometry.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/standoff/geometry.ts src/components/standoff/geometry.test.ts
git commit -m "feat(standoff): extract targeting-map geometry helpers"
```

### Task 1.6: `<TargetingMap>`

**Files:**
- Create: `src/components/standoff/TargetingMap.tsx`
- Create: `src/components/standoff/TargetingMap.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { TargetingMap } from "./TargetingMap";
import type { Game } from "../../game/types";

function makeGame(overrides?: Partial<Game>): Game {
  const base: Game = {
    seed: "x",
    roomId: "x",
    players: ["a", "b", "c", "d", "e", "f"].map(id => ({
      id, displayName: id.toUpperCase(), colorOrAvatar: "generic",
      bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    })),
    round: {
      number: 1,
      phase: "standoff",
      phaseStartedAt: 0,
      loot: [], commits: {},
    },
    bankDeck: [], discardedBullets: [], phase: "playing",
  };
  return { ...base, ...overrides };
}

describe("TargetingMap", () => {
  it("renders one Roundel per player", () => {
    const g = makeGame();
    render(<TargetingMap game={g} />);
    expect(screen.getAllByText(/^[A-F]$/)).toHaveLength(6);
  });

  it("does not draw any targeting lines during commit phase", () => {
    const g = makeGame({ round: { ...makeGame().round, phase: "commit" }});
    const { container } = render(<TargetingMap game={g} />);
    // forward/backward are SVG <line> with stroke set to "blood" colour;
    // commit phase has none.
    expect(container.querySelectorAll("svg line")).toHaveLength(0);
  });

  it("draws a forward line during withdraw when a player has a target locked", () => {
    const g = makeGame();
    g.round = { ...g.round, phase: "withdraw", commits: { a: { bullet: "bang", target: "b" } } };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/standoff/TargetingMap.test.tsx`
Expected: FAIL — `./TargetingMap` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import type { Game, RoundPhase } from "../../game/types";
import { Roundel } from "./Roundel";
import { seatPositions, pairGeometry } from "./geometry";

const CANVAS = 480;
const RADIUS = 180;
const PHASES_WITH_LINES: RoundPhase[] = ["withdraw", "reveal_bbb", "reveal_others"];

interface TargetingMapProps {
  game: Game;
  /** Dim the whole map (used during the standoff countdown overlay). */
  dim?: boolean;
}

export function TargetingMap({ game, dim }: TargetingMapProps) {
  const players = game.players;
  const positions = seatPositions(players.length, RADIUS);
  const pairs = pairGeometry(positions);
  const showLines = PHASES_WITH_LINES.includes(game.round.phase);
  const ducked = (id: string) =>
    !!game.round.commits[id]?.withdrew &&
    (game.round.phase === "reveal_bbb" || game.round.phase === "reveal_others" || game.round.phase === "split");
  const center = CANVAS / 2;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: CANVAS,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        opacity: dim ? 0.55 : 1,
        filter: dim ? "saturate(0.6)" : undefined,
        transition: "opacity 0.3s ease, filter 0.3s ease",
      }}
    >
      <svg
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          <marker id="ah-tm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={palette.blood} />
          </marker>
          <filter id="glow-tm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {showLines && (
          <g filter="url(#glow-tm)">
            {pairs.map(({ i, j }) => {
              const pi = players[i];
              const pj = players[j];
              const ci = game.round.commits[pi.id];
              const cj = game.round.commits[pj.id];
              const forward = !!ci && !ci.withdrew && ci.target === pj.id;
              const backward = !!cj && !cj.withdrew && cj.target === pi.id;
              const x1 = center + positions[i].x;
              const y1 = center + positions[i].y;
              const x2 = center + positions[j].x;
              const y2 = center + positions[j].y;
              return (
                <g key={`${i}-${j}`}>
                  {forward && (
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={palette.blood} strokeWidth={2.4}
                      markerEnd="url(#ah-tm)"
                    />
                  )}
                  {backward && (
                    <line
                      x1={x2} y1={y2} x2={x1} y2={y1}
                      stroke={palette.blood} strokeWidth={2.4}
                      markerEnd="url(#ah-tm)"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {players.map((p, i) => (
        <Box
          key={p.id}
          sx={{
            position: "absolute",
            left: center + positions[i].x,
            top: center + positions[i].y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Roundel
            flagId={p.colorOrAvatar}
            name={p.displayName.toUpperCase()}
            ducked={ducked(p.id)}
            dim={p.status === "dead"}
          />
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/standoff/TargetingMap.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/standoff/TargetingMap.tsx src/components/standoff/TargetingMap.test.tsx
git commit -m "feat(standoff): add TargetingMap with glowing SVG lines"
```

### Task 1.7: `<CrewRow>`

**Files:**
- Create: `src/components/crew/CrewRow.tsx`
- Create: `src/components/crew/CrewRow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { CrewRow } from "./CrewRow";
import type { Player } from "../../game/types";

function p(over: Partial<Player> = {}): Player {
  return {
    id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
    bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    ...over,
  };
}

describe("CrewRow", () => {
  it("renders flag pirate-name + nickname", () => {
    render(<CrewRow player={p()} flagName="CALICO JACK" status="aiming" />);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
    expect(screen.getByText(/Cap'n Maud/)).toBeInTheDocument();
  });

  it("renders the AIMING status pill", () => {
    render(<CrewRow player={p()} flagName="X" status="aiming" />);
    expect(screen.getByText("AIMING")).toBeInTheDocument();
  });

  it("renders 3 wound pips, filled per wounds count", () => {
    render(<CrewRow player={p({ wounds: 2 })} flagName="X" status="aiming" data-testid="r" />);
    const pips = screen.getByTestId("r").querySelectorAll("[data-pip]");
    expect(pips).toHaveLength(3);
    expect(pips[0].getAttribute("data-pip")).toBe("filled");
    expect(pips[1].getAttribute("data-pip")).toBe("filled");
    expect(pips[2].getAttribute("data-pip")).toBe("empty");
  });

  it("renders the yellow streak chip when shame > 0", () => {
    render(<CrewRow player={p({ shame: 2 })} flagName="X" status="aiming" />);
    expect(screen.getByText(/YELLOW ×2/)).toBeInTheDocument();
  });

  it("renders empty pockets text when cash is empty", () => {
    render(<CrewRow player={p()} flagName="X" status="aiming" />);
    expect(screen.getByText(/empty pockets/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/crew/CrewRow.test.tsx`
Expected: FAIL — `./CrewRow` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { DenominationIcon } from "../icons/DenominationIcon";
import type { Player } from "../../game/types";

export type CrewStatus =
  | "choosing" | "ready" | "aiming" | "yielded"
  | "struck" | "dead" | "out";

const STATUS_LABEL: Record<CrewStatus, string> = {
  choosing: "CHOOSING",
  ready: "READY",
  aiming: "AIMING",
  yielded: "YIELDED",
  struck: "STRUCK",
  dead: "DEAD",
  out: "OUT",
};

interface CrewRowProps {
  player: Player;
  flagName: string;
  status: CrewStatus;
  freshWoundIndex?: number; // index of the just-applied wound (0..2) for pulse
  "data-testid"?: string;
}

export function CrewRow({ player, flagName, status, freshWoundIndex, "data-testid": testid }: CrewRowProps) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const dead = player.status === "dead" || status === "dead";
  const struck = status === "struck";
  return (
    <Box
      data-testid={testid}
      sx={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        gap: "0.4rem",
        padding: "0.32rem 0.15rem",
        borderBottom: `1px solid ${palette.rule}`,
        alignItems: "center",
        background: struck ? "rgba(201, 58, 48, 0.14)" : "transparent",
        opacity: dead ? 0.4 : 1,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          border: `1.5px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={player.colorOrAvatar} size={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.6rem", letterSpacing: "0.14em", textDecoration: dead ? "line-through" : "none" }}>
          {flagName}
          <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.02em", color: palette.paperDim, paddingLeft: "0.4em", fontSize: "0.58rem" }}>
            {player.displayName}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: "0.18rem", alignItems: "center", marginTop: "0.18rem", flexWrap: "wrap" }}>
          {cash === 0 ? (
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.55rem", color: palette.paperFaint }}>
              — empty pockets —
            </Box>
          ) : (
            <>
              {player.cash.map((n, i) => (
                <DenominationIcon key={i} value={n.value} size={13} />
              ))}
              <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", color: palette.paper, marginLeft: "0.3rem" }}>
                ${(cash / 1000).toFixed(0)}k
              </Box>
            </>
          )}
          {player.shame > 0 && (
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.5rem", letterSpacing: "0.1em", background: palette.yellow, color: palette.ink, padding: "0 0.3rem", marginLeft: "0.3rem" }}>
              YELLOW ×{player.shame}
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.18rem", alignItems: "flex-end" }}>
        <StatusPill status={status} label={STATUS_LABEL[status]} />
        <Box sx={{ display: "flex", gap: "2px" }}>
          {[0, 1, 2].map(i => {
            const filled = i < player.wounds;
            const fresh = filled && freshWoundIndex === i;
            return (
              <Box
                key={i}
                data-pip={filled ? "filled" : "empty"}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: filled ? palette.blood : "transparent",
                  border: filled ? "none" : `1px solid ${palette.paper}`,
                  boxShadow: fresh ? `0 0 0 2px rgba(201,58,48,0.4)` : (filled ? "0 0 4px rgba(201,58,48,0.6)" : "none"),
                  animation: fresh ? "freshWound 0.7s ease-in-out 1" : undefined,
                  "@keyframes freshWound": {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.3)" },
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function StatusPill({ status, label }: { status: CrewStatus; label: string }) {
  const isAim = status === "aiming";
  const isReady = status === "ready";
  const isYielded = status === "yielded";
  const isStruck = status === "struck";
  const isDead = status === "dead";
  return (
    <Box
      sx={{
        fontFamily: fonts.displayCaps,
        fontSize: "0.5rem",
        letterSpacing: "0.2em",
        padding: "0.12rem 0.35rem",
        whiteSpace: "nowrap",
        border: `1.5px ${isYielded ? "dashed" : "solid"} ${isYielded ? palette.paperDim : palette.paper}`,
        background: isAim ? palette.paper : isReady ? palette.gold : isStruck ? palette.blood : "transparent",
        color: isAim || isReady ? palette.ink : isStruck ? palette.paper : isYielded ? palette.paperDim : palette.paper,
        opacity: isDead ? 0.6 : 1,
      }}
    >
      {label}
    </Box>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/crew/CrewRow.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/crew
git commit -m "feat(crew): add CrewRow with status pill, wound pips, stash composition"
```

### Task 1.8: `<CrewRoster>`

**Files:**
- Create: `src/components/crew/CrewRoster.tsx`
- Create: `src/components/crew/CrewRoster.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { CrewRoster } from "./CrewRoster";
import type { Game } from "../../game/types";

function makeGame(): Game {
  const players = ["a", "b", "c", "d"].map(id => ({
    id, displayName: id, colorOrAvatar: "generic",
    bullets: [], cash: [], wounds: 0, shame: 0,
    status: "alive" as const, effects: [],
  }));
  return {
    seed: "x", roomId: "x", players,
    round: { number: 1, phase: "commit", phaseStartedAt: 0, loot: [], commits: {} },
    bankDeck: [], discardedBullets: [], phase: "playing",
  } as Game;
}

describe("CrewRoster", () => {
  it("renders one row per player in seat order", () => {
    const g = makeGame();
    render(<CrewRoster game={g} />);
    const rows = screen.getAllByText(/^[A-D]$/);
    expect(rows.map(n => n.textContent)).toEqual(["A", "B", "C", "D"]);
  });

  it("derives status=ready for committed players in commit phase", () => {
    const g = makeGame();
    g.round.commits = { a: { bullet: "bang", target: "b" } };
    render(<CrewRoster game={g} />);
    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("derives status=choosing for not-yet-committed players in commit phase", () => {
    const g = makeGame();
    render(<CrewRoster game={g} />);
    expect(screen.getAllByText("CHOOSING")).toHaveLength(4);
  });

  it("derives status=aiming for everyone in standoff", () => {
    const g = makeGame();
    g.round.phase = "standoff";
    g.round.commits = Object.fromEntries(
      g.players.map(p => [p.id, { bullet: "bang", target: g.players[0].id }])
    );
    render(<CrewRoster game={g} />);
    expect(screen.getAllByText("AIMING")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/components/crew/CrewRoster.test.tsx`
Expected: FAIL — `./CrewRoster` not found.

- [ ] **Step 3: Implement**

```tsx
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { Game, Player } from "../../game/types";
import { CrewRow, type CrewStatus } from "./CrewRow";
import { FLAG_LABELS } from "../../game/playerFlags";

interface CrewRosterProps {
  game: Game;
  /** Player ids that were just struck this round (for visual highlight). */
  freshlyStruck?: Set<string>;
}

function deriveStatus(game: Game, p: Player, fresh: Set<string>): CrewStatus {
  if (p.status === "dead") return "dead";
  const c = game.round.commits[p.id];
  switch (game.round.phase) {
    case "commit":
      return c?.bullet && c?.target ? "ready" : "choosing";
    case "standoff":
      return "aiming";
    case "withdraw":
      return c?.withdrew ? "yielded" : "aiming";
    case "reveal_bbb":
    case "reveal_others":
      if (fresh.has(p.id)) return "struck";
      if (c?.withdrew) return "yielded";
      return "aiming";
    case "split":
      return c?.withdrew ? "yielded" : "out";
    default:
      return "out";
  }
}

export function CrewRoster({ game, freshlyStruck }: CrewRosterProps) {
  const fresh = freshlyStruck ?? new Set<string>();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <Box
        sx={{
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontSize: "0.62rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          paddingBottom: "0.25rem",
          borderBottom: `1px solid ${palette.ruleStrong}`,
          marginBottom: "0.45rem",
        }}
      >
        THE CREW
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.7rem", color: palette.paper, marginTop: "0.1rem" }}>
          six souls, one prize
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {game.players.map(p => (
          <CrewRow
            key={p.id}
            player={p}
            flagName={(FLAG_LABELS as Record<string, string>)[p.colorOrAvatar] ?? p.colorOrAvatar.toUpperCase()}
            status={deriveStatus(game, p, fresh)}
            freshWoundIndex={fresh.has(p.id) ? p.wounds - 1 : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}
```

Note: `FLAG_LABELS` already exists in `src/game/playerFlags.ts` — this task assumes its current shape. If it isn't typed for arbitrary lookup, the cast handles fallback.

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/components/crew/CrewRoster.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/crew/CrewRoster.tsx src/components/crew/CrewRoster.test.tsx
git commit -m "feat(crew): add CrewRoster with phase-driven status derivation"
```

### Task 1.9: Refactor `<GameBoard>` as the 3-column orchestrator

**Files:**
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Replace `GameBoard.tsx` body**

Replace the entire contents of `src/components/GameBoard.tsx` with the orchestrator. The file becomes thin:

```tsx
import { Box } from "@mui/material";
import type { Game } from "../game/types";
import { palette } from "../theme/colors";
import { HoardList } from "./hoard/HoardList";
import { TargetingMap } from "./standoff/TargetingMap";
import { CrewRoster } from "./crew/CrewRoster";

interface GameBoardProps {
  game: Game;
  freshlyStruck?: Set<string>;
}

export function GameBoard({ game, freshlyStruck }: GameBoardProps) {
  // Map the round's banknote loot into the HoardList shape. Carry-over data
  // is not currently tracked on Banknote; defer to a follow-up if/when it lands.
  const loot = game.round.loot.map(n => ({ value: n.value }));

  return (
    <Box
      sx={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "25% 50% 25%",
        borderTop: `4px double ${palette.ruleStrong}`,
        borderBottom: `4px double ${palette.ruleStrong}`,
        minHeight: 0,
      }}
    >
      <Box sx={{ padding: "0.6rem 0.85rem", borderRight: `1px solid ${palette.ruleStrong}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <HoardList loot={loot} />
      </Box>
      <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <TargetingMap game={game} />
      </Box>
      <Box sx={{ padding: "0.6rem 0.85rem", borderLeft: `1px solid ${palette.ruleStrong}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CrewRoster game={game} freshlyStruck={freshlyStruck} />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: PASS. The old `GameBoard` had a different export style — it was a named export. This rewrite preserves the named export. If `RoomPage` (the only caller) breaks, that's expected and gets fixed in Task 1.10.

- [ ] **Step 3: Update RoomPage to render the new GameBoard**

Open `src/pages/RoomPage.tsx`. Find the `GameView` function (~line 133). Replace its return JSX with a clean shell that uses `Masthead`, `GameBoard`, `Foot`. Replace lines 133-196 with:

```tsx
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { navyHoursLabel } from "../lib/navyHours";

function GameView({ roomState, game }: { roomState: RoomState<Player>; game: ReturnType<typeof useGameState>["game"] }) {
  const { t } = useTranslation();
  if (!game) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (game.phase === "ended") {
    // End-game screen wired in Stage 4. For now keep the legacy ranked list.
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>{t("phase.ended")}</Typography>
        <Stack spacing={1}>
          {[...game.players].sort((a, b) => totalScore(b) - totalScore(a)).map(p => (
            <PlayerCard key={p.id} player={p} score={totalScore(p)} />
          ))}
        </Stack>
      </Container>
    );
  }

  const round = game.round;
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>ROUND <em>{toRoman(round.number)} of VIII</em></>}
          right={<>PHASE <em>{round.phase}</em></>}
        />
        <GameBoard game={game} />
        <Foot
          left={`${countAlive(game)} ALIVE · ${countYielded(game)} YIELDED · ${countDead(game)} DEAD`}
          cry={navyHoursLabel(round.number)}
          right="NEXT · WHO SHALL FALL?"
        />
      </PageCanvas>
    </Box>
  );
}

const ROMAN = ["", "I","II","III","IV","V","VI","VII","VIII"];
const toRoman = (n: number) => ROMAN[n] ?? String(n);
const countAlive = (g: Game) => g.players.filter(p => p.status === "alive").length;
const countYielded = (g: Game) => Object.values(g.round.commits).filter(c => c?.withdrew).length;
const countDead = (g: Game) => g.players.filter(p => p.status === "dead").length;
```

Delete the now-unused `Countdown`, `CountdownTicker`, `PrevRoundSummary`, `ShotLog`, `outcomeLabel` helpers from this file — they reappear in Stage 2 in proper locations.

- [ ] **Step 4: Create the `navyHoursLabel` helper**

Create `src/lib/navyHours.ts`:

```ts
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function navyHoursLabel(round: number): string {
  if (round >= 8) return "— sails on the horizon —";
  const hours = 9 - round;
  return `— navy ~${hours} hours out —`;
}

export function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}
```

Create `src/lib/navyHours.test.ts`:

```ts
import { navyHoursLabel, toRoman } from "./navyHours";

describe("navyHoursLabel", () => {
  it("returns hours for rounds 1..7", () => {
    expect(navyHoursLabel(1)).toMatch(/8 hours out/);
    expect(navyHoursLabel(7)).toMatch(/2 hours out/);
  });
  it("returns the sails-on-horizon line for round 8+", () => {
    expect(navyHoursLabel(8)).toMatch(/sails on the horizon/);
  });
});

describe("toRoman", () => {
  it("maps 1..8", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(8)).toBe("VIII");
  });
});
```

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: PASS. The previous `GameBoard.test`-style assertions don't exist; the existing game-logic tests still pass since `src/game/*` is untouched.

- [ ] **Step 6: Commit**

```bash
git add src/components/GameBoard.tsx src/pages/RoomPage.tsx src/lib/navyHours.ts src/lib/navyHours.test.ts
git commit -m "refactor(big-screen): rebuild GameBoard as 25/50/25 orchestrator"
```

### Task 1.10: Rebuild `MockBigScreen` as a fixture-driven preview

**Files:**
- Modify: `src/pages/MockBigScreen.tsx`

- [ ] **Step 1: Replace MockBigScreen contents**

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

const PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",  bullets: ["bang","clic","clic","clic","clic","bang","bang_bang_bang"], cash: [{ value: 10000 }, { value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",   bullets: [], cash: [{ value: 20000 }, { value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",   bullets: [], cash: [{ value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ value: 20000 }, { value: 5000 }], wounds: 2, shame: 1, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart",   bullets: [], cash: [{ value: 10000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery",  bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
];

const FIXTURE_GAME: Game = {
  seed: "mock", roomId: "mock",
  players: PLAYERS,
  round: {
    number: 3,
    phase: "withdraw",
    phaseStartedAt: 0,
    loot: [{ value: 20000 }, { value: 10000 }, { value: 10000 }, { value: 5000 }, { value: 5000 }],
    commits: {
      a: { bullet: "bang", target: "c" },
      b: { bullet: "bang_bang_bang", target: "a" },
      c: { bullet: "bang", target: "e" },
      d: { bullet: "bang", target: "b" },
      e: { bullet: "clic", target: "f" },
      f: { withdrew: true, bullet: "clic", target: "a" },
    },
  },
  bankDeck: [], discardedBullets: [], phase: "playing",
};

export default function MockBigScreen() {
  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>ROUND <em>III of VIII</em></>}
          right={<>PHASE <em>{FIXTURE_GAME.round.phase}</em></>}
        />
        <GameBoard game={FIXTURE_GAME} />
        <Foot
          left="VI ALIVE · I YIELDED · 0 DEAD"
          cry={navyHoursLabel(FIXTURE_GAME.round.number)}
          right="NEXT · WHO SHALL FALL?"
        />
      </PageCanvas>
    </Box>
  );
}
```

- [ ] **Step 2: Run dev server and verify visually**

Run: `npm run dev`
Open: `http://localhost:5173/mock/big-screen/x` (any id works).
Expected: dark canvas, broadside masthead, three columns (hoard / map with targeting lines / crew roster). Six roundels in a hex with red lines between several of them. Henry Avery's roundel is dashed/rotated (yielded). Crew column shows status pills, wound pips, stash icons, yellow streak chip on Stede Bonnet.

If anything looks broken, fix it now — this mock is the visual harness for the rest of Stage 1+.

- [ ] **Step 3: Commit**

```bash
git add src/pages/MockBigScreen.tsx
git commit -m "feat(mock): rebuild MockBigScreen with fixture data on the new ledger"
```

---

## Stage 2 — Dramatic moments

Layer in the standoff countdown stamp, the in-place reveal banner, and the line-glow + fresh-pip animations. After Stage 2 the in-game screen has its TV-moment behaviour.

### Task 2.1: `<StandoffStamp>`

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

### Task 2.2: `<RevealBanner>`

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

### Task 2.3: Wire `<StandoffStamp>` into the GameBoard middle column during phase 2

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

### Task 2.4: Wire `<RevealBanner>` during reveal phases

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

### Task 2.5: Reveal-phase banner derivation in RoomPage

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

### Task 2.6: Visual fidelity sweep in MockBigScreen across phases

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

## Stage 3 — Lobby (THE MUSTER)

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

## Stage 4 — End-game (THE RECKONING)

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

## Stage 5 — Phone foundation + commit

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

## Stage 6 — Phone other phases (standoff / yield / spectator)

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

## Stage 7 — Player join

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

## Stage 8 — Static pages

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

## Stage 9 — Cleanup

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

