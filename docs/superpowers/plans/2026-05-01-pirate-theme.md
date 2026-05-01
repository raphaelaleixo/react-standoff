# Pirate Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the pirate visual/verbal theme defined in `docs/superpowers/specs/2026-05-01-pirate-theme-design.md` to the existing Standoff codebase — no game-logic changes, only a theming overlay (theme tokens, flag-based player identity, parchment/woodcut visuals, pirate copy).

**Architecture:** Theme-only overlay on top of working game code. The data model stays untouched (`colorOrAvatar: string` on `Player` now holds a flag id instead of a hex color). New presentational components — `MapFrame`, `CaptainsChest`, flag SVGs, `PowderLoadCard`, `FlintlockBarrel`, `YieldButton` — replace bare MUI primitives in the existing pages. All UI strings move into `en.json` via `i18next`.

**Tech Stack:** React 19 · TypeScript strict · MUI v9 · `react-i18next` · Vitest. Display typeface: **Pirata One** (Google Fonts) for headers; system serif (Georgia) for body. SVG icons inline in component files.

---

## File structure

**New files:**
- `src/theme/colors.ts` — semantic color tokens (parchment, ink, gold, signal, flag signature colors)
- `src/components/flags/` — directory of 6 woodcut flag SVG components + a generic fallback + `index.ts` barrel
- `src/components/loot/Coin.tsx` — silver / gold / jeweled coin token (one component, three variants)
- `src/components/loot/CaptainsChest.tsx` — central treasure chest (replaces `LootPile`)
- `src/components/MapFrame.tsx` — parchment + compass rose + decorative scroll background
- `src/components/PowderLoadCard.tsx` — woodcut-illustrated Click / Shot / Broadside card
- `src/components/FlintlockBarrel.tsx` — phase 2 phone view (barrel-end framing the target's flag)
- `src/components/YieldButton.tsx` — phase 3 phone view (scrolled YIELD on yellow ribbon)
- `src/game/playerFlags.ts` — `FLAG_DEFS`, `takenFlags()` helper (replaces `playerColors.ts`)
- `src/game/playerFlags.test.ts` — unit test for `takenFlags()`

**Files modified:**
- `index.html` — Pirata One font link
- `src/theme/theme.ts` — palette, typography, default body background
- `src/locales/en.json` — pirate vocabulary across all sections
- `src/pages/HomePage.tsx` — pirate hero rebrand
- `src/pages/HowToPlayPage.tsx` — pirate-flavored rules summary
- `src/pages/JoinPage.tsx` — copy refresh
- `src/pages/PlayerJoinPage.tsx` — flag picker replacing color circles
- `src/pages/RoomPage.tsx` — lobby flag rendering, in-game round indicator with navy framing
- `src/pages/PlayerPage.tsx` — wires powder-load cards, flintlock barrel, yield button per phase
- `src/components/GameBoard.tsx` — wraps in `MapFrame`, swaps `LootPile` → `CaptainsChest`, swaps avatar → flag in `PlayerNode`, restyles `PairLine` in signal red ink
- `src/components/RevealOverlay.tsx` — pirate copy, woodcut color palette

**Files deleted:**
- `src/game/playerColors.ts`

---

## Task 1: Feature branch + color tokens + theme foundation

**Files:**
- Create: `src/theme/colors.ts`
- Modify: `src/theme/theme.ts`
- Modify: `index.html`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b pirate-theme
```

- [ ] **Step 2: Add Pirata One font link to `index.html`**

In `<head>`, after the existing `<link rel="icon">` line, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pirata+One&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Create `src/theme/colors.ts`**

```ts
// Semantic color tokens for the pirate theme. The palette is two-color (parchment +
// ink) with three accent roles (gold, signal, yellow ribbon). Each flag also has a
// signature accent used on player cards and chips.

export const palette = {
  parchment: "#e8d8b0",
  parchmentDark: "#c9a874",
  ink: "#5a371d",
  inkSoft: "#7a4d2a",
  gold: "#d4a85a",
  goldDeep: "#a8842c",
  signal: "#c93a30",
  yellow: "#e6c440",
} as const;

// Per-flag signature color used for card borders, target-picker accents, and chips.
// Keys match flag ids in `playerFlags.ts`.
export const flagSignatureColors = {
  calico_jack: "#c93a30",   // red
  blackbeard: "#1e2a3a",    // deep navy
  black_bart: "#a8842c",    // gold
  henry_avery: "#2a6b5a",   // sea green
  edward_low: "#7a1f1f",    // burgundy
  stede_bonnet: "#5a2a6b",  // purple
  generic: "#5a371d",       // ink (fallback)
} as const;

export type FlagId = keyof typeof flagSignatureColors;

export function flagColor(id: string): string {
  return (flagSignatureColors as Record<string, string>)[id] ?? flagSignatureColors.generic;
}
```

- [ ] **Step 4: Update `src/theme/theme.ts`**

Replace the entire file with:

```ts
import { createTheme } from "@mui/material/styles";
import { palette } from "./colors";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: palette.parchment,
      paper: palette.parchment,
    },
    text: {
      primary: palette.ink,
      secondary: palette.inkSoft,
    },
    primary: { main: palette.ink },
    error: { main: palette.signal },
    warning: { main: palette.yellow },
    success: { main: palette.goldDeep },
  },
  typography: {
    fontFamily: '"Iowan Old Style", Georgia, serif',
    h1: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
    h2: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
    h3: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 1 },
    h4: { fontFamily: '"Pirata One", Georgia, serif' },
    h5: { fontFamily: '"Pirata One", Georgia, serif' },
    h6: { fontFamily: '"Pirata One", Georgia, serif' },
    button: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 1 },
    overline: { fontFamily: '"Pirata One", Georgia, serif', letterSpacing: 2 },
  },
});

export default theme;
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: build succeeds with no TS errors.

- [ ] **Step 6: Commit**

```bash
git add src/theme/colors.ts src/theme/theme.ts index.html
git commit -m "feat(theme): add pirate color tokens and Pirata One typography"
```

---

## Task 2: Pirate flag system (replace `playerColors.ts`)

**Files:**
- Create: `src/game/playerFlags.ts`
- Create: `src/game/playerFlags.test.ts`
- Create: `src/components/flags/CalicoJackFlag.tsx`
- Create: `src/components/flags/BlackbeardFlag.tsx`
- Create: `src/components/flags/BlackBartFlag.tsx`
- Create: `src/components/flags/HenryAveryFlag.tsx`
- Create: `src/components/flags/EdwardLowFlag.tsx`
- Create: `src/components/flags/StedeBonnetFlag.tsx`
- Create: `src/components/flags/GenericFlag.tsx`
- Create: `src/components/flags/index.ts`
- Delete: `src/game/playerColors.ts`
- Modify: `src/pages/PlayerJoinPage.tsx`

- [ ] **Step 1: Write the failing test**

`src/game/playerFlags.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FLAG_IDS, takenFlags } from "./playerFlags";

describe("playerFlags", () => {
  it("exposes the v1 flag set in display order", () => {
    expect(FLAG_IDS).toEqual([
      "calico_jack",
      "blackbeard",
      "black_bart",
      "henry_avery",
      "edward_low",
      "stede_bonnet",
      "generic",
    ]);
  });

  it("takenFlags returns flag ids already used by player data", () => {
    const data = [
      { colorOrAvatar: "calico_jack" },
      undefined,
      { colorOrAvatar: "blackbeard" },
    ];
    const taken = takenFlags(data);
    expect(taken.has("calico_jack")).toBe(true);
    expect(taken.has("blackbeard")).toBe(true);
    expect(taken.has("black_bart")).toBe(false);
  });

  it("takenFlags ignores undefined entries", () => {
    expect(takenFlags([undefined, undefined])).toEqual(new Set());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/game/playerFlags.test.ts
```

