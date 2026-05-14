# Super Powers (Wave 1) — Design

**Status:** Shipped · 2026-05-13
**Scope:** The "Super Powers" advanced variant of *Cash'n Guns* (Repos Production, 2005), wave 1 of 2.

> **Outcome:** Wave 1 shipped as designed. Of the four wave-2 deferrals below, three shipped on top of wave 1 (Insane → *Pocket Inferno*, Kid → *Dead Eye*, Cunning → *Bloodhound*); **You Don't Need It Anymore…** was dropped — its multi-target commit shape would have rewritten the resolver and big-screen targeting layer for one card and we judged the cost-to-payoff wrong.

## Goal

Ship the **Super Powers** variant of Standoff: a host-toggleable advanced mode that deals one persistent power card to each player at game start, modifying round resolution and/or endgame scoring. Wave 1 covers the 6 canonical powers whose digital translation is contained; the 4 powers that demand engine-level changes (late commits, multi-targeting, phase-interrupting) are deferred to wave 2.

The variant must coexist with the existing base game: with the toggle off, behavior is identical to v1.

## Out of scope (deferred to wave 2)

Four canonical powers are deferred because each requires a structural engine change:

- **The Kid** — choose target *after* everyone else (splits the bullet+target commit lock).
- **The Cunning** — choose bullet *after* seeing aim (same split, other direction).
- **You Don't Need It Anymore…** — claim a dead player's gun + bullets, play two targets/round (doubles the commit shape and resolver output).
- **The Insane** — one-shot grenade that interrupts the round and skips remaining phases.

The "Cop in the Mafia" variant is also out of scope; it will be its own design pass after wave 1 ships.

## Wave 1 power roster

| # | Canonical name | Pirate name (draft) | Effect | Reveal trigger |
|---|---|---|---|---|
| 1 | 6 Feet Under | Davy Jones's Cut | +$10,000 per gangster killed during the game | Auto, endgame leaderboard |
| 2 | The Unbreakable | Ironhide | Killed only on 4th wound (not 3rd) | Auto, when 3rd wound would land |
| 4 | Dragon Skin | Krakenscale | Max 1 wound per round, regardless of bullets hitting | Auto, when 2nd wound would land |
| 8 | Super Coward | Yellow-Belly's Purse | Each shame marker is **+$5,000** instead of −$5,000 | Auto, endgame leaderboard |
| 9 | The Specialist | Quartermaster's Reload | One-shot: after playing B!B!B!, take it back and discard an unused bullet instead | Manual, new phase `specialist_prompt` |
| 10 | It Does Not Even Hurt! | Phantom Pain | One-shot: take a split share even if wounded or withdrew this round | Manual, new phase `tough_prompt` |

Pirate names are drafts; final copy lives in `en.json`. Internal `PowerKind` values use the slugs `six_feet_under`, `unbreakable`, `dragon_skin`, `super_coward`, `specialist`, `tough`.

## Architecture

### Data model — effects as discriminated-union records

`Player.effects: Effect[]` (currently empty) becomes a typed list of `PowerEffect`:

```ts
export type PowerKind =
  | 'six_feet_under'
  | 'unbreakable'
  | 'dragon_skin'
  | 'super_coward'
  | 'specialist'
  | 'tough';

export interface PowerEffect {
  kind: PowerKind;
  revealed: boolean;       // public knowledge once true
  used?: boolean;          // for one-shots (specialist, tough)
}

export type Effect = PowerEffect;  // replaces the placeholder { kind: string }
```

Each player holds **at most one** `PowerEffect` (wave 1 deals exactly one per player). The shape allows multiple in case a future variant needs it.

### Variants flag on `Game`

```ts
export interface GameVariants {
  superPowers: boolean;
}

export interface Game {
  // ...existing
  variants: GameVariants;
}
```

`Player.wounds` widens from `0 | 1 | 2 | 3` to `0 | 1 | 2 | 3 | 4` to accommodate Unbreakable's 4-wound death threshold.

### Per-round activation slot on `Round`

```ts
export interface RoundActivations {
  specialist?: { playerId: string; discardedBulletKind: BulletCard };
  tough?: string[];
}

export interface Round {
  // ...existing
  activations: RoundActivations;  // {} on entry to commit; mutated during specialist_prompt and tough_prompt
}
```

