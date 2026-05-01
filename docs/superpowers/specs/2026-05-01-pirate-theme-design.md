# Pirate theme — design spec

This spec defines the **visual and verbal theming** of Standoff. It does not change the rules, mechanics, or data model — those live in `projectInfo/rules.md` and remain authoritative. When this spec and the rules disagree on terminology, the rules' theme-neutral terms remain in code; this spec governs what the user *sees and reads*.

## Theme statement

A mutiny on the high seas. The captain is dead, his hoard is on the table in his quarters, and the navy is hours out. Eight progressively desperate rounds where the surviving crew points flintlocks at each other and divvies up the spoils — until one pirate walks away with the lot, or the deck is empty.

Visual register: **playful pirate copy on illustrated woodcut / scrimshaw art.** The art is handmade-feeling, the writing is fun. The two don't fight each other — Sea-of-Thieves-adjacent. The whole big screen reads as an antique parchment treasure map.

## Vocabulary map

These are the public-facing strings (UI labels, i18n values, headings, dialogue). Code/types continue using the theme-neutral names from `rules.md`.

| Theme-neutral (rules.md) | Pirate (UI) |
|---|---|
| Bullet card | **Powder load** (or just "Load") |
| `clic` | **Click** (the empty hammer-snap) |
| `bang` | **Shot** |
| `bang!bang!bang!` | **Broadside** |
| Loot pile on the table | **The captain's hoard** / **Plunder** |
| Cash held by player | **Take** (or **Booty**) |
| $5,000 banknote | **Silver piece** |
| $10,000 banknote | **Gold doubloon** |
| $20,000 banknote | **Jeweled treasure** |
| Wound | **Wound** (kept) |
| Shame marker | **Yellow streak** |
| Duck / Withdraw | **Yield** (verb) |
| Standoff | **Standoff** (kept) |
| Player (alive) | **Mate** / **Crew** |
| Player (dead) | **Walked the plank** |
| Round | **Round** — narrative-framed in the round indicator (see below) |

## Copy tone

Pirate-flavored, not full "Arr matey." UI labels stay clear and functional; flavor lives on dramatic beats.

- **Functional UI labels** stay direct. *"Yield"*, not *"Strike thy colors"*. *"Ready"*, *"Start"*, *"Aiming at: [name]"*.
- **Dramatic beats** lean in:
  - Phase-2 countdown caption: *"Three… two… one… STAND."*
  - Broadside reveal headline: *"They double-loaded the powder!"*
  - Final round indicator: *"Sails on the horizon."*
  - End-game winner: *"[Name] walks away with the lot."*
- **No "Arr"s on every button.** They're a spice, used at moments when the table should grin.

## Round narrative

The 8 rounds are framed as the crew's window before the navy arrives. Round indicator on the big screen reads:

```
Round 3 of 8 · Navy ~5 hours out
```

Mapping (approximate, just for flavor — no game-mechanical effect):

| Round | Suffix |
|---|---|
| 1 | "Navy ~8 hours out" |
| 2 | "Navy ~7 hours out" |
| … | … |
| 7 | "Navy ~1 hour out" |
| 8 | "Sails on the horizon." |

No on-screen ship animation needed. The framing is text-only and lives in the round indicator slot already specified by `rules.md`.

## Big-screen visual identity

### Frame

The whole composition is a **parchment treasure map**, top-down. Player seats arranged in a polygon; the captain's chest at the centre is the loot pile. Hand-inked compass rose in one corner, decorative scroll for the round indicator, dotted/dashed travel paths between seats as a subtle background motif. Edges of the screen feather into aged parchment.

This frame inherits the targeting-line geometry already prototyped — see the user-memory note `standoff_targeting_lines.md` for the dual-lane CSS line approach. Targeting lines render as inked red strokes on the parchment.

### Colour palette

Two-color foundation:

- **Parchment cream** — `#e8d8b0` — base background
- **Ink red-brown** — `#5a371d` — primary type, line work, illustration ink

Accents:

- **Gold leaf** — `#d4a85a` — coin highlights, the chest, hoard glow
- **Signal red** — `#c93a30` — active targeting lines, the yellow-streak ribbon's contrasting tip, the broadside reveal flash

No emoji in production UI. All icons are **inked SVG** in the woodcut style (skull-crossbones variants, powder-load illustrations, coin/doubloon/jewel glyphs).

### Typography