Expected: FAIL — module `./playerFlags` not found.

- [ ] **Step 3: Create `src/game/playerFlags.ts`**

```ts
import type { FlagId } from "../theme/colors";

export const FLAG_IDS: FlagId[] = [
  "calico_jack",
  "blackbeard",
  "black_bart",
  "henry_avery",
  "edward_low",
  "stede_bonnet",
  "generic",
];

export const FLAG_LABELS: Record<FlagId, string> = {
  calico_jack: "Calico Jack",
  blackbeard: "Blackbeard",
  black_bart: "Black Bart",
  henry_avery: "Henry Avery",
  edward_low: "Edward Low",
  stede_bonnet: "Stede Bonnet",
  generic: "No-Name",
};

export function takenFlags(playerData: ({ colorOrAvatar: string } | undefined)[]): Set<string> {
  const taken = new Set<string>();
  for (const p of playerData) {
    if (p?.colorOrAvatar) taken.add(p.colorOrAvatar);
  }
  return taken;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/game/playerFlags.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Create flag SVG components — `src/components/flags/CalicoJackFlag.tsx`**

```tsx
// Calico Jack — skull above crossed sabres. Inked, single-color SVG; the
// surrounding container can recolor via `currentColor`.
export function CalicoJackFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Calico Jack flag">
      <g fill="currentColor">
        <circle cx="32" cy="22" r="11" />
        <rect x="26" y="29" width="3" height="6" />
        <rect x="35" y="29" width="3" height="6" />
        <circle cx="22" cy="20" r="2.2" fill="#e8d8b0" />
        <circle cx="42" cy="20" r="2.2" fill="#e8d8b0" />
        <rect x="29" y="24" width="6" height="2" fill="#e8d8b0" />
        <rect x="20" y="42" width="24" height="2.5" transform="rotate(20 32 43)" />
        <rect x="20" y="42" width="24" height="2.5" transform="rotate(-20 32 43)" />
        <polygon points="44,38 50,40 47,46" />
        <polygon points="20,38 14,40 17,46" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 6: Create remaining flag components**

`src/components/flags/BlackbeardFlag.tsx` — skeleton with hourglass and spear:

```tsx
export function BlackbeardFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Blackbeard flag">
      <g fill="currentColor">
        <circle cx="32" cy="18" r="7" />
        <rect x="30" y="24" width="4" height="22" />
        <rect x="22" y="28" width="20" height="3" />
        <rect x="28" y="46" width="3" height="10" />
        <rect x="33" y="46" width="3" height="10" />
        <polygon points="44,12 50,16 50,20 44,16" />
        <rect x="46" y="20" width="2" height="14" />
        <polygon points="46,34 50,40 44,40" />
      </g>
    </svg>
  );
}
```

`src/components/flags/BlackBartFlag.tsx` — pirate over two skulls:

```tsx
export function BlackBartFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Black Bart flag">
      <g fill="currentColor">
        <circle cx="32" cy="14" r="6" />
        <rect x="29" y="20" width="6" height="14" />
        <rect x="22" y="22" width="20" height="3" />
        <rect x="28" y="34" width="3" height="10" />
        <rect x="33" y="34" width="3" height="10" />
        <circle cx="20" cy="50" r="6" />
        <circle cx="44" cy="50" r="6" />
        <circle cx="18" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="22" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="42" cy="49" r="1.4" fill="#e8d8b0" />
        <circle cx="46" cy="49" r="1.4" fill="#e8d8b0" />
      </g>
    </svg>
  );
}
```

`src/components/flags/HenryAveryFlag.tsx` — skull in profile with bandana:

```tsx
export function HenryAveryFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Henry Avery flag">
      <g fill="currentColor">
        <circle cx="30" cy="30" r="14" />
        <rect x="14" y="20" width="32" height="5" />
        <polygon points="46,22 54,22 50,29" />
        <circle cx="30" cy="30" r="3" fill="#e8d8b0" />
        <rect x="20" y="46" width="22" height="2.5" transform="rotate(20 31 47)" />
        <rect x="20" y="46" width="22" height="2.5" transform="rotate(-20 31 47)" />
      </g>
    </svg>
  );
}
```

`src/components/flags/EdwardLowFlag.tsx` — red skeleton (kept inked here; signature color provides the red tint at the container level):

```tsx
export function EdwardLowFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Edward Low flag">
      <g fill="currentColor">
        <circle cx="32" cy="14" r="6" />
        <rect x="30" y="20" width="4" height="20" />
        <rect x="20" y="24" width="24" height="2.5" />
        <rect x="22" y="32" width="20" height="2.5" />
        <rect x="28" y="40" width="3" height="14" />
        <rect x="33" y="40" width="3" height="14" />
        <rect x="20" y="50" width="6" height="2.5" />
        <rect x="38" y="50" width="6" height="2.5" />
      </g>
    </svg>
  );
}
```

`src/components/flags/StedeBonnetFlag.tsx` — skull with horizontal bone and heart:

```tsx
export function StedeBonnetFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Stede Bonnet flag">
      <g fill="currentColor">
        <circle cx="32" cy="20" r="10" />
        <rect x="29" y="28" width="6" height="6" />
        <circle cx="27" cy="19" r="2" fill="#e8d8b0" />
        <circle cx="37" cy="19" r="2" fill="#e8d8b0" />
        <rect x="14" y="40" width="36" height="3" />
        <circle cx="14" cy="41.5" r="3.5" />
        <circle cx="50" cy="41.5" r="3.5" />
        <path d="M28 50 L32 56 L36 50 A4 4 0 0 0 32 48 A4 4 0 0 0 28 50 Z" />
      </g>
    </svg>
  );
}
```

`src/components/flags/GenericFlag.tsx` — fallback skull-and-crossbones:

```tsx
export function GenericFlag({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Pirate flag">
      <g fill="currentColor">
        <circle cx="32" cy="22" r="11" />
        <rect x="26" y="29" width="3" height="6" />
        <rect x="35" y="29" width="3" height="6" />
        <circle cx="27" cy="20" r="2.2" fill="#e8d8b0" />
        <circle cx="37" cy="20" r="2.2" fill="#e8d8b0" />
        <rect x="14" y="42" width="36" height="3" transform="rotate(25 32 43)" />
        <rect x="14" y="42" width="36" height="3" transform="rotate(-25 32 43)" />
      </g>
    </svg>
  );
}
```

`src/components/flags/index.ts`:

```ts
import type { FlagId } from "../../theme/colors";
import { CalicoJackFlag } from "./CalicoJackFlag";
import { BlackbeardFlag } from "./BlackbeardFlag";
import { BlackBartFlag } from "./BlackBartFlag";
import { HenryAveryFlag } from "./HenryAveryFlag";
import { EdwardLowFlag } from "./EdwardLowFlag";
import { StedeBonnetFlag } from "./StedeBonnetFlag";
import { GenericFlag } from "./GenericFlag";

export const FLAG_COMPONENTS: Record<FlagId, React.ComponentType<{ size?: number }>> = {
  calico_jack: CalicoJackFlag,
  blackbeard: BlackbeardFlag,
  black_bart: BlackBartFlag,
  henry_avery: HenryAveryFlag,
  edward_low: EdwardLowFlag,
  stede_bonnet: StedeBonnetFlag,
  generic: GenericFlag,
};

export function FlagFor({ id, size = 48 }: { id: string; size?: number }) {
  const Component = (FLAG_COMPONENTS as Record<string, React.ComponentType<{ size?: number }>>)[id]
    ?? GenericFlag;
  return <Component size={size} />;
}
```

