# Insane (Wave 2 · Power 1 of 2) — Design

**Status:** Draft for review · 2026-05-12
**Scope:** The Insane power — one-shot grenade that terminates the round early when the holder is wounded. First of two wave-2 specs (Kid + Cunning will follow).

## Goal

Add the 7th Super Powers card — **Insane** (pirate name: *"Pocket Inferno"*, working) — to the host-toggleable variant shipped in wave 1. The holder reveals their grenade during one of the first three round phases; if any wound lands on them later that round, the grenade detonates, wounding every still-standing player and ending the round before the split.

The variant integration follows the wave-1 pattern: dealt via the existing one-effect-per-player mechanism, lives on `Player.effects`, fires through the existing resolver and overlay surfaces.

## Out of scope

- **The Kid** and **The Cunning** — their shared late-commit pathway is its own wave-2 spec.
- **You Don't Need It Anymore…** — deferred entirely (cut decision from wave 1 brainstorm).

## Mechanic — simplified explosion model

Per [the canonical *Cash'n Guns* Insane card](../../projectInfo/rules.md), the grenade fires *at the end of the phase* where the holder takes their first wound. Implementing that faithfully would require per-phase ordered resolution + voiding of later-phase shots — significant engine work for an edge case difference of one wound on a player who would have taken two hits.

This spec adopts a **simplified end-of-round model**:

1. Holder reveals the grenade during `commit | standoff | standoff_hold`.
2. The round continues normally through `withdraw → reveal_withdraw → reveal_bbb → specialist_prompt → reveal_others → tough_prompt → split`.
3. After all shot resolution, if the holder has any wound this round, the grenade fires:
   - Every player alive AND not ducked AND `woundedThisRound === 0` (excluding the holder) takes one extra wound.
   - The round is terminated: `awards = {}`, `carryover = [...allLoot]`, split is skipped.
4. The grenade is *consumed* whether it fires or not — one-shot per game.

**Diff vs. faithful rule:** under simplified, a player who would have taken both a B!B!B! and a bang ends the round with 2 wounds; under faithful, just 1 (the bang would be voided). The simplified version still captures the deterrent + mutual-destruction vibe.

**Holder's own bullet card still fires.** Reveal is parallel to the regular shot; the bang/clic/B!B!B! they committed in `commit` resolves normally.

## Architecture

### Data model

`PowerKind` gains `'insane'`:

```ts
export type PowerKind =
  | 'six_feet_under'
  | 'unbreakable'
  | 'dragon_skin'
  | 'super_coward'
  | 'specialist'
  | 'tough'
  | 'insane';
```

`POWER_KINDS` in `src/game/powerKinds.ts` extends with `'insane'` (deck grows from 6 to 7).

`RoundActivations` gains a slot:

```ts
export interface RoundActivations {
  specialist?: { playerId: string; discardedBulletKind: BulletCard };
  tough?: string[];
  insane?: { playerId: string };
}
```

`RoundResolution` gains a terminator flag:

```ts
export interface RoundResolution {
  // ...existing fields
  powerActivations: PowerActivation[];
  roundTerminated?: { reason: 'grenade'; playerId: string };
}
```

The terminator is round-scoped data and is recomputed every re-resolve.

### Eligibility

`src/game/powers.ts` adds:

```ts
export function eligibleForInsane(game: Game, playerId: string): boolean {
  const player = game.players.find(p => p.id === playerId);
  if (!player || player.status !== 'alive') return false;
  if (!hasUnusedPower(player, 'insane')) return false;
  const phase = game.round.phase;
  return phase === 'commit' || phase === 'standoff' || phase === 'standoff_hold';
}
```

### Resolver — `resolveRound`

The existing 7 execution steps grow by one. Step 8 (NEW):

> **Apply Insane grenade.**
>
> If `activations.insane` is set:
> 1. Mark the holder's `insane` effect `used: true, revealed: true`.
> 2. If AND ONLY IF `(woundedThisRound[holder] ?? 0) > 0`:
>    - For every other player `pl` where `pl.status === 'alive'` (post-elimination) AND `!ducks.has(pl.id)` AND `(woundedThisRound[pl.id] ?? 0) === 0`:
>      - `woundedThisRound[pl.id] = 1`.
>      - Re-apply per-player wound/elimination logic (respecting Unbreakable thresholds for the grenade victim).
>    - `awards = {}`; `carryover = [...originalLoot]`.
>    - Push `PowerActivation { playerId: holder, kind: 'insane', context: { woundedTargets: [...] } }`.
>    - Set `resolution.roundTerminated = { reason: 'grenade', playerId: holder }`.

The Specialist swap (step 7 in wave 1) and the Tough re-add-to-standing (step 5) still apply normally; Tough's effect on `standing` is moot when the round terminates (split is skipped anyway), but the activation is still recorded.

### Phase machine short-circuit

`useGameState.ts`'s three re-resolve beats each check the new flag:

1. **`withdraw → reveal_withdraw`**: resolve. If `roundTerminated`, schedule the explosion overlay (2.8s linger via `GRENADE_EXPLOSION_MS`), then jump to next round / ended. No reveal sequence plays.
2. **`specialist_prompt → reveal_others`**: same check after re-resolve with Specialist activation.
3. **`tough_prompt → split`**: same check after final re-resolve. Safety net — earlier beats should normally catch it.

```ts
// Pseudocode for each of the three beats:
const result = resolveRound(commits, players, loot, activations);
if (result.resolution.roundTerminated) {
  // Animate the explosion overlay, then end the round.
  setTimeout(() => endRoundFromGrenade(result), GRENADE_EXPLOSION_MS);
  return;
}
```

`endRoundFromGrenade` is the merged path of the existing `split → next round` apply: `endGameStatus` check, then either `phase = 'ended'` or `startNextRound`.

`GRENADE_EXPLOSION_MS = 2800` — fits between the existing `REVEAL_BBB_MS = 5000` and `SPLIT_MS = 1800`.

### Re-resolution semantics

`activations.insane` is written by the holder during `commit | standoff | standoff_hold` — well before the first re-resolve at withdraw. So by the time the resolver first runs, the grenade slot is already on the round doc and factored in. No new resolver call is needed when the reveal is written.

## UI surfaces

### Phone — `InsaneRevealButton`

A floating pill above the phone footer (same anchoring slot as the persistent power widget), visible whenever `eligibleForInsane(game, me.id)` is true. Copy: **"REVEAL GRENADE"**.

On tap, opens a confirm dialog: *"Reveal the grenade now? You can't un-reveal."* Confirm writes `activations.insane = { playerId: me.id }` via `submitInsane`.

After reveal:
- The pill flips to a static "GRENADE ARMED" badge (no longer interactive).
- The persistent power-card widget's face is the Pocket Inferno card with the grenade sigil.
- At end of round, the card flips to "used" state.

### Big screen — two visible moments

1. **Armed badge**, persistent. `RoomPage` reads `round.activations.insane?.playerId` directly; the holder's player on the `CrewRow` shows the Pocket Inferno badge next to their flag for the rest of the round. (This is independent of `effects[].revealed` — the activation slot is the signal.)
2. **Explosion overlay**. When the resolver pushes a `PowerActivation { kind: 'insane' }`, the existing `PowerRevealOverlay` plays the Pocket Inferno card center-screen with the same 1.5s hold the wave-1 auto-reveal uses. The 2.8s phase-machine linger gives the overlay room to play before the next round starts.

### Endgame

No scoring impact. The card surfaces in the held-cards row of `EndGameRow` / `ReckoningScreen` like the other one-shots, used or unused, revealed or not. Unrevealed Insane flips face-up here for closure.

### Dev controls

- `POWER_KINDS` extension means the existing **"Reveal all powers"** and **"Force activations"** dev controls in `DevControlsPanel` pick up `'insane'` automatically.
- New dev button: **"Force grenade explosion"** — injects a synthesized `RoundResolution` with `roundTerminated: { reason: 'grenade', playerId: <first alive> }` so the dev can preview the overlay + bonus wounds + next-round handoff without driving a real game to the activation state.

## File structure

**New:**
- `src/components/screens/InsaneRevealButton.tsx` — phone-side pill + confirm dialog
- `src/components/powers/icons/Grenade.tsx` — sigil for the registry

**Modified:**
- `src/game/types.ts` — `PowerKind` += `'insane'`; `RoundActivations.insane`; `RoundResolution.roundTerminated`
- `src/game/powerKinds.ts` — append `'insane'`
- `src/game/powers.ts` — add `eligibleForInsane`
- `src/game/resolver.ts` — step 8 grenade logic
- `src/game/resolver.test.ts` — grenade scenarios
- `src/game/powers.test.ts` — eligibility cases
- `src/game/deserialize.ts` — round-trip `activations.insane` and `roundTerminated`
- `src/game/deserialize.test.ts` — new round-trip cases
- `src/components/powers/registry.ts` — `insane` entry
- `src/components/powers/icons/index.ts` — register Grenade
- `src/locales/en.json` — `powers.cards.insane.{name, description}` + `powers.insaneReveal.{button, confirmTitle, confirmBody, confirm, cancel}` + `powers.insaneArmed`
- `src/hooks/useGameState.ts` — `submitInsane` write helper + short-circuit branches + `GRENADE_EXPLOSION_MS`
- `src/pages/PlayerPage.tsx` — mount `InsaneRevealButton` when eligible
- `src/pages/RoomPage.tsx` — armed-badge handling driven from `round.activations.insane`
- `src/pages/MockBigScreen.tsx` — "Force grenade explosion" dev button
- `src/components/dev/DevControlsPanel.tsx` — wire the new dev button prop

## Testing strategy

**Unit (vitest):**

- `powers.test.ts` — `eligibleForInsane`: true within window, false in `withdraw` and later, false when already used, false on dead holder.
- `resolver.test.ts` — grenade scenarios:
  - Activated + holder wounded → standing players each +1 wound; `roundTerminated.playerId === holder`; `awards === {}`; `carryover === [...loot]`.
  - Activated + holder unwounded → effect marked used but no termination; awards/split run normally.
  - Not activated → no grenade math (regression).
  - Standing-set semantics: bang-wounded player excluded, ducked player excluded, holder excluded.
  - Unbreakable victim survives a grenade-induced 3rd wound.
  - Holder dies from triggering wound → grenade still fires for everyone else.
- `scoring.test.ts` — no changes needed; Insane doesn't touch endgame math.
- `deserialize.test.ts` — round-trips `activations.insane` and `resolution.roundTerminated`.
- `transitions.test.ts` — `startNextRound` after a grenade round resets activations cleanly.
- Variant-off parity regression: `activations.insane` present on a player without the effect → resolver no-ops on the grenade math.

**Mock pages:**

- `MockBigScreen` "Force grenade explosion" button injects a synthetic terminator + overlay activation; observer should see overlay + standing-pip pop + ~2.8s pause before fixture round resets.
- `MockPlayerPage` "Deal me insane" selection during `commit` exposes the `InsaneRevealButton` confirm dialog flow.

## Edge cases

- **Holder reveals, then ducks.** Reveal happens in phases 1–3; withdraw is phase 4. The holder may withdraw after revealing — they take a shame marker but no wound, so the grenade doesn't fire. Card is still consumed (one-shot). Tactical: the reveal is a deterrent that can save you when no one was committed to shooting you anyway.
- **Disconnect after reveal.** Grenade lives in server state; the resolver still fires when the holder is wounded. Reconnect shows post-state.
- **Reveal during disconnect.** `commit` is the disconnect-pause boundary. The grenade can be revealed but resolution waits for reconnect.
- **Two holders impossible.** One-effect-per-player dealing precludes this; no multi-grenade math.
- **Tough + Insane same round.** Insane terminates the round; split is skipped; Tough's re-add-to-standing is recorded but cosmetic. Document so the Tough holder isn't surprised.
- **Specialist + Insane same round.** Specialist holder plays B!B!B!, hits the Insane holder, grenade fires. Specialist's bullet swap still applies in step 7 of the resolver — both effects compose cleanly.
- **Insane holder is the only player alive at end of grenade round.** `endGameStatus` returns `last_alive` after the resolver applies wounds. `useGameState` jumps to `ended` instead of `startNextRound`. The 2.8s explosion linger still plays before the leaderboard.
- **Insane holder is among the eliminated from their own wound.** Grenade still fires for everyone else; the dead holder's card flips to revealed + used in the endgame.

## Open design questions (resolve during implementation)

1. **Pirate name.** Draft *"Pocket Inferno"*; alternatives: *"Mad Powder"*, *"Devil's Cask"*. User confirms in copy pass.
2. **Grenade sigil SVG.** Source TBD (svgrepo URL or inline bomb path). Same convention as wave 1 — `currentColor`-based, woodcut feel.
3. **Reveal-pill placement on phone.** Floating pill above footer — exact rem/px offsets may need tuning to avoid collision with the persistent power widget on small phones.
4. **Reveal-button copy & confirm dialog tone.** Whether to lean toward "ominous warning" or "swashbuckler defiance."

## Wave 2 next steps (informational)

After this spec lands and Insane ships, the second wave-2 spec covers **The Kid** and **The Cunning** together. Both share a *late-commit pathway* — a new mechanism where one half of a round's commit (target for Kid, bullet for Cunning) is deferred until after the standoff reveal. That's a bigger engine change (new phase, deferred-input state machine) and is intentionally scoped separately.