- **Headers** — a woodcut display face (Cinzel / Pirata One / similar — final pick during implementation)
- **Body** — system serif (Georgia / Iowan Old Style)
- Numerals (cash totals, countdown digits) — same display face for consistency

### Loot reveal

The captain's chest sits at the centre of the map. Each round's 5-banknote draw animates as **coins and jewels flying out of the chest** into the central plunder pile (~1.5s entry per `rules.md`). Unsplit carryover stays visible in the pile between rounds. Round 8: the chest closes after the final draw.

Banknote denominations as three visually distinct loot tokens:

- Silver piece ($5k) — small, plain, slightly tarnished
- Gold doubloon ($10k) — round, embossed, warmer gold
- Jeweled treasure ($20k) — a ring or goblet with a coloured stone

## Player identity

Each player is identified by a **pirate flag emblem** chosen in the lobby — woodcut-style skull-and-crossbones variants drawn from historical pirate flags:

- Calico Jack's (skull over crossed sabres)
- Blackbeard's (skeleton with hourglass spearing a heart)
- Black Bart's (pirate standing on two skulls)
- Henry Avery's (skull in profile with bandana)
- Edward Low's (red skeleton)
- Stede Bonnet's (skull with horizontal bone and heart)
- A "no-name" generic skull-and-crossbones as a fallback

That's 6 named flags + 1 fallback for v1's 4–6 player range — one slot of headroom. If the data-model-supports-more case lands, additional flags get added then.

Flags are picked from a single grid in the lobby — first-come-first-served. Display name optional (defaults to a randomly generated nickname like *Old Salt*, *One-Eye*, *Wet Match*).

The flag is what the player sees on the targeting picker, on their own phone, on the big-screen player card, and on every targeting line connected to them. Symbolic, no character art needed, distinctive at a glance.

The data model already supports this via the `colorOrAvatar` field on `Player` (`rules.md`). No type changes required.

## Phone view aesthetic

The phone is the flintlock. Phase-by-phase:

- **Lobby** — flag picker grid, optional display-name field, "waiting for the captain to start."
- **Phase 1 (load & aim)** — two pickers, vertically stacked or side-by-side: *"Choose a powder load"* (three load cards: Click / Shot / Broadside, drawn as woodcut illustrations of the loaded chamber) and *"Pick yer mark"* (grid of opponents, each shown as their flag + name). Ready button locks both.
- **Phase 2 (standoff countdown)** — flintlock-barrel-end framing the target's flag in the centre; caption *"AIM TRUE"*. No input. Live 3-2-1.
- **Phase 3 (yield)** — large scrolled **YIELD** button on a yellow ribbon banner. Indicator above shows who is aiming at you (their flag + name). Live countdown.
- **Phase 4–5 (reveal)** — read-only mirror of big-screen action. Haptic on getting shot or hitting someone.
- **Phase 6 (split)** — read-only. Haptic on getting paid.
- **Eliminated state** — spectator view, read-only big-screen mirror. *"Ye walked the plank."*

## Sound

**Out of scope for v1** per `rules.md`. Wishlist for when sound lands:

- Powder-cocking click on Phase 1 ready
- Flintlock crack on each shot reveal
- Ship's bell on round transition
- "Broadside!" voice stinger on B!B!B! reveal
- Sea ambience under the lobby and phase 2 countdown

A host-side mute toggle becomes a requirement when sound ships.

## Out of scope for v1 (theme)

- Animated ship sailing in on round 8.
- Per-flag custom voice lines (e.g., Blackbeard taunts).
- Music score.
- Localised pirate dialect in non-English locales — i18n keys exist; pirate flavor is English-only in v1, other locales get clean translations.
- Custom character portraits — flags only.

## Open theme decisions (deferred)

- **Project name.** `rules.md` calls Standoff a "working title." Now that the theme is set, options are: keep **Standoff** (already-decided, all routing/package references use it, the noun fits pirate fiction fine), or rename to something pirate-native — *Mutiny*, *Broadside*, *Plunder*, *Doubloons*. Recommend keeping **Standoff** unless the user has a strong preference; the cost of a rename is non-trivial (package.json, vercel project, README, future memory references) and the word is already pirate-compatible.
- Final pick of the woodcut display typeface.
- Whether the captain's chest at the centre is purely visual or also doubles as the round indicator (collapsing two UI slots into one). Decide once the layout is wired up.
- Whether eliminated players get a unique "ghost flag" overlay vs greyed-out flag.