- [ ] **Step 7: Migrate `PlayerJoinPage` from colors to flags**

In `src/pages/PlayerJoinPage.tsx`, replace the import line:

```ts
import { PLAYER_COLORS, takenColors } from "../game/playerColors";
```

with:

```ts
import { FLAG_IDS, FLAG_LABELS, takenFlags } from "../game/playerFlags";
import { FlagFor } from "../components/flags";
import { flagColor } from "../theme/colors";
```

Replace the `taken` and `availableColors` derivation:

```ts
const taken = takenColors(roomState.players.map(p => p.data));
const availableColors = PLAYER_COLORS.filter(c => !taken.has(c));
```

with:

```ts
const taken = takenFlags(roomState.players.map(p => p.data));
const availableFlags = FLAG_IDS.filter(id => !taken.has(id));
```

Replace `setColor` and `color` state hook (rename for clarity):

```ts
const [color, setColor] = useState<string>("");
```

with:

```ts
const [flag, setFlag] = useState<string>("");
```

Replace the color-picker `<Box>` block (the one rendering the colored circles) with:

```tsx
<Box>
  <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("playerJoin.flagLabel")}</Typography>
  <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
    {availableFlags.map(id => (
      <Box
        key={id}
        role="button"
        aria-label={`flag ${FLAG_LABELS[id]}`}
        onClick={() => setFlag(id)}
        sx={{
          width: 64,
          height: 64,
          borderRadius: 1,
          backgroundColor: "#e8d8b0",
          color: flagColor(id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          outline: flag === id ? `3px solid ${flagColor(id)}` : "1px solid #5a371d",
          outlineOffset: 2,
        }}
      >
        <FlagFor id={id} size={56} />
      </Box>
    ))}
  </Stack>
</Box>
```

Three more places in the file reference the old `color` variable — all must be updated:

1. Inside `onSubmit`, the early-return guard:
   ```ts
   if (!name.trim() || !color || submitting) return;
   ```
   becomes:
   ```ts
   if (!name.trim() || !flag || submitting) return;
   ```

2. Inside `onSubmit`, the new-player object literal field:
   ```ts
   colorOrAvatar: color,
   ```
   becomes:
   ```ts
   colorOrAvatar: flag,
   ```

3. The Submit `<Button>`'s `disabled` prop:
   ```tsx
   disabled={!name.trim() || !color || submitting}
   ```
   becomes:
   ```tsx
   disabled={!name.trim() || !flag || submitting}
   ```

- [ ] **Step 8: Delete the old colors module**

```bash
git rm src/game/playerColors.ts
```

- [ ] **Step 9: Run tests and lint**

```bash
npm run test
npm run lint
npm run build
```

Expected: all pass. (No existing tests reference `playerColors.ts`.)

- [ ] **Step 10: Commit**

```bash
git add src/game/playerFlags.ts src/game/playerFlags.test.ts \
        src/components/flags/ src/pages/PlayerJoinPage.tsx
git commit -m "feat(flags): replace player color picker with pirate flag system"
```

---

## Task 3: Pirate i18n strings

**Files:**
- Modify: `src/locales/en.json`

- [ ] **Step 1: Replace `src/locales/en.json` with pirate vocabulary**

```json
{
  "home": {
    "title": "Standoff",
    "subtitle": "A mutiny at sea — eight rounds, one captain's hoard.",
    "newGame": "New Game",
    "resumeGame": "Resume Game",
    "howToPlay": "How to Play"
  },
  "howToPlay": {
    "title": "How to Play",
    "back": "Back"
  },
  "join": {
    "title": "New voyage or join a crew",
    "createNew": "Create new game",
    "or": "or",
    "codeLabel": "Room code",
    "codePlaceholder": "Enter room code",
    "joinSubmit": "Board",
    "joinSubmitting": "Boarding…",
    "notFound": "Ship not found"
  },
  "playerJoin": {
    "title": "Join the standoff",
    "nameLabel": "Yer name",
    "namePlaceholder": "Enter your name",
    "flagLabel": "Sail under whose colors?",
    "submit": "Hoist the colors",
    "submitting": "Hoisting…",
    "lobbyFull": "Crew is full — voyage starting soon",
    "rejoinTitle": "Rejoin yer post"
  },
  "room": {
    "loading": "Loading the ship…",
    "notFound": "Ship not found",
    "lobbyTitle": "Below decks",
    "code": "Room code",
    "scanToJoin": "Scan to board",
    "playersHeading": "Crew",
    "waitingForPlayers": "Waiting for at least 4 mates…",
    "startGame": "Begin the standoff",
    "started": "Standoff in progress"
  },
  "player": {
    "lobbyWaiting": "Waiting for the captain to call it…",
    "started": "Standoff in progress",
    "spectator": "Ye walked the plank.",
    "watchScreen": "Watch the big screen…"
  },
  "phase": {
    "commit": {
      "pickLoad": "Choose a powder load",
      "pickTarget": "Pick yer mark",
      "ready": "Ready",
      "locked": "Locked: {{load}} → {{target}}",
      "waiting": "Waiting for the others…"
    },
    "standoff": {
      "aimingAt": "Aiming at {{target}}",
      "label": "Aim true."
    },
    "withdraw": {
      "aimedAt": "Aimed at by: {{names}}",
      "noOne": "Nobody is aiming at ye.",
      "yield": "YIELD",
      "yielded": "Yielded (tap to undo)"
    },
    "ended": "Game over"
  },
  "load": {
    "click": "Click",
    "shot": "Shot",
    "broadside": "Broadside"
  },
  "round": {
    "of": "Round {{n}} of {{total}}",
    "navyHours": "Navy ~{{hours}} hours out",
    "sailsOnHorizon": "Sails on the horizon."
  },
  "reveal": {
    "broadside": "BROADSIDE!",
    "shot": "SHOT!",
    "hit": "{{shooter}} shot {{target}}!",
    "click": "{{shooter}} aimed at {{target}}… *click*",
    "voidedDuck": "{{shooter}}'s shot wasted — {{target}} yielded.",
    "voidedSurprised": "{{shooter}} caught off guard — shot wasted."
  }
}
```

- [ ] **Step 2: Verify type-check still passes**

```bash
npm run build
```

Expected: build succeeds. (Some places reference the old strings; they'll error if removed. If errors occur, scan the output, copy the missing keys back from the old file, and re-run. The four pages already imported `useTranslation`, so they'll pick up the new strings automatically — but inline literal strings in `PlayerPage.tsx` and `RevealOverlay.tsx` need replacing in later tasks, not this one.)

- [ ] **Step 3: Commit**

```bash
git add src/locales/en.json
git commit -m "feat(i18n): replace strings with pirate vocabulary"
```

---

## Task 4: Captain's chest — replace `LootPile`

**Files:**
- Create: `src/components/loot/Coin.tsx`
- Create: `src/components/loot/CaptainsChest.tsx`
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Create `src/components/loot/Coin.tsx`**