`Round.activations` is the shared store the state machine uses to pass player-choice activations into the resolver across re-resolves. Reset to `{}` at the start of each round.

### Privacy model

`react-gameroom` does not provide private state; the existing game uses a single shared Firebase document (`rooms/${roomId}/game`) and relies on UI-level filtering for secrecy (the same pattern bullets use). Power cards follow this convention:

- Each phone renders **only its own player's** `effects`.
- The big screen renders only effects with `revealed === true`.
- A determined player with devtools can peek — same threat model as bullets, unchanged.

No library change required.

### Power dealing — `setup.ts`

`initGame(players, seed, now, variants)` — fourth param. When `variants.superPowers`:

1. Build the 6-card power deck: `['six_feet_under', 'unbreakable', 'dragon_skin', 'super_coward', 'specialist', 'tough']`.
2. Shuffle with the existing seeded RNG.
3. Deal one card to each player as `effects: [{ kind, revealed: false, used: false }]`.
4. Unused cards (player count < 6) stay in the shuffle pile; not surfaced.

When variant off, `effects: []` as today.

### Phase machine

**v1:**
```
commit → standoff → standoff_hold → withdraw → reveal_withdraw → reveal_bbb → reveal_others → split
```

**Variant on (two new phases, both auto-skip when no input needed):**
```
commit → standoff → standoff_hold → withdraw → reveal_withdraw → reveal_bbb
       → specialist_prompt → reveal_others → tough_prompt → split
```

**Skip rules:**

- `specialist_prompt` skips immediately when: variant off · no Specialist holder · holder didn't play B!B!B! this round · Specialist already used · holder is dead.
- `tough_prompt` skips immediately when: variant off · no Tough holder · holder not alive · holder already in `standing` · Tough already used.

When interactive, both phases have a soft **10-second timeout** that defaults to Skip.

### Resolver — `resolveRound(commits, players, loot, activations?)`

Fourth parameter:

```ts
export interface RoundActivations {
  specialist?: { playerId: string; discardedBulletKind: BulletCard };
  tough?: string[];
}
```

Execution order:

1. Compute `ducks`, `surprisedShooters`, `shots`, `woundedThisRound`. *(existing)*
2. **Apply Dragon Skin clamp** — for each holder with unrevealed Dragon Skin and `woundedThisRound[pid] > 1`, clamp to 1 and push `PowerActivation`.
3. **Apply Unbreakable** — for each holder with unrevealed Unbreakable about to die (`wounds + woundedThisRound[pid] >= 3`), raise their personal death threshold to 4 and push `PowerActivation`.
4. Compute `eliminated`, `standing`. *(existing)*
5. **Apply Tough** — for each `activations.tough` player still alive, add to `standing` (if not already) and push `PowerActivation`. Mark `effects` entry `used: true, revealed: true`.
6. `splitLoot(loot, standing)` → `awards`, `carryover`. *(existing)*
7. **Apply Specialist** — if `activations.specialist`, swap the bullet bookkeeping for that player: the played B!B!B! stays in `Player.bullets` (not removed), the chosen unused bullet kind is removed from `Player.bullets` instead; symmetrically the chosen bullet is pushed to `discardedBullets` rather than the B!B!B!. The wound the B!B!B! already inflicted is unchanged. Mark `effects` entry `used: true, revealed: true`. Push `PowerActivation`.

`RoundResolution` grows by one field:

```ts
export interface PowerActivation {
  playerId: string;
  kind: PowerKind;
  context?: Record<string, unknown>;
}

export interface RoundResolution {
  // ...existing
  powerActivations: PowerActivation[];  // [] when no powers fired
}
```

### Re-resolution cadence

The resolver is pure; its inputs change across the round as activations arrive. The state machine re-resolves and re-writes `round.resolution` at three beats:

1. **`withdraw → reveal_withdraw`** — `resolveRound(commits, players, loot, {})`. Auto-powers fire.
2. **`specialist_prompt → reveal_others`** — re-resolve with `activations.specialist` (if any).
3. **`tough_prompt → split`** — re-resolve with both `activations.specialist` and `activations.tough`. Authoritative result.
4. **`split → next round`** — apply `result.players` to game state. *(existing)*

Reveal animations always read the latest `round.resolution`; deterministic re-resolution keeps the animation data valid.

### Endgame scoring — `src/game/scoring.ts` (new)

