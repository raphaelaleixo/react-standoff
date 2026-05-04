# Design overhaul — broadside print

This spec supersedes the **visual** sections of `2026-05-01-pirate-theme-design.md` (frame, palette, typography, big-screen visual identity, phone view aesthetic). The earlier spec's **non-visual** content — theme statement, vocabulary map, copy tone, round narrative, sound roadmap — remains in force unless explicitly overridden here.

The motivation: the previous direction (cream parchment treasure-map with woodcut accents) read as quaint and brand-y in execution, and key surfaces still looked like step-4 scaffolding. This overhaul commits to a **high-contrast broadside-print** identity — bone-coloured paper, heavy ink, one signal red, real broadside typography — applied across every surface, with information-rich game screens that stop hiding state behind decorative centerpieces.

## Visual identity

**Register.** A printed broadside / wanted-poster aesthetic, **rendered as dark print**: ink-coloured page, cream type, blood-red signal, zero gradients except where they simulate light inside an object (e.g. a gun bore). The "broadside" language stays — masthead, columns, double-rules, blackletter title — but the page is the ink, not the paper. The cream paper tone now lives only in type, hairlines, and bordered surfaces. Discipline, not decoration. Reference vibes: 17th-century English broadside ballads run as photographic negatives; Mike Mignola's ink work; Pentiment.

The earlier cream-paper variant (paper background, dark type) is **rejected** and not retained as a theme toggle. The codebase commits to dark print.

### Palette

Tokens go in `src/theme/colors.ts`. Semantic names keep the broadside metaphor (`ink` = dark, `paper` = cream); their **roles** are inverted vs. a printed page.

```ts
// Page surfaces — dark
ink:          "#14110d"  // primary background, the canvas
inkDeep:      "#0a0807"  // deeper shadow areas (insets, bores, eliminated rows)
inkUp:        "#2a2118"  // slightly-lifted surfaces (roundel discs, card backs)

// Type & line work — cream
paper:        "#ede0c4"  // primary type, blackletter masthead, button labels
paperDim:     "#b8a888"  // secondary type, italic captions, column heads
paperFaint:   "#6e5c40"  // tertiary type, empty-state copy

// Hairlines & rules — translucent cream so they sit on the dark canvas without glaring
rule:         "rgba(237, 224, 196, 0.22)"  // 1px hairline rules between rows
ruleStrong:   "rgba(237, 224, 196, 0.45)"  // 4px double rules, column dividers, ink frames

// Accents — calibrated brighter for dark backgrounds
blood:        "#c93a30"  // signal red — live state, hits, dramatic emphasis. Glows.
gold:         "#d4a85a"  // doubloon, winner accents, quickdraw card border, hoard total
yellow:       "#e6c440"  // yield ribbon (used only on the yield surface)
jewelPurple:  "#b48ac8"  // jeweled-piece banknote (lifted on dark)
silverGray:   "#d8d2c4"  // silver-piece banknote (lifted on dark)
```