```tsx
import { palette } from "../../theme/colors";

// One coin token, three visual variants by denomination.
// 5_000  → silver piece (small, cool grey)
// 10_000 → gold doubloon (medium, warm gold)
// 20_000 → jeweled treasure (largest, gold + red gem)
export function Coin({ value, size = 28 }: { value: number; size?: number }) {
  if (value >= 20000) return <JeweledCoin size={size} />;
  if (value >= 10000) return <GoldCoin size={size} />;
  return <SilverCoin size={size} />;
}

function SilverCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="silver piece">
      <circle cx="16" cy="16" r="13" fill="#c5c8cc" stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.5" />
      <text x="16" y="20" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="11" fill={palette.ink}>5</text>
    </svg>
  );
}

function GoldCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="gold doubloon">
      <circle cx="16" cy="16" r="14" fill={palette.gold} stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.6" />
      <text x="16" y="20" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="11" fill={palette.ink}>10</text>
    </svg>
  );
}

function JeweledCoin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} role="img" aria-label="jeweled treasure">
      <circle cx="16" cy="16" r="15" fill={palette.gold} stroke={palette.ink} strokeWidth="1.5" />
      <circle cx="16" cy="16" r="11" fill="none" stroke={palette.ink} strokeWidth="0.8" opacity="0.6" />
      <polygon points="16,8 20,14 16,20 12,14" fill={palette.signal} stroke={palette.ink} strokeWidth="0.8" />
      <text x="16" y="29" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="9" fill={palette.ink}>20</text>
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/components/loot/CaptainsChest.tsx`**

```tsx
import { Box, Stack, Typography } from "@mui/material";
import { palette } from "../../theme/colors";
import { Coin } from "./Coin";

// Central treasure pile. Visual: a wooden chest lid with coins spilling forward.
// `loot` is the existing banknote array — we keep the prop shape so this is a
// drop-in replacement for the old LootPile.
export function CaptainsChest({ loot, centerX, centerY }: {
  loot: { id: string; value: number }[];
  centerX: number;
  centerY: number;
}) {
  const total = loot.reduce((s, n) => s + n.value, 0);
  return (
    <Box
      sx={{
        position: "absolute",
        left: centerX,
        top: centerY,
        marginLeft: "-90px",
        marginTop: "-70px",
        width: 180,
        height: 140,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: 160,
          height: 70,
          background: `linear-gradient(180deg, #8b5a2b 0%, #5a371d 100%)`,
          border: `3px solid ${palette.ink}`,
          borderRadius: "12px 12px 4px 4px",
          position: "relative",
          boxShadow: `inset 0 -8px 0 ${palette.ink}, 0 4px 12px rgba(0,0,0,0.4)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 22,
            bgcolor: palette.gold,
            border: `2px solid ${palette.ink}`,
            borderRadius: "2px",
          }}
        />
      </Box>
      <Stack direction="row" spacing={-1} sx={{ marginTop: "-18px", flexWrap: "wrap", justifyContent: "center", maxWidth: 180 }}>
        {loot.slice(0, 8).map(n => (
          <Coin key={n.id} value={n.value} size={26} />
        ))}
      </Stack>
      <Typography
        variant="h6"
        sx={{
          color: palette.ink,
          marginTop: "6px",
          textShadow: `1px 1px 0 ${palette.gold}`,
        }}
      >
        ${total.toLocaleString()}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 3: Replace `LootPile` usage in `GameBoard.tsx`**

In `src/components/GameBoard.tsx`, replace the import line at the top with the same plus the new chest import. Remove the entire `LootPile` function (lines ~263-295). Replace the `<LootPile loot={...} centerX={center} centerY={center} />` JSX with `<CaptainsChest loot={game.round.loot} centerX={center} centerY={center} />`. Add the import at the top:

```tsx
import { CaptainsChest } from "./loot/CaptainsChest";
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add src/components/loot/ src/components/GameBoard.tsx
git commit -m "feat(big-screen): captain's chest replaces flat loot pile"
```

---

## Task 5: Map frame + flag-based player nodes + inked targeting lines

**Files:**
- Create: `src/components/MapFrame.tsx`
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Create `src/components/MapFrame.tsx`**

```tsx
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { palette } from "../theme/colors";

// Parchment background with compass rose and decorative motifs. Wraps the
// big-screen game board. The visual frame inherits the targeting-line
// geometry already in GameBoard — see standoff_targeting_lines.md memory.
export function MapFrame({ children, size = 700 }: { children: ReactNode; size?: number }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        mx: "auto",
        background: `
          radial-gradient(ellipse at 30% 20%, ${palette.parchment} 0%, ${palette.parchmentDark} 80%),
          ${palette.parchment}
        `,
        boxShadow: `inset 0 0 80px rgba(90, 55, 29, 0.25)`,
        borderRadius: "8px",
        overflow: "hidden",
        border: `2px solid ${palette.ink}`,
      }}
    >
      <CompassRose />
      <DecorativeBorder />
      {children}
    </Box>
  );
}

function CompassRose() {
  return (
    <Box sx={{ position: "absolute", bottom: 14, right: 14, opacity: 0.55, pointerEvents: "none" }}>
      <svg viewBox="0 0 64 64" width={70} height={70}>
        <g fill={palette.ink} stroke={palette.ink}>
          <polygon points="32,4 36,30 32,32 28,30" />
          <polygon points="32,60 36,34 32,32 28,34" fillOpacity="0.6" />
          <polygon points="4,32 30,28 32,32 30,36" fillOpacity="0.6" />
          <polygon points="60,32 34,28 32,32 34,36" fillOpacity="0.6" />
          <circle cx="32" cy="32" r="3" fill="none" strokeWidth="1.5" />
          <text x="32" y="14" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="8">N</text>
        </g>
      </svg>
    </Box>
  );
}

function DecorativeBorder() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 8,
        border: `1px dashed ${palette.ink}`,
        opacity: 0.35,
        borderRadius: "6px",
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 2: Update `src/components/GameBoard.tsx` — wrap in `MapFrame`, swap PlayerNode to use flag, restyle PairLine**

Replace the entire file with:

```tsx
import { Box, Stack, Typography } from "@mui/material";
import type { Game, Player, RoundPhase } from "../game/types";
import { CaptainsChest } from "./loot/CaptainsChest";
import { MapFrame } from "./MapFrame";
import { FlagFor } from "./flags";
import { flagColor, palette } from "../theme/colors";

const RADIUS = 240;
const CANVAS = 700;
const NODE_WIDTH = 130;
const LINE_GAP = 10;
const LANE_THICKNESS = 3;

function seatPositions(n: number) {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (i * 360) / n) * (Math.PI / 180);
    out.push({ x: RADIUS * Math.cos(angle), y: RADIUS * Math.sin(angle) });
  }
  return out;
}

function pairGeometry(positions: { x: number; y: number }[]) {
  const out: { i: number; j: number; length: number; rotation: number }[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      out.push({
        i, j,
        length: Math.hypot(dx, dy),
        rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
      });
    }
  }
  return out;
}

const PHASES_WITH_LINES: RoundPhase[] = ["withdraw", "reveal_bbb", "reveal_others"];

export function GameBoard({ game }: { game: Game }) {
  const players = game.players;
  const positions = seatPositions(players.length);
  const pairs = pairGeometry(positions);
  const phase = game.round.phase;
  const showLines = PHASES_WITH_LINES.includes(phase);
  const ducked = (id: string) =>
    !!game.round.commits[id]?.withdrew &&
    (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split");

  const commitStatus = (id: string): "ready" | "choosing" | null => {
    if (phase !== "commit") return null;
    const c = game.round.commits[id];
    return c && c.bullet !== undefined && c.target !== undefined ? "ready" : "choosing";
  };

  const center = CANVAS / 2;

  return (
    <MapFrame size={CANVAS}>
      {pairs.map(({ i, j, length, rotation }) => {
        const pi = players[i];
        const pj = players[j];
        const ci = game.round.commits[pi.id];
        const cj = game.round.commits[pj.id];
        const forward = showLines && !!ci && !ci.withdrew && ci.target === pj.id;
        const backward = showLines && !!cj && !cj.withdrew && cj.target === pi.id;
        return (
          <PairLine
            key={`${i}-${j}`}
            originX={center + positions[i].x}
            originY={center + positions[i].y}
            length={length}
            rotation={rotation}
            forward={forward}
            backward={backward}
          />
        );
      })}

      {players.map((p, i) => (
        <PlayerNode
          key={p.id}
          player={p}
          x={center + positions[i].x}
          y={center + positions[i].y}
          ducked={ducked(p.id)}
          commitStatus={commitStatus(p.id)}
        />
      ))}

      <CaptainsChest loot={game.round.loot} centerX={center} centerY={center} />
    </MapFrame>
  );
}

function PairLine({ originX, originY, length, rotation, forward, backward }: {
  originX: number;
  originY: number;
  length: number;
  rotation: number;
  forward: boolean;
  backward: boolean;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: originX,
        top: originY,
        width: length,
        height: LINE_GAP,
        transformOrigin: "0 50%",
        transform: `translateY(-${LINE_GAP / 2}px) rotate(${rotation}deg)`,
        borderTop: `${LANE_THICKNESS}px solid ${forward ? palette.signal : "transparent"}`,
        borderBottom: `${LANE_THICKNESS}px solid ${backward ? palette.signal : "transparent"}`,
        boxSizing: "content-box",
        pointerEvents: "none",
        transition: "border-color 0.3s ease",
        "&::before": forward ? {
          content: '""',
          position: "absolute",
          right: "12%",
          top: -LANE_THICKNESS - 4,
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: `10px solid ${palette.signal}`,
        } : undefined,
        "&::after": backward ? {
          content: '""',
          position: "absolute",
          left: "12%",
          bottom: -LANE_THICKNESS - 4,
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderRight: `10px solid ${palette.signal}`,
        } : undefined,
      }}
    />
  );
}

function PlayerNode({ player, x, y, ducked, commitStatus }: {
  player: Player;
  x: number;
  y: number;
  ducked: boolean;
  commitStatus: "ready" | "choosing" | null;
}) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const dead = player.status === "dead";
  const accent = flagColor(player.colorOrAvatar);
  const transform =
    `translate(-50%, -50%)` +
    (ducked ? " rotate(8deg) scale(0.9)" : "");
  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_WIDTH,
        bgcolor: palette.parchment,
        border: `3px solid ${dead ? palette.inkSoft : accent}`,
        borderRadius: 2,
        py: 1,
        px: 1,
        opacity: dead ? 0.45 : 1,
        transform,
        filter: ducked ? "grayscale(0.7)" : "none",
        transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        boxShadow: `0 2px 4px rgba(90, 55, 29, 0.3)`,
        zIndex: 10,
        color: accent,
      }}
    >
      {commitStatus && !dead && <CommitBadge status={commitStatus} />}
      <Box sx={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FlagFor id={player.colorOrAvatar} size={48} />
      </Box>
      <Typography
        variant="body2"
        noWrap
        sx={{ width: "100%", textAlign: "center", fontWeight: 600, color: palette.ink }}
      >
        {player.displayName}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: i < player.wounds ? palette.signal : "transparent",
              border: `1px solid ${palette.ink}`,
            }}
          />
        ))}
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: palette.ink }}>
          ${cash.toLocaleString()}
        </Typography>
        {player.shame > 0 && (
          <Box sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 0.5,
            bgcolor: palette.yellow,
            border: `1px solid ${palette.ink}`,
            borderRadius: 0.5,
            fontSize: 10,
            color: palette.ink,
            fontWeight: 700,
          }}>
            ⚐ ×{player.shame}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function CommitBadge({ status }: { status: "ready" | "choosing" }) {
  const isReady = status === "ready";
  return (
    <Box
      sx={{
        position: "absolute",
        top: -12,
        right: -12,
        zIndex: 11,
        px: 1,
        py: 0.25,
        bgcolor: isReady ? palette.goldDeep : palette.inkSoft,
        color: palette.parchment,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        boxShadow: `0 1px 3px rgba(90,55,29,0.5)`,
        animation: isReady ? "none" : "pulse 1.4s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      }}
    >
      {isReady ? "Ready ✓" : "Choosing…"}
    </Box>
  );
}
```

- [ ] **Step 3: Verify build and dev server**

```bash
npm run build
npm run lint
```

Expected: both succeed. Then `npm run dev` and visit `/` — the home page should render with parchment background and Pirata One headers.

- [ ] **Step 4: Commit**

```bash
git add src/components/MapFrame.tsx src/components/GameBoard.tsx
git commit -m "feat(big-screen): map frame, flag player nodes, inked targeting lines"
```

---

## Task 6: Powder load card component (Phase 1 picker)

**Files:**
- Create: `src/components/PowderLoadCard.tsx`

- [ ] **Step 1: Create `src/components/PowderLoadCard.tsx`**

```tsx
import { Box, Typography } from "@mui/material";
import type { BulletCard } from "../game/types";
import { palette } from "../theme/colors";

const LOAD_LABELS: Record<BulletCard, string> = {
  clic: "Click",
  bang: "Shot",
  bang_bang_bang: "Broadside",
};

const LOAD_DESCRIPTIONS: Record<BulletCard, string> = {
  clic: "Empty hammer-snap",
  bang: "A clean shot",
  bang_bang_bang: "Triple-loaded — devastating",
};

export function PowderLoadCard({ load, count, selected, onSelect }: {
  load: BulletCard;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      role="button"
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        p: 1.5,
        bgcolor: palette.parchment,
        border: `2px solid ${selected ? palette.signal : palette.ink}`,
        borderRadius: 1,
        boxShadow: selected ? `0 0 0 2px ${palette.signal} inset` : "none",
        opacity: count === 0 ? 0.35 : 1,
        pointerEvents: count === 0 ? "none" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        minWidth: 96,
        transition: "border-color 0.15s ease",
      }}
    >
      <LoadIllustration load={load} />
      <Typography variant="h6" sx={{ color: palette.ink, fontFamily: "Pirata One, serif" }}>
        {LOAD_LABELS[load]}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.inkSoft, textAlign: "center" }}>
        {LOAD_DESCRIPTIONS[load]}
      </Typography>
      <Typography variant="caption" sx={{ color: palette.ink, fontWeight: 700 }}>
        ×{count}
      </Typography>
    </Box>
  );
}

function LoadIllustration({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
        <g fill="none" stroke={palette.ink} strokeWidth="2">
          <rect x="14" y="20" width="20" height="12" rx="2" fill={palette.parchmentDark} />
          <rect x="22" y="14" width="4" height="8" />
          <line x1="14" y1="32" x2="34" y2="32" />
        </g>
      </svg>
    );
  }
  if (load === "bang") {
    return (
      <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
        <g fill={palette.ink}>
          <rect x="12" y="20" width="24" height="10" rx="2" fill={palette.parchmentDark} stroke={palette.ink} strokeWidth="2" />
          <circle cx="24" cy="25" r="3" fill={palette.signal} />
        </g>
      </svg>
    );
  }
  // bang_bang_bang — triple-loaded: three balls visible
  return (
    <svg viewBox="0 0 48 48" width={48} height={48} aria-hidden>
      <g>
        <rect x="6" y="20" width="36" height="10" rx="2" fill={palette.parchmentDark} stroke={palette.ink} strokeWidth="2" />
        <circle cx="14" cy="25" r="3" fill={palette.signal} />
        <circle cx="24" cy="25" r="3" fill={palette.signal} />
        <circle cx="34" cy="25" r="3" fill={palette.signal} />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/components/PowderLoadCard.tsx
git commit -m "feat(phone): powder load card component"
```