```ts
function finalScore(player: Player, totalKills: number): number {
  const cashTotal = player.cash.reduce((s, b) => s + b.value, 0);
  const shameSign = hasEffect(player, 'super_coward') ? +1 : -1;
  const undertakerBonus = hasEffect(player, 'six_feet_under') ? 10_000 * totalKills : 0;
  return cashTotal + shameSign * 5_000 * player.shame + undertakerBonus;
}
```

- `totalKills = players.filter(p => p.status === 'dead').length` — every kill counts, regardless of who killed whom (per the canonical "shareholder of the undertakers" framing).
- Dead players still score $0 per base rules; their held powers (including 6 Feet Under) become inert.
- Tiebreakers unchanged from rules.md: score → fewer shame → more wounds → shared win.

The formula currently lives only in rules.md and the in-flight endgame screen; centralizing it in `scoring.ts` makes the variant logic testable and keeps it in one place.

## UI surfaces

### Lobby (big screen, `RoomPage`)

New "Variants" panel with a **Super Powers** toggle (default off). Disabled once Start is pressed. The committed value goes onto `Game.variants.superPowers` in `initGame`.

Phones in lobby get a small banner: "Variant: Super Powers ⚓" when enabled.

### Game start (phone, `PlayerPage`)

On Start with variant on, each phone receives its dealt power and shows a full-screen card reveal: art, name, description, "Tap to start." On dismiss, the card collapses to a persistent bottom-right badge in every in-game phone view; re-tappable to re-read. Card is private to that phone for the whole game.

### In-game additions

**Phone:**
- **Persistent power widget** on every phase screen; greys out + "used" stamp after one-shot consumption.
- **`specialist_prompt` modal**: "Use the Quartermaster's Reload?" with body explaining the swap. Bullet grid (remaining hand, excluding the played B!B!B!). Buttons: **Use & Reveal** (enabled once a bullet is selected) / **Skip**. 10s soft timer defaulting to Skip.
- **`tough_prompt` modal**: "Use Phantom Pain?" with body explaining the override. Buttons: **Use & Reveal** / **Skip**. 10s timer.

