# Cop × Super-Powers (Wave 2) — Design

**Status:** Draft for review · 2026-05-14
**Scope:** Wave 2 of the Cop-in-the-Mafia variant. Lifts the wave-1 lobby mutual-exclusion so the cop variant and the super-powers variant can run in the same game, handles the one engine-level rule contact (Insane × phase 8), defines the two-card phone layout, and surfaces both role and power at the end-game reveal. Minimal compatibility layer — no new mechanics.

## Goal

Make the Cop and Super-Powers variants compose. After wave 2, the host can enable both toggles in the lobby; players are dealt a role AND a power; the round-1 phone intro shows both cards in sequence; both sit persistently in the phone's corner area through the game; and the reckoning reveal surfaces all secrets (role + held-but-unused powers) in one beat.

## Out of scope

- Any new game mechanic, copy moment, or interaction beyond what's strictly required for compatibility.
- Cop-deduction tooling (no accusation tracker, no public suspect vote — same stance as wave 1).
- Reworking either variant's wave-1 single-system behavior.

## Lobby toggle

- Remove the wave-1 mutual-exclusion guard. The "A Privateer Among Us" toggle and the Super Powers toggle become independent checkboxes. Any of {none, cop-only, powers-only, both} are valid.
- Player-count gating stays per-variant: cop variant requires 5-6 hands; super-powers retains its existing requirement. When both toggles are on, the *intersection* applies.
- Drop the "wave-2 will combine" hint copy from wave-1's tooltips.
- The in-lobby variant banner composes: cop-only → existing "A Privateer sails among us…"; powers-only → existing super-powers banner; both → both banners stack (exact copy detail in implementation).

## Setup

When both variants are on:

- The engine deals one role (cop or mafia) AND one super-power per player, in the same setup beat. Existing wave-1 dealing logic for each runs independently — the cop deals 1 cop / N-1 mafia; the super-powers deals one card per player from the configured pool.
- Deterministic by seed, no cross-variant coupling.

## Two-card phone layout

### Tucked state (always visible during play)

- **Role card** at the bottom-**left**, **power card** at the bottom-**right**. Both tucked simultaneously.
- Each scales to roughly half the canvas width (target: `scale(0.35–0.4)` of the LG 300×400 card, with the exact scale tuned in implementation). The two cards sit comfortably along the bottom row without crowding the footer's cash strip in the middle.
- The footer (cash + wound pips + shame pips) stays centered between the two cards. If pip rows conflict with card chrome at the chosen scale, pips migrate up slightly into the body — implementation detail.

### Open state

- Tap a tucked card → it grows to centre with the dark backdrop, exactly like wave-1's single-card open behavior.
- The opposite tucked card stays at its corner while the other is open.
- Tap the backdrop OR tap the opposite tucked card → currently-open card flips/shrinks back to its corner. If the tap target was the opposite card, it opens immediately after.
- One card open at any time, ever.

### Single-system fallback

The bottom-left/right split only activates when **both** systems are on for the player. Otherwise wave-1 single-card behavior applies:

- Cop-only game: role card tucks to bottom-right alone (wave-1 unchanged).
- Powers-only game: power card tucks to bottom-right alone (wave-1 unchanged).

## Intro choreography (round 1 commit entry)

When both role and power exist for this player, the auto-reveal plays **sequentially**:

1. Phone mounts at round 1 commit.
2. **Role card** auto-opens face-up at centre with backdrop + "Tap when ready" hint. The power card is not yet rendered.
3. Player taps role card → flip face-down + shrink to bottom-**left** corner. Backdrop fades.
4. As soon as the role's close animation completes (~550ms), the **power card** auto-opens face-up at centre with backdrop + "Tap when ready" hint. Role card now sits tucked at bottom-left.
5. Player taps power card → flip face-down + shrink to bottom-**right** corner. Backdrop fades.
6. Normal game proceeds with both cards tucked at their corners.

When only one card system is on for the player, the relevant card runs its wave-1 single-card intro alone.

## Insane × phase 8 interaction

Paper rule: an Insane (Pocket Inferno) detonation ends the round, including phase 8.

### Engine change

When the split phase exits with `round.resolution.roundTerminated === true`, the phase machine **skips the `telephone` phase** and advances directly to the next round's commit. This is one more short-circuit on the existing skip branch (alongside "round > 6", "variant off", "no eligible holders").