---

## Task 7: Flintlock barrel (Phase 2) and Yield button (Phase 3)

**Files:**
- Create: `src/components/FlintlockBarrel.tsx`
- Create: `src/components/YieldButton.tsx`

- [ ] **Step 1: Create `src/components/FlintlockBarrel.tsx`**

```tsx
import { Box, Typography } from "@mui/material";
import { palette } from "../theme/colors";
import { FlagFor } from "./flags";

// Phase 2 phone view: a flintlock barrel-end framing the target's flag.
export function FlintlockBarrel({ targetFlag, targetName }: {
  targetFlag: string;
  targetName: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${palette.parchment} 0%, ${palette.parchment} 55%, ${palette.ink} 60%, ${palette.ink} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `inset 0 0 30px rgba(90,55,29,0.6)`,
        }}
      >
        <Box sx={{ color: palette.signal }}>
          <FlagFor id={targetFlag} size={120} />
        </Box>
        <Box
          sx={{
            position: "absolute",
            inset: "50% 0 auto 0",
            height: 2,
            bgcolor: palette.signal,
            opacity: 0.5,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: "0 50% auto auto",
            width: 2,
            height: "100%",
            bgcolor: palette.signal,
            opacity: 0.5,
          }}
        />
      </Box>
      <Typography variant="h4" sx={{ color: palette.ink, letterSpacing: 4 }}>
        AIM TRUE
      </Typography>
      <Typography variant="body1" sx={{ color: palette.inkSoft }}>
        Aiming at {targetName}
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 2: Create `src/components/YieldButton.tsx`**

```tsx
import { Box, Typography } from "@mui/material";
import { palette } from "../theme/colors";

// Phase 3 phone view: large scrolled YIELD on a yellow ribbon banner.
export function YieldButton({ yielded, onToggle }: {
  yielded: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      role="button"
      onClick={onToggle}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        py: 4,
        px: 3,
        bgcolor: yielded ? palette.yellow : palette.parchment,
        border: `3px solid ${palette.ink}`,
        borderRadius: 2,
        position: "relative",
        textAlign: "center",
        boxShadow: `0 4px 8px rgba(90,55,29,0.3)`,
        transition: "background 0.2s ease",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          width: 24,
          height: 36,
          bgcolor: palette.yellow,
          border: `3px solid ${palette.ink}`,
          transform: "translateY(-50%)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 50% 50%)",
        },
        "&::before": { left: -16 },
        "&::after": { right: -16, transform: "translateY(-50%) scaleX(-1)" },
      }}
    >
      <Typography variant="h2" sx={{ color: palette.ink, letterSpacing: 6 }}>
        {yielded ? "YIELDED" : "YIELD"}
      </Typography>
      {yielded && (
        <Typography variant="body2" sx={{ color: palette.inkSoft, mt: 1 }}>
          (tap to undo)
        </Typography>
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/components/FlintlockBarrel.tsx src/components/YieldButton.tsx
git commit -m "feat(phone): flintlock barrel and yield ribbon components"
```

---

## Task 8: Wire phone-side phase components into `PlayerPage`

**Files:**
- Modify: `src/pages/PlayerPage.tsx`

- [ ] **Step 1: Replace `src/pages/PlayerPage.tsx` entirely**

```tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import type { BulletCard, Game, Player } from "../game/types";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { FlagFor } from "../components/flags";
import { PowderLoadCard } from "../components/PowderLoadCard";
import { FlintlockBarrel } from "../components/FlintlockBarrel";
import { YieldButton } from "../components/YieldButton";
import { flagColor, palette } from "../theme/colors";

const LOAD_LABEL: Record<BulletCard, string> = {
  clic: "Click",
  bang: "Shot",
  bang_bang_bang: "Broadside",
};

export default function PlayerPage() {
  const { t } = useTranslation();
  const { id, playerId } = useParams();
  const { roomState, loading, error } = useFirebaseRoom(id);
  const { game, submitCommit, submitDuck } = useGameState(id);

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !roomState) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error ?? t("room.notFound")}</Alert>
      </Container>
    );
  }

  const slotId = Number(playerId);
  const slot = roomState.players.find(p => p.id === slotId);
  if (!slot || slot.status === "empty") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t("room.notFound")}</Alert>
      </Container>
    );
  }

  if (roomState.status === "lobby" || !game) {
    const flagId = slot.data?.colorOrAvatar ?? "generic";
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3} sx={{ alignItems: "center" }}>
          <Box sx={{ color: flagColor(flagId) }}>
            <FlagFor id={flagId} size={96} />
          </Box>
          <Typography variant="h5">{slot.name}</Typography>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography color="text.secondary">{t("player.lobbyWaiting")}</Typography>
          </Box>
        </Stack>
      </Container>
    );
  }

  const me = game.players.find(p => p.id === String(slotId));
  if (!me) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{t("room.notFound")}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box sx={{ color: flagColor(me.colorOrAvatar), opacity: me.status === "dead" ? 0.4 : 1 }}>
            <FlagFor id={me.colorOrAvatar} size={56} />
          </Box>
          <Box>
            <Typography variant="h6">{me.displayName}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              <Chip size="small" label={`wounds ${me.wounds}/3`} color={me.wounds >= 2 ? "warning" : "default"} />
              <Chip size="small" label={`yellow ×${me.shame}`} />
              <Chip size="small" label={`$${me.cash.reduce((s, n) => s + n.value, 0).toLocaleString()}`} color="success" />
            </Stack>
          </Box>
        </Stack>

        <Divider />

        <PhaseView
          game={game}
          me={me}
          submitCommit={submitCommit}
          submitDuck={submitDuck}
        />
      </Stack>
    </Container>
  );
}