**Big screen:**
- **Power badge** next to each player's `PlayerNode` on the `GameBoard` once `revealed === true`. Small sigil, not full card.
- **Auto-reveal overlays** (Unbreakable, Dragon Skin during reveal phases): when `powerActivations` contains the player, an overlay slides the power card from the player's slot to centre, holds ~1.5s, then dissolves while the modified wound animation plays.
- **Manual-reveal overlays** (Specialist, Tough): on Use tap, card flips face-up next to the player; effect-specific animation follows (B!B!B! returning to player's hand for Specialist; character popping upright for Tough).
- **Auto-skipped prompt phases** show nothing — phase machine just advances.

### Endgame leaderboard

Per-rank reveal (existing animation) gets extra row segments when variant on:

```
[Cash $XX,XXX]  [±Shame $X,XXX]  [+Undertaker $XX,XXX]  =  Total $XX,XXX
```

`±Shame` sign comes from the row's Super Coward effect (if any). Undertaker bonus row only renders for 6 Feet Under holders. Any **unrevealed** held powers flip face-up next to the row for closure — no score impact, just the satisfying "I had X all along" beat.

## File structure

**New:**
- `src/game/scoring.ts` — `finalScore`, `hasEffect`, tiebreaker comparator
- `src/game/scoring.test.ts`
- `src/game/powers.ts` — `dealPowers(rng, players)`, `eligibleForSpecialist(game, playerId)`, `eligibleForTough(game, playerId)`
- `src/game/powers.test.ts`
- `src/components/powers/PowerCard.tsx` — face-down / revealing / face-up / used variants
- `src/components/powers/PowerBadge.tsx`
- `src/components/powers/registry.ts` — `Record<PowerKind, { name: string; descriptionKey: string; icon: ReactNode }>`
- `src/components/screens/SpecialistPromptScreen.tsx`
- `src/components/screens/ToughPromptScreen.tsx`
- `src/components/dev/MockPowerReveal.tsx` (DEV-only) — isolated animation playground

**Modified:**
- `src/game/types.ts` — `PowerKind`, `PowerEffect`, `GameVariants`, wider `Player.wounds`, `RoundResolution.powerActivations`, `RoundActivations`, `Round.activations`, `Game.variants`
- `src/game/setup.ts` — `initGame` takes `variants`; deals powers when on
- `src/game/resolver.ts` — Dragon Skin clamp + Unbreakable threshold + Tough standing-merge + Specialist bullet-bookkeeping; populates `powerActivations`
- `src/game/transitions.ts` — `startNextRound` preserves `variants`
- `src/game/deserialize.ts` — round-trip `variants`, `effects`, `activations`
- `src/hooks/useGameState.ts` — new phase transitions, re-resolve on activation writes, `submitSpecialist` and `submitTough` write helpers
- `src/pages/RoomPage.tsx` — lobby toggle, in-game overlays
- `src/pages/PlayerPage.tsx` — start-of-game card reveal, persistent widget, prompt-phase routing
- `src/pages/MockBigScreen.tsx` + `src/pages/MockPlayerPage.tsx` — variant toggle, activation triggers
- `src/components/GameBoard.tsx` — `PowerBadge` on `PlayerNode`
- `src/locales/en.json` — variant copy, power names/descriptions, prompt copy

## Testing strategy

**Unit (vitest, no UI):**
- `setup.test.ts` — power deck size, deterministic deal given seed, one-effect-per-player, variant-off deals no powers.
- `resolver.test.ts` — one suite per power (Unbreakable, Dragon Skin, Specialist, Tough) plus interactions: multi-holder rooms, voided B!B!B! still triggers Specialist eligibility, dead-this-round holder is ineligible for both manual powers.
- `scoring.test.ts` — base formula, Super Coward sign flip, 6 Feet Under bonus, dead 6-Feet-Under holder scores nothing.
- `powers.test.ts` — `eligibleForSpecialist` / `eligibleForTough` true and false cases.
- Registry smoke test — 6 entries, no missing copy keys.

**Regression:** identical `commits` + `players` + `loot` resolves to identical `RoundResolution` (ignoring empty `powerActivations`) with variant on vs off.

**Mock pages (DEV-only):**
- `MockBigScreen` — "Super Powers" checkbox + per-power "force activation" buttons.
- `MockPlayerPage` — per-power "deal me this card" selector + "show prompt" buttons.
- `MockPowerReveal` — isolated reveal animations, looped.

## Edge cases

- **4-player game**: 6-card deck → 2 powers unused, no leak.
- **Specialist's only B!B!B! played in an earlier round without activation**: card becomes dead weight; eligibility fails permanently. Widget still shows "Specialist (unused)" for the rest of the game.
- **Specialist holder dies the round they played B!B!B!**: prompt skipped (dead players ineligible).
- **Tough holder ducked AND took 0 wounds**: eligible (shame still paid).
- **Tough holder hits 3rd wound**: eliminated; Tough cannot revive — skipped.
- **6 Feet Under holder dies mid-game**: dead → scores $0 per base rules; power inert but still revealed in leaderboard.
- **Super Coward with 0 shame**: +$0; still revealed.
- **Activation write race** (phone Use vs server timeout): server treats write before timeout as activated; after as no-op. Activation slot is idempotent.
- **Resume game** (player rejoin after disconnect): `variants`, `effects`, `activations` round-trip through Firebase deserialization. Covered in `deserialize.test.ts`.

## Open design questions (to resolve during implementation)

1. **Pirate names** — drafts above; user to confirm or override before copy lands.
2. **Reveal animation timings** — 1.5s overlay is a placeholder; tune in implementation. Overlay must complete before phase auto-timer fires.
3. **Card art** — six new SVGs in the existing woodcut style; inline like the flag SVGs, or a sprite sheet. Decide during visual pass.
4. **Per-power description copy** — written when copy lands in `en.json`.

## Wave 2 preview (informational, not in scope)

Wave 2 will tackle the four deferred powers. Each requires its own engine change:

- **Late-commit pathway** (Kid, Cunning): split the bullet+target lock; allow one half to be deferred until after the standoff reveal.
- **Multi-target commits** (You Don't Need It Anymore…): doubled `commits[playerId]` shape, ownership transfer on death, dual targeting lines on big screen, two-slot phone picker.
- **Phase-interrupting power** (Insane): grenade resolves the current phase, wounds all standing, terminates the round; needs a new "interrupt" resolution path.

Wave 2 will be its own spec → plan → implementation cycle.