### Visuals

None added. The grenade explosion + round-terminated stamp already communicate "round over" — phase 8 simply doesn't appear. The switchboard count doesn't advance for the skipped round, which is correct: no call could have been made.

### Mid-phase-8 detonation

Not possible. Insane can only detonate when a wound lands; wounds resolve during split. No shooting happens during phase 8, so the grenade can't fire mid-pass.

### Cop holding an armed Insane

The cop *can* arm the grenade. If they take a wound that round, the grenade detonates → round terminates → phase 8 skipped → no call possible that round. Player's choice; no extra UI.

## End-game reveal

At reckoning entry, in the **same beat** as wave-1's role-card flip:

- Any `Player.effects[i].revealed === false` get flipped to `true` at the game-end transition (one engine step on entering `Game.phase === "ended"`).
- Crew-row power badges then render via the existing `revealed` filter — previously-unrevealed powers pop in via the same `popIn` animation already used for in-game power reveals.
- Role cards flip simultaneously, as in wave-1.

Net visual: a single "all secrets revealed" moment — role flip + previously-unrevealed power badges materializing on the same crew row at the same instant. Investigation summary and verdict play after, unchanged from wave-1.

## Edge cases & subtle interactions

### super_coward × cop's flashing-shame budget

Different mechanics:

- **super_coward** (Yellow-Belly's Purse) inverts the **cash math** at scoring (cash − $5k × shame becomes cash + $5k × shame).
- The **cop's flashing-shame budget** is a **binary mission-failure threshold** (≤1 flashing wins, 2+ fails).

They don't interact. A cop with super_coward who takes 2+ flashing shame still fails the mission and falls into mafia-bracket scoring — where super_coward then inverts their cash math. Cop wins via mission verdict are unaffected (no cash math involved). No special handling.

### Other powers

`unbreakable`, `dragon_skin`, `tough`, `specialist`, `six_feet_under`, `the_kid`, `the_cunning` — none touch the cop's mission, the lantern pass order, the switchboard count, or the win condition logic. They modify combat / scoring within the existing brackets without rules contact. No special handling.

### Sole-survivor clause × powers

Cop is sole survivor → cop wins (mission verdict short-circuits cash math). Powers held by the (dead) mafia don't influence the outcome. Same as wave-1.

## Dev / mock affordances

New scenarios in `src/components/dev/scenarios.ts` (tagged `kind: "cop"` and gated on both variants on):

- `cop-with-insane` — cop arms Pocket Inferno, takes a wound, round terminates, phase 8 skipped that round.
- `mafia-with-tough` — mafia holds Phantom Pain; cop calls; verify the power resolves alongside the cop mission with no interference.
- `cop-with-super-coward` — cop ducks too much (2+ flashing shame) → mission fails → mafia-bracket scoring with cop's shame inverted by super_coward.
- `cop-and-powers-baseline` — both variants on, no special interaction; verify the layout, intro choreography, and end-game reveal all compose cleanly.

ScenarioDock UI: a new "Cop × Powers" dropdown alongside the existing "Normal / Super Powers / Cop variant" groupings. Or — equivalently — surface these scenarios under the existing Cop group with a label prefix; final placement is an implementation detail.

## Testing scope

**Engine unit tests:**
- Phase-machine skip: when `roundTerminated === true` at split exit, the next transition is `commit` (not `telephone`).
- Game-end transition flips every `Player.effects[i].revealed` to `true` when `Game.phase` transitions to `"ended"`.
- Lobby gating: both variants can be enabled simultaneously; player-count intersection enforced.

**Resolver / scoring tests:**
- Cop with super_coward who fails mission → mafia-bracket scoring with shame inverted.
- Cop with armed Insane who takes a wound → roundTerminated → no call placed → phase 8 skipped → no switchboard advance that round.
- Cop in sole-survivor path with any held power → cop wins regardless.

**Regression:**
- Wave-1 cop-only suite stays green.
- Wave-1 super-powers suite stays green.
- Base-game suite stays green.

**No UI snapshot tests** — consistent with the rest of the codebase.

## Wave-3 hooks

None planned. This spec is intended to close the cop-variant track.