function PhaseView({ game, me, submitCommit, submitDuck }: {
  game: Game;
  me: Player;
  submitCommit: (id: string, b: BulletCard, t: string) => Promise<void>;
  submitDuck: (id: string, w: boolean) => Promise<void>;
}) {
  const { t } = useTranslation();
  if (game.phase === "ended") {
    return <Typography variant="h5">{t("phase.ended")}</Typography>;
  }
  if (me.status === "dead") {
    return <Typography color="text.secondary">{t("player.spectator")}</Typography>;
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return <CommitPicker me={me} opponents={opponents} myCommit={myCommit} onSubmit={submitCommit} />;
  }

  if (phase === "standoff") {
    const target = game.players.find(p => p.id === myCommit?.target);
    return (
      <FlintlockBarrel
        targetFlag={target?.colorOrAvatar ?? "generic"}
        targetName={target?.displayName ?? "?"}
      />
    );
  }

  if (phase === "withdraw") {
    const aimedAtMe = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid)?.displayName ?? sid);
    return (
      <Stack spacing={2}>
        {aimedAtMe.length > 0 ? (
          <Alert severity="warning">{t("phase.withdraw.aimedAt", { names: aimedAtMe.join(", ") })}</Alert>
        ) : (
          <Alert severity="info">{t("phase.withdraw.noOne")}</Alert>
        )}
        <YieldButton
          yielded={!!myCommit?.withdrew}
          onToggle={() => submitDuck(me.id, !myCommit?.withdrew)}
        />
      </Stack>
    );
  }

  if (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return <Typography color="text.secondary">{t("player.watchScreen")}</Typography>;
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [load, setLoad] = useState<BulletCard | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const counts = countBullets(me.bullets);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const targetName = opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target;
    return (
      <Stack spacing={1}>
        <Alert severity="success">
          {t("phase.commit.locked", { load: LOAD_LABEL[myCommit.bullet!], target: targetName })}
        </Alert>
        <Typography color="text.secondary">{t("phase.commit.waiting")}</Typography>
      </Stack>
    );
  }

  const loadOrder: BulletCard[] = ["bang_bang_bang", "bang", "clic"];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="text.secondary">{t("phase.commit.pickLoad")}</Typography>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", mt: 1 }} useFlexGap>
          {loadOrder.map(b => (
            <PowderLoadCard
              key={b}
              load={b}
              count={counts[b]}
              selected={load === b}
              onSelect={() => setLoad(b)}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">{t("phase.commit.pickTarget")}</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {opponents.map(o => (
            <Box
              key={o.id}
              role="button"
              onClick={() => setTarget(o.id)}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1,
                bgcolor: palette.parchment,
                border: `2px solid ${target === o.id ? palette.signal : palette.ink}`,
                borderRadius: 1,
              }}
            >
              <Box sx={{ color: flagColor(o.colorOrAvatar) }}>
                <FlagFor id={o.colorOrAvatar} size={36} />
              </Box>
              <Typography sx={{ color: palette.ink, fontWeight: 600 }}>{o.displayName}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Button
        variant="contained"
        size="large"
        disabled={!load || !target}
        onClick={() => load && target && onSubmit(me.id, load, target)}
      >
        {t("phase.commit.ready")}
      </Button>
    </Stack>
  );
}

function countBullets(bullets: BulletCard[]): Record<BulletCard, number> {
  const c = { clic: 0, bang: 0, bang_bang_bang: 0 } as Record<BulletCard, number>;
  for (const b of bullets) c[b] += 1;
  return c;
}
```

- [ ] **Step 2: Verify build and tests**

```bash
npm run build
npm run lint
npm run test
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/PlayerPage.tsx
git commit -m "feat(phone): wire flag, powder loads, flintlock, yield into PlayerPage"
```

---

## Task 9: Round indicator with navy framing on `RoomPage`

**Files:**
- Modify: `src/pages/RoomPage.tsx`

- [ ] **Step 1: Update lobby section in `src/pages/RoomPage.tsx` to show flags**

Replace the import block at the top with:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { ref, update } from "firebase/database";
import { buildJoinUrl, RoomQRCode, startGame, useRoomState } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import type { Player } from "../game/types";
import { initGame } from "../game/setup";
import { GameBoard } from "../components/GameBoard";
import { RevealOverlay } from "../components/RevealOverlay";
import { FlagFor } from "../components/flags";
import { useFirebaseRoom } from "../hooks/useFirebaseRoom";
import { useGameState } from "../hooks/useGameState";
import { useServerTime } from "../hooks/useServerTime";
import { database } from "../firebase";
import { flagColor, palette } from "../theme/colors";
```

In the lobby player-list rendering, replace each `<Avatar>` block:

```tsx
<Avatar sx={{ bgcolor: p.data?.colorOrAvatar ?? "#bdbdbd", width: 40, height: 40 }}>
  {(p.name ?? "?").charAt(0).toUpperCase()}
</Avatar>
```

with:

```tsx
<Box sx={{ color: flagColor(p.data?.colorOrAvatar ?? "generic"), width: 48, height: 48 }}>
  <FlagFor id={p.data?.colorOrAvatar ?? "generic"} size={48} />
</Box>
```

(Remove the now-unused `Avatar` import if present at the top.)

- [ ] **Step 2: Update the in-game `GameView` round indicator with navy framing**

Find the `<Stack direction="row" spacing={3} sx={{ alignItems: "baseline" }}>` block inside `GameView`. Replace it with:

```tsx
<Stack direction="row" spacing={3} sx={{ alignItems: "baseline" }}>
  <Typography variant="overline" color="text.secondary">
    {t("round.of", { n: round.number, total: 8 })}
  </Typography>
  <Typography variant="caption" sx={{ color: palette.signal, fontFamily: "Pirata One, serif", fontSize: 14 }}>
    {round.number === 8
      ? t("round.sailsOnHorizon")
      : t("round.navyHours", { hours: 9 - round.number })}
  </Typography>
  <Typography variant="h5" sx={{ textTransform: "uppercase", letterSpacing: 2 }}>
    {round.phase}
  </Typography>
</Stack>
```

`GameView` does not currently call `useTranslation()` — the existing code uses literal English strings inline. Add this line as the first statement of the `GameView` function body (right after the opening brace, before the `if (!game)` check):

```ts
const { t } = useTranslation();
```

The `useTranslation` import is already present at the top of `RoomPage.tsx` for the main component, so no new import is needed.

Also replace the literal `"Game over"` Typography in the `game.phase === "ended"` branch with `{t("phase.ended")}`.

- [ ] **Step 3: Update `PlayerCard` (end-game leaderboard) similarly**

In the `PlayerCard` function, replace the `<Avatar>` with:

```tsx
<Box sx={{ color: flagColor(player.colorOrAvatar), opacity: player.status === "dead" ? 0.4 : 1, width: 32, height: 32 }}>
  <FlagFor id={player.colorOrAvatar} size={32} />
</Box>
```

- [ ] **Step 4: Verify build**

```bash
npm run build
npm run lint
```

Expected: success. Linter may warn about unused `Avatar` import — remove it if so.

- [ ] **Step 5: Commit**

```bash
git add src/pages/RoomPage.tsx
git commit -m "feat(big-screen): flag rendering in lobby, navy-framed round indicator"
```

---

## Task 10: Re-skin `RevealOverlay` with pirate copy

**Files:**
- Modify: `src/components/RevealOverlay.tsx`

- [ ] **Step 1: Replace `src/components/RevealOverlay.tsx` entirely**

```tsx
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Game, RoundShot } from "../game/types";
import { palette } from "../theme/colors";

export function RevealOverlay({ game, slotName }: {
  game: Game;
  slotName: (id: string) => string;
}) {
  const { t } = useTranslation();
  const { phase, resolution } = game.round;
  if (!resolution) return null;
  if (phase !== "reveal_bbb" && phase !== "reveal_others") return null;

  const shots = phase === "reveal_bbb"
    ? resolution.shots.filter(s => s.card === "bang_bang_bang")
    : resolution.shots.filter(s => s.card !== "bang_bang_bang");

  if (shots.length === 0) return null;

  const headline = phase === "reveal_bbb" ? t("reveal.broadside") : t("reveal.shot");
  const headlineColor = palette.signal;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(40, 25, 15, 0.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        zIndex: 1300,
        px: 4,
      }}
    >
      <Typography
        sx={{
          color: headlineColor,
          fontFamily: "Pirata One, serif",
          fontSize: { xs: "5rem", md: "9rem" },
          letterSpacing: 8,
          textShadow: `0 0 24px ${headlineColor}, 4px 4px 0 ${palette.ink}`,
        }}
      >
        {headline}
      </Typography>
      <Stack spacing={1.5} sx={{ alignItems: "center" }}>
        {shots.map((s, i) => (
          <Typography
            key={i}
            sx={{
              color: shotColor(s),
              fontSize: { xs: "1.4rem", md: "2rem" },
              textAlign: "center",
              fontWeight: 600,
              fontFamily: "Pirata One, serif",
            }}
          >
            {shotPhrase(s, slotName, t)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function shotPhrase(s: RoundShot, slotName: (id: string) => string, t: (k: string, v?: object) => string): string {
  const shooter = slotName(s.shooter);
  const target = slotName(s.target);
  switch (s.outcome) {
    case "hit":
      return t("reveal.hit", { shooter, target });
    case "no_effect_clic":
      return t("reveal.click", { shooter, target });
    case "voided_target_ducked":
      return t("reveal.voidedDuck", { shooter, target });
    case "voided_shooter_surprised":
      return t("reveal.voidedSurprised", { shooter });
  }
}

function shotColor(s: RoundShot): string {
  switch (s.outcome) {
    case "hit": return palette.parchment;
    case "no_effect_clic": return palette.gold;
    case "voided_target_ducked":
    case "voided_shooter_surprised":
      return palette.parchmentDark;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/components/RevealOverlay.tsx
git commit -m "feat(reveal): pirate copy and woodcut color palette"
```