`flagSignatureColors` keeps its current 6+1 mapping. Two flag colors may need a small lift for dark contrast (`blackbeard #1e2a3a` and `edward_low #7a1f1f` were tuned for cream and will look muddy on dark); decide on first render. The `generic` fallback shifts from `ink` (#5a371d) to `paperDim` since "ink" is now the page itself.

### Typography

Dropping the existing `Pirata One` display face. The replacement set:

- **Display / blackletter** — `UnifrakturCook` (700). Reserved for the masthead title (`The Standoff`, `The Reckoning`) and the standoff-countdown numeral. Used sparingly so it stays loud.
- **Display / capitals** — `IM Fell DW Pica SC` (small caps). All UI labels, button text, headings, status pills, column heads, card names. This is the working face.
- **Body** — `IM Fell English` (regular + italic). Italics carry the "voiced" copy: dramatic captions, nicknames, flavor lines, hints.
- **Body small caps** — `IM Fell English SC`. Only for the masthead sub-rule (`A NEW & TRUE BALLAD OF MUTINY · MMXXVI`).

All fonts loaded from Google Fonts. No system fallback past Georgia/serif.

### Page grain & frame

Every surface (big screen, phone, end-game, lobby) shares the same dark canvas:

- Background `--ink` solid, layered with an SVG `<feTurbulence>` cream-noise overlay (`baseFrequency 0.85`, `numOctaves 2`, `mix-blend-mode screen`, `opacity 0.45`). Cream noise on dark reads as printer's-mark roughness — like uneven inking on a press.
- Two subtle radial warm-light spills in the top-left and bottom-right corners (faint orange/amber, low alpha) — atmospheric, like distant lantern light, not a feature.
- An `inkDeep` 1px outer border + an inset shadow for canvas depth (no outer drop-shadow needed; the canvas is the page).
- The reusable component is `<PageCanvas>`, parameterised on aspect ratio and border radius (phone rounded, big screen rectangular).

## Vocabulary updates

These supersede the vocabulary table in the earlier spec.

| Earlier (pirate-theme spec) | New |
|---|---|
| **Broadside** (the `bang_bang_bang` card) | **Quickdraw** |
| Other terms (Click, Shot, Yield, Yellow streak, Captain's hoard, Walked the plank, Mate, Crew) | unchanged |

Code-side type names (`bang_bang_bang`, etc.) remain theme-neutral per `CLAUDE.md`. Only the i18n strings and UI labels change.

## Big-screen architecture

Three macro states: **Lobby (THE MUSTER)** → **In-game (the ledger)** → **End-game (THE RECKONING)**. All share the masthead/foot frame.

### Masthead (shared)

```
┌────────────────────────────────────────────────────────────────┐
│  ROUND III of VIII   ✸  The Standoff  ✸   PHASE  standoff       │
│                       (blackletter title)                       │
│                A NEW & TRUE BALLAD OF MUTINY · MMXXVI           │
└────────────────────────────────────────────────────────────────┘
                       (4px double-rule under)
```

3-column grid: left context (round, lobby state, "ROUND VIII PASSED" at end-game), centre title in `UnifrakturCook` with the small-caps sub, right context (phase, navy hours, "NAVY at the dock" at end-game). Same layout for all three macro states; only the strings change.

### Foot (shared)

3-column foot rule above a 4px double-rule:

- Left: status counts (e.g. `VI ALIVE · I YIELDED · 0 DEAD`)
- Centre: the dramatic cry, italic (`— hold the line —`)
- Right: next-up indicator (`NEXT · WHO SHALL FALL?`)

### Three-column ledger (in-game)

Column proportions **25% / 50% / 25%**, divided by 1px ink rules.

#### Left column — `THE HOARD` (25%)

The captain's hoard, every note rendered as its own row.

- Total at top: `$50,000` in `IM Fell DW Pica SC`, with `5 NOTES · 1 CARRY-OVER` italic underneath.
- Vertical list of `HoardItem` rows, one per banknote:
  - 28×28 denomination icon (silver disc / gold doubloon / yellow gem-set jewel; SVGs).
  - Italic name (`SILVER PIECE`, `GOLD DOUBLOON`, `JEWELED PIECE`) with optional flavour subline.
  - Right-aligned value (`$5,000` etc.).
- Carry-over notes get a 45°-hatched background and a `from rd. ii` flavour tag.
- Bottom rule + italic reminder: `— whole notes only · no change given —`.

The original "captain's chest illustration" is **deleted**. The loot reveal animation that previously flew coins out of the chest is replaced by notes flipping face-up onto the hoard list at the top of each round.

#### Middle column — `THE STANDOFF` (50%)

The targeting map and the dramatic moments.

- Hex of `Roundel` components — flag-cartouches only (no full player cards): an 80px circle with a 2.5px `paper` border, `inkUp` fill, soft inset shadow for depth, `paper`-coloured flag glyph inside. Name in `IM Fell DW Pica SC` underneath, `paper` colour.
- Targeting lines drawn as SVG strokes (`blood`, stroke-width 2.4) with arrowheads. On dark canvas the lines get a soft outer glow (`feGaussianBlur stdDeviation 3`) so they read as "live" against the ink page — they should look luminous, not painted. Lines render only at standoff "0", persist through reveal phases, clear at split.
- Yielded roundels are dashed-border (`paperDim`) + rotated −6° + scaled 0.92, opacity 0.45.

The middle column also hosts:
- The **standoff countdown overlay** during phase 2 (see below).
- The **dramatic reveal banner** during phases 4–5 (see below).

#### Right column — `THE CREW` (25%)

Per-player roster. **Always seat order** — never re-sorted by score.

`CrewRow`:
- 28×28 flag tile (color = signature accent).
- Name (`IM Fell DW Pica SC`) + nickname (italic, smaller, soft ink).
- Stash composition: mini denomination icons (13×13) + total (`$15k`) + optional yellow-streak chip (`YELLOW ×1`).
- Status pill on the right (all small caps in `IM Fell DW Pica SC`): `AIMING` (paper background, ink type — most prominent on the row), `READY` (gold background, ink type), `YIELDED` (dashed `paperDim` border, transparent fill, paperDim type), `STRUCK` (blood background, paper type), `DEAD` (40% opacity row, struck-through name).
- Wound pips (3 dots, blood = wounded, ink-bordered = unwounded). Fresh wounds pulse for ~700ms then settle.

### Standoff countdown overlay (phase 2)

The 3-2-1 leading into the targeting reveal is its own dramatic event, not a small phase label.

- The middle column's hex of roundels stays in place, but desaturated and at 55% opacity.
- A massive **paper-stamped numeral** in `UnifrakturCook` (~18rem at 16:9 big-screen rendering) sits centred over the column, `paper` colour with a soft warm-light glow. Two concentric `paper`-coloured circles wrap it, rotated −3°, the outer circle thinner — like a hand-applied stamp pressed onto the dark page.
- Eyebrow above: `— AT THE COUNT OF —` in tracked small caps, `paperDim`.
- Below: `three… two… one… STAND.` with `STAND.` in `blood` small caps.
- At "0": the stamp dissolves (~150ms) and the targeting lines snap into place on the now-fully-saturated hex. **No layout shift.**

### In-place reveal pattern (phases 4–5, kill, split)

**All resolution moments stay inside the ledger.** No hero takeovers. The rule: "reveals don't add new geometry, they animate existing geometry."

- **Quickdraw reveal (phase 4).** A blood-red `BROADSIDE!` banner stamps onto the masthead area, the targeting lines for quickdraw shots flash thicker for ~600ms with an ink-bleed effect, the struck roundels shake (±2px translate, 0.4s), and the corresponding crew rows flush red with `STRUCK` status pills. Fresh wound pips pulse. Voided shot lines fade out.
- **Shot reveal (phase 5).** Each shot line resolves in turn (sequential, ~400ms apart). Hits behave like the quickdraw mini-version. Clicks: line stays drawn but desaturates and the shooter's row caption reads `*click*` for a beat.
- **Kill (3rd wound).** Same banner pattern, copy reads `— WALKED THE PLANK · [name] —`. The dead row dims to 40% opacity with a strike-through; their cash icons fly off-row to the box (forfeit). The banner holds for ~1.2s, longer than the broadside banner — this is the table-goes-silent beat. Still in-place; still no takeover.
- **Split (phase 6).** Coins fly from the left column's hoard rows into the right column's crew rows, one note per ~250ms. Hoard list shrinks; crew totals tick up. Unsplittable notes stay on the hoard, gain the carry-over hatched background.

### Lobby — `THE MUSTER`

Two-column body, no targeting map.

- **Left (38%) — JOIN THE MUTINY.** Stacked: section heading; QR code (180×180, rendered cream-on-ink — inverted from a normal QR, with the dark canvas as the QR background and `paper` for the modules; phones decode this without trouble); `— or punch in the code —`; the room code in giant tracked `IM Fell DW Pica SC` (`QSPY`, ~2.6rem, double-ruled top/bottom in `ruleStrong`, 4×4 `inkDeep` drop-shadow for depth); `at standoff.party/join` caption in `paperDim`.
- **Right (62%) — THE CREW SO FAR.** 3-up grid of crew cards, each: 56×56 flag, real pirate name in IM Fell DW Pica SC, nickname italic. Empty seats are dashed-border placeholders saying `— pick a flag — / EMPTY SEAT / awaiting crew`.
- **Foot.** Left: `IV ABOARD · enough to mutiny` (turns red below 4). Centre: the **HOIST THE COLOURS / start the mutiny** button, host-only, paper-filled with `ink` type and a `blood` drop-shadow to mark its specialness. Right: `II SEATS LEFT · up to VI`.

Masthead reads: `THE MUSTER ✸ The Standoff ✸ — CAPTAIN'S ABSENCE —`.

### End-game — `THE RECKONING`

One screen, frozen at full reveal.

- **Top — winner enthronement.**
  - Eyebrow: `— AND THE LION'S SHARE GOES TO —`
  - Three-element row: blackletter `I` rank in `blood` (~5.5rem) · 100×100 winner flag in a circular disc with `paper` 4px border and a 6×6 `inkDeep` drop-shadow · winner's name in `UnifrakturCook` (~3.5rem, `paper`), nickname italic in `paperDim`, take total in tracked caps with denomination breakdown italic underneath.
  - Cry: `— walks away with the lot —` in blood red italic.
  - Separator: 1px ink rule.
- **Below — the rest, in rank order.** `EndGameRow`: roman rank · 44×44 flag · name + nickname · breakdown italic (showing shame penalty in red: `$50k − $5k (i streak)`) · final score in IM Fell DW Pica SC.
- **Eliminated players** are dimmed (~55% opacity), nickname extends with `· walked the plank, rd. vi`, breakdown reads `— forfeit —`, score reads `DEAD` in red italic.
- **Foot.** Two buttons: `ANOTHER ROUND` (paper-filled with `ink` type — primary action) and `RETURN TO PORT` (transparent with `paper` border and type — ghost). Same button language used everywhere else.

The sequential rank-by-rank reveal animation (specified in `rules.md`) plays before this frozen state — each row stamps in from bottom (rank VI) up to rank II, with the winner card sliding in last with the blackletter "I" arriving first and the rest dropping in around it.

## Phone architecture

9:19.5 portrait. Rounded corners (28px). Same `<PageCanvas>`, same masthead/round-strip pattern.

### Player header strip (shared)

Top of every phone screen (lobby is the only exception):

- 36×36 player flag (left), with a 2px `paper` border and the flag's signature colour as background.
- Name in `IM Fell DW Pica SC` + italic nickname underneath.
- Right-aligned: cash total (`$15,000`) + tiny italic meta line (`·· wounds I/III`).
- 3px double-rule below.

A second strip below: round indicator + current phase, in tracked small caps.

### Phone · lobby / join — `RAISE YER FLAG`

Replaces the current `PlayerJoinPage`.

- Top: `ROOM QSPY / The Standoff` (room code echoes the big screen).
- Heading: `— RAISE YER FLAG —` in blackletter.
- 3-column flag grid (7 flags fit; the no-name flag occupies its own slot offset to the centre column for visual balance). Each flag tile is a `pj-flag` card showing the flag emblem + flag name (`CALICO JACK`, etc.).
  - **Selected** — inverted ink, lifted 2px, blood-red drop-shadow.
  - **Taken** — dashed border, 6% ink fill, `TAKEN` stamp at the bottom, click disabled.
- Nickname input as a centred italic line on a single ink rule (no MUI box). Hint: `— or leave it & we'll pick one —`.
- `RAISE THE FLAG · join the mutiny` button at bottom — paper-filled with `ink` type and a 5×5 `inkDeep` drop-shadow. Same primary-button language used everywhere.

### Phone · commit — 8-card hand

Replaces the current 3-category load picker.

- Heading: `YER HAND / 5 click · 2 shot · 1 quickdraw`.
- 4×2 grid of 8 cards. Each card is a 2:3 portrait with:
  - Tiny corner glyphs (top-left and top-right) marking the load type (`×` for click, `●` for shot, `⚡` for quickdraw).
  - A central woodcut illustration of the loaded chamber: empty-with-cross-out for click, single ball for shot, three balls for quickdraw.
  - Card name in tracked small caps at the bottom.
  - **Quickdraw** card has a gold border (2px inset + 2×2 gold shadow) to mark its specialness.
  - **Spent** cards flip to their face-down ink back: skull emblem + 50%-opacity rule + `SPENT` micro-label. They keep their slot in the grid so the player can always count what's left.
  - **Selected** card lifts 3px, fills with `blood`, type and glyphs go `paper`. Wraps with a 2px `paper` inset for emphasis.
- Heading below: `PICK YER MARK`. List of opponent rows (28×28 flag · name+nickname · their stash total) on `inkUp` tiles with `paperDim` borders. Selected target fills with `paper` (type goes `ink`) and gets a 4×4 `blood` drop-shadow.
- Bottom: paper-filled `READY` button (`ink` type) with italic recap: `— shot · stede bonnet —`. Same button language as `RAISE THE FLAG` / `HOIST THE COLOURS`.

### Phone · standoff — bore + counted target

- Caption: `— AIM TRUE — / down the barrel`.
- The barrel: nested rings.
  - Outer ring: radial-gradient simulating an iron muzzle (deep ink → `#2a1f15` → blood accent ring at 45-47% → ink → ink at outer edge), with iron-sight ticks at top/bottom/left/right (cream tick marks).
  - Inner bore: deep dark gradient (`#3a2f24 → #14110d`), inset shadow simulating depth.
  - Inside the bore (centred): the locked target's flag-roundel, dimmed (border at 55% paper opacity, paper-tinted flag colour).
  - **On top of the target's flag**: the live countdown numeral in `UnifrakturCook` (~8rem), cream with a heavy dark text-shadow.
  - Below the count, inside the bore: small italic `— STAND —` reminder.
- **Below the barrel**: target's name + nickname, in IM Fell DW Pica SC. (Removed from inside the bore so the rings stay visually centred.)

No input. Live ticker fed by `useServerTime` updates the numeral 3 → 2 → 1.

### Phone · yield — yellow ribbon

- Top: `— TWO TAKE AIM AT YE —` over a row of attacker chips. Each attacker chip: 28×28 flag + their name, framed in a blood-red border.
- Centre: a yellow scrolled banner — the `YieldButton`. The banner has triangular notches at each end (clip-path) to simulate ribbon ends; the verb `YIELD` is in `UnifrakturCook` (~3.4rem, ink) with `— hands up, powder dry —` italic underneath.
- Cost reminder below: `COST: ONE YELLOW STREAK / —$5,000 at the end of the day`.
- Live countdown numeral below that, in tracked display caps.

Tap toggles. Once yielded, the banner inverts to ink and shows `YIELDED · CHANGE YER MIND?` until the timer locks.

### Phone · spectator (read-only)

Reveal phases (4-6) and eliminated state. The phone shows a compressed mirror of the big-screen ledger — masthead + a 1-column compressed crew list — so the player can keep up with table state. No controls.

Eliminated players see a one-time stamp: `YE WALKED THE PLANK / round vi`, blood red, then default to the spectator view.

## Targeting line geometry & animation

Inherits the dual-lane CSS line approach from `standoff_targeting_lines` memory note (pre-rendered pair geometry, two CSS borders per pair for forward/backward shots). Visual updates:

- Stroke colour: `--blood` (was `signal`, same value).
- Stroke width: `2.4px` (was 3px).
- Arrowheads: SVG markers, not CSS triangles. Refines the look at large display sizes.
- **Continuity rule.** Lines render at standoff "0" and persist through phases 4–5. Reveal animations operate on the existing geometry (pulse, ink-bleed, stroke-thicken, bullet glyph traveling along the path) — they never redraw the topology mid-round.
- **Voided lines.** When a target yielded or shooter was surprised, the corresponding line fades out (~400ms ease) without snapping.
- **Quickdraw lines** during phase 4 get an extra parallel inked stroke for ~600ms (the visual "they double-loaded" cue), then return to single stroke for the rest of the resolution.

## Component & file impact

This section is for the implementation plan; it lists what changes, not how.

### Button language (shared across surfaces)

Three button variants. All use `IM Fell DW Pica SC` letterforms with heavy tracking.

- **Primary** — paper background, ink type, optional `inkDeep` drop-shadow (3-5px). Used for the dominant action on a screen: `RAISE THE FLAG`, `READY`, `HOIST THE COLOURS`, `ANOTHER ROUND`. The "host start" variant (`HOIST THE COLOURS`) adds a `blood` drop-shadow on top of the ink one to mark its specialness.
- **Ghost** — transparent fill, paper border (1.5-2px), paper type. Used for secondary actions: `RETURN TO PORT`, "back" affordances.
- **Text** — no fill, no border, paper type with a 4px-offset paper underline. Used for tertiary affordances: `Learn the ways`.

A single `<Button>` component renders all three via a `variant` prop. Italics-as-recap (`— shot · stede bonnet —` under READY) is a `caption` slot.

### New components

- `<PageCanvas>` — shared dark canvas + cream-noise grain + warm-light corner spills. `aspectRatio?`, `borderRadius?` props. Big screen and phone both use it.
- `<Button>` — primary / ghost / text variants per the button language above.
- `<Masthead>` — 3-column blackletter masthead with rule. Slots: `left`, `center` (defaults to `The Standoff` with sub-rule), `right`.
- `<Foot>` — 3-column foot.
- `<HoardList>` — left column. Renders banknote rows from `Game.round.loot`.
- `<DenominationIcon>` — silver / gold / jewel; small + large variants.
- `<TargetingMap>` — middle column. Replaces the player-around-chest layout in the current `<GameBoard>`. Hex of `<Roundel>`s + SVG line overlay.
- `<Roundel>` — flag cartouche for the map. Smaller than the previous `<PlayerNode>`.
- `<CrewRoster>` — right column. Vertical `<CrewRow>` list.
- `<CrewRow>` — flag · name+nickname · stash · status pill · wound pips. Drives most of the in-game info density.
- `<StandoffStamp>` — countdown numeral + ink-stamp circles. Renders on top of the desaturated `<TargetingMap>` during phase 2.
- `<RevealBanner>` — banner stamped between masthead and the ledger body. Used for `BROADSIDE!` (quickdraw fires) and `— WALKED THE PLANK · [name] —` (kill). In-place, never full-screen. Configurable hold duration.
- `<MusterScreen>` / `<ReckoningScreen>` — big-screen lobby and end-game.
- `<PhoneShell>` — phone-shaped `<PageCanvas>` + header strip + round strip.
- `<PowderCard>` — single hand card. Faces: click / shot / quickdraw / back.
- `<Hand>` — 4×2 grid of `<PowderCard>`s.
- `<TargetList>` — vertical list of opponent rows on the commit screen.
- `<Barrel>` — nested-ring flintlock muzzle. Children render inside the bore.
- `<YieldRibbon>` — replaces existing `<YieldButton>`. Yellow scrolled banner.
- `<FlagPickerGrid>` — replaces the current flag grid in `PlayerJoinPage`.

### Components to delete

- `<CaptainsChest>` (and `src/components/loot/`).
- `<MapFrame>` — superseded by `<PageCanvas>` + `<TargetingMap>` working together.
- `<FlintlockBarrel>` — replaced by `<Barrel>`.

### Components to refactor

- `<GameBoard>` — becomes a thin orchestrator that lays out `<HoardList>`, `<TargetingMap>`, `<CrewRoster>` in a 25/50/25 grid and slots in `<StandoffStamp>` / `<RevealBanner>` based on phase.
- `<PlayerPage>` — phase-by-phase delegation rewritten to use the new phone components. The existing `useGameState` / `useFirebaseRoom` hooks stay untouched.
- `<RoomPage>` — lobby branch renders `<MusterScreen>`; in-game branch renders the new `<GameBoard>`; end-game branch renders `<ReckoningScreen>`. Removes the current "throwaway scaffolding" comments and debug chips.
- `theme/colors.ts` — palette tokens added/renamed.
- `theme/theme.ts` — typography rebuilt around `IM Fell DW Pica SC` / `IM Fell English` / `UnifrakturCook`. `Pirata One` removed.
- `index.html` — Google Fonts link tag for the three families. No JS font loader; rely on `font-display: swap`.

### Static pages

Lower-leverage but still part of the visual identity:

- `HomePage` — small pass: `<PageCanvas>` background, broadside masthead (`The Standoff`), three buttons in the broadside button style. Skull emblem stays. No multi-column treatment; it's a menu.
- `HowToPlayPage` — broadside-ballad style: masthead + 2-column body with the rules sections, drop-cap on the first paragraph, bottom action row. Replace the `<ol><li>` defaults with proper styled lists.
- `JoinPage` — broadside masthead + the existing form re-skinned. Code input gets the same tracked-caps treatment as the lobby room code.

### i18n changes

- `load.bang_bang_bang` value: `Broadside` → `Quickdraw`.
- All other pirate strings: minor copy passes to align with the broadside voice (`HOIST THE COLOURS`, `THE MUSTER`, `THE RECKONING`, `RAISE YER FLAG`, etc.). Detailed list belongs to the implementation plan, not this spec.

### Asset needs

- Real woodcut SVGs for the 7 flags. The current placeholders in `src/components/flags/` already exist; they need a stylistic pass to read as printed prints (heavier black masses, white-on-black mask treatment, less line-art vector). Sourcing/illustration cost: medium.
- Powder load illustrations (3) — chamber + load. Already prototyped in the mockup; will be re-drawn properly.
- Denomination illustrations (3) — silver / gold / jewel.
- No textures, photographs, or raster art. Everything stays SVG.

## Out of scope

- **Game rules, types, state machine.** `src/game/*` is untouched. This is a presentation-layer overhaul.
- **`react-gameroom` integration.** No library changes. Hooks (`useFirebaseRoom`, `useGameState`, `useServerTime`) keep their current contracts.
- **Sound.** Still parked. Mute toggle remains a future requirement when sound lands.
- **Animation library.** No Framer Motion / GSAP. CSS transitions and the existing `requestAnimationFrame` patterns are sufficient for the in-place reveal animations specified.
- **Localization beyond English.** Pirate copy is English-only; other locales remain neutral translations.

## Open decisions

- Whether the **commit screen's target list** should also show each opponent's wound count (so you can target the wounded). Defer until first playtest — easy to add a wound-pip cluster to each `target` row later.
- Whether the **phone spectator view** during reveal phases mirrors the full big-screen ledger (compressed) or shows a phone-native scoreboard. Picked "compressed mirror" in this spec; if it's noisy in implementation, fall back to a dedicated scoreboard.
- **Card-back illustration density.** Currently a skull emblem + horizontal rule + `SPENT` label. Could grow into a proper printer's-mark woodcut (crossed flintlocks, decorative wreath). Decide once an illustrator is involved.
- **Empty-seat tile** in the lobby — currently dashed-border placeholder. Could instead show a wax-stamped "EMPTY" seal for theatre. Small win, defer.

## Verification

This spec is met when:

- A first-time visitor on the big screen can identify the room code, the QR, and how many seats are left within ~3 seconds of looking at the lobby.
- A first-time player on the phone can choose a flag, enter a nickname, and tap "RAISE THE FLAG" without any UI label feeling out of place from the broadside voice.
- During the standoff phase, the table can read who's targeting whom from the targeting map alone (no need to look at the right column to confirm).
- During the broadside reveal, the dramatic moment happens *in place* — the table's eyes never leave the ledger and re-find anything.
- The end-game winner card is unmistakably the climax (typography weight, scale, blood-red `I` rank).
- No surface still uses the old `Pirata One` face, no surface still references "broadside" as the card name, and no surface still renders a captain's chest illustration.
- The cream-paper page treatment is gone everywhere; every surface (lobby, in-game, end-game, every phone phase, every static page) renders on the dark canvas.