---

## Task 11: HomePage and HowToPlayPage rebrand

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/HowToPlayPage.tsx`
- Modify: `index.html`

- [ ] **Step 1: Read `src/pages/HomePage.tsx`**

```bash
# Just to know what's there before editing
```

- [ ] **Step 2: Rewrite `src/pages/HomePage.tsx`**

Replace the file with:

```tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { palette } from "../theme/colors";
import { GenericFlag } from "../components/flags/GenericFlag";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4} sx={{ alignItems: "center", textAlign: "center" }}>
        <Box sx={{ color: palette.ink }}>
          <GenericFlag size={120} />
        </Box>
        <Typography variant="h1" sx={{ fontSize: { xs: "3rem", md: "4.5rem" } }}>
          {t("home.title")}
        </Typography>
        <Typography variant="h6" sx={{ color: palette.inkSoft, fontFamily: "Iowan Old Style, Georgia, serif" }}>
          {t("home.subtitle")}
        </Typography>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 320 }}>
          <Button variant="contained" size="large" onClick={() => navigate("/join")}>
            {t("home.newGame")}
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate("/join")}>
            {t("home.resumeGame")}
          </Button>
          <Button variant="text" size="large" onClick={() => navigate("/how-to-play")}>
            {t("home.howToPlay")}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 3: Rewrite `src/pages/HowToPlayPage.tsx`**

Replace the file with:

```tsx
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function HowToPlayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Typography variant="h2">{t("howToPlay.title")}</Typography>

        <Box>
          <Typography variant="h5" gutterBottom>The mutiny</Typography>
          <Typography>
            The captain is dead. His hoard is on the table. The navy is hours out. Eight rounds —
            each one a fresh chance to point a flintlock at a crewmate, see who flinches first, and
            take a cut of the spoils.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>Each round</Typography>
          <Typography component="div">
            <ol>
              <li><strong>Load &amp; aim.</strong> On yer phone, pick a powder load and a mate to point at.</li>
              <li><strong>Standoff.</strong> Three… two… one… aim true. Targets revealed.</li>
              <li><strong>Yield.</strong> Anyone aimed at can yield (and take a yellow streak). Yielded mates can't be shot.</li>
              <li><strong>Broadside!</strong> Triple-loaded shots hit first.</li>
              <li><strong>Shots.</strong> Single shots resolve. <em>Click</em> means yer powder was wet — no harm.</li>
              <li><strong>Split.</strong> Mates still standing divide the hoard. Whole coins only.</li>
            </ol>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>Winning</Typography>
          <Typography>
            Survive eight rounds with the most coin (minus $5,000 per yellow streak). Or be the last
            mate standing. Either way: ye walk away rich, or ye walk the plank.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate("/")}>
          {t("howToPlay.back")}
        </Button>
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 4: Update page title in `index.html`**

Find `<title>...</title>` in `index.html` and replace with:

```html
<title>Standoff — Mutiny on the high seas</title>
```

Also update any `<meta name="description">` to:

```html
<meta name="description" content="A real-time party game of mutiny, bluff, and flintlock standoffs. Play with your crew on phones around a shared screen." />
```

- [ ] **Step 5: Verify build and visit pages**

```bash
npm run build
npm run dev
```

Visit `/` and `/how-to-play` — both should render with the pirate hero, parchment background, and Pirata One headers.

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/HowToPlayPage.tsx index.html
git commit -m "feat(pages): pirate hero on Home, mutiny rules on HowToPlay"
```

---

## Task 12: Smoke test and final polish

**Files:** none new — this is verification only.

- [ ] **Step 1: Full test sweep**

```bash
npm run test
npm run lint
npm run build
```

Expected: all green.

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

- [ ] **Step 3: Manual walkthrough — golden path**

Open two browser windows side-by-side. Window A: visit `/` → New Game → note the room code. Window B (simulating a phone): visit `/room/<code>/player`, fill in name, pick a flag (e.g., Calico Jack), submit. Repeat in 3 more incognito windows for 4 total players.

In Window A (the `/room/<code>` view), verify:

- Lobby shows each player's flag (not letter avatar).
- Click "Begin the standoff" — game enters round 1.
- Round indicator reads "Round 1 of 8 · Navy ~8 hours out".
- Map frame: parchment background, compass rose corner, dashed inner border.
- Captain's chest sits center with current loot pile rendered as coins.
- Player nodes show flags, names, wound dots, cash.

On a player phone window:
- Phase 1: "Choose a powder load" with three woodcut load cards. "Pick yer mark" with flag-based opponent buttons. "Ready" locks in.
- Phase 2: flintlock barrel circle framing the target's flag. "AIM TRUE" caption.
- Phase 3: large YIELD ribbon button.
- Phase 4/5: see big-screen reveal overlay with "BROADSIDE!" / "SHOT!" headlines and pirate-flavored copy.

- [ ] **Step 4: Run through round 8 reaching `Sails on the horizon.`**

Either play through naturally or use mock pages if available; verify the round indicator transitions to "Sails on the horizon." on round 8.

- [ ] **Step 5: Visual sweep — confirm no avatar circles or hex colors leaked**

Search the codebase for anything that might still reference the old palette:

```bash
grep -rn "PLAYER_COLORS\|takenColors\|playerColors" src/
grep -rn "#e53935\|#1e88e5\|#43a047\|#fdd835\|#8e24aa\|#fb8c00" src/
```

Expected: no matches (or only in comments). If any matches, remove them.

- [ ] **Step 6: Commit any final fixes (only if needed)**

```bash
git status
# If anything's modified, stage and commit
```

- [ ] **Step 7: Push the branch and open a PR**

```bash
git push -u origin pirate-theme
```

Open a PR titled "Pirate theme" linking to both the spec and this plan.

---

## Notes for the implementer

- **`MockBigScreen` page (`src/pages/MockBigScreen.tsx`).** Not modified by this plan. If you want to verify the big-screen visuals without four real phones, that page should render `GameBoard` with a fake `Game` object — keep it working, but its specific contents are out of scope here.
- **Tests for visual components.** Visual components (flags, MapFrame, CaptainsChest, PowderLoadCard, FlintlockBarrel, YieldButton) are intentionally unit-test-light: they're presentational and best validated by eye. The only new unit test is `playerFlags.test.ts` because it has logic worth pinning.
- **Animation polish.** The spec mentions coin-fly animation when the chest opens each round. That's deferred — the chest currently shows the static current state of `game.round.loot`. A follow-up task would diff `loot` between renders and animate new coins in.
- **Sound.** Out of scope per the spec. No code added for it.
