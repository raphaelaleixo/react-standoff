# A Cop in the Mafia (Variant) — Design

**Status:** Draft for review · 2026-05-13
**Scope:** The "A cop in the Mafia" alternative variant of *Cash'n Guns* (Repos Production, 2005). This is **wave 1** of a two-spec sequence — wave 2 will integrate this variant with the existing Super Powers feature (cop × powers compatibility).

## Goal

Ship the **Cop in the Mafia** variant of Standoff: a host-toggleable alternative game mode that deals secret roles (one cop + N-1 mafia) at game start, adds a per-round phone-pass phase where the cop can secretly call for reinforcements, and replaces the base win condition with an asymmetric mission-plus-survival rule for the cop versus base-rules richest-wins for the mafia.

The variant must coexist with the existing base game and the existing Super Powers feature. In wave 1 the cop variant and the super-powers variant are **mutually exclusive at the lobby toggle** — wave 2 will lift that restriction.

## Out of scope (deferred to wave 2)

- **Super-powers × cop combination.** Paper rules permit combining; we ship cop-only first. Wave 2 spec handles all power × cop interactions, in particular Insane's grenade skipping phase 8 that round.
- **No deduction-helper UI** (no public "suspect voting" or accusation tracker — paper game doesn't have one, and adding it would tilt the variant toward formal detection rather than social bluff).

## Brainstorm decisions log

Decisions locked during brainstorm, kept here so future readers can see the design space that was rejected:

| Decision | Chosen | Rejected |
|---|---|---|
| Faithfulness | Full mission-plus-survival cop win condition | Pure-survival stripped variant |
| Phone-pass mechanism | Self-paced sequential pass | Simultaneous private vote · sequential with fixed window |
| Mafia pass-screen UI | PASS + decoy CALL button | PASS-only · disabled CALL |
| Super-powers compatibility | Mutually exclusive in wave 1; combined in wave-2 spec | Ship combined from the start · drop combination permanently |
| Player count gating | 5-6 players only | Extend to 4-6 |
| Cop archetype | **The Privateer** (cop's pirate-period analogue) | Redcoat · Crown's Eye · Snitch · Customs Man |
| Signal mechanism | **Note in a bottle**, passed under the table; 3 notes washed ashore = Navy sails | Signal lantern · Carrier pigeon · Coded handkerchief |

## Theme — pirate translation

Internal engine identifiers stay paper-faithful (`Role: 'cop' \| 'mafia'`, `Round.telephone`, `Game.cop`, `applyTelephoneCall`, etc.) so the code can read alongside the source rulebook. **User-facing strings** translate to the pirate theme:

| Engine concept | User-facing copy |
|---|---|
| Cop | **The Privateer** |
| Mafia | **The Brethren** |
| Telephone / Phone | **The Bottle** (a note in a bottle, passed under the table) |
| "Call" (cop's action) | **Send** (slip a note inside the bottle) |
| Switchboard (3-stage tracker) | **The Tide** (bottles drifting ashore) |
| 1st & 2nd calls | "A note washed ashore" |
| 3rd call (reinforcements) | **"Sails on the horizon"** |
| Reinforcements arrive | The King's Navy sails for these waters |
| Flashing-light shame | Shame markers earned after the Navy is on the way (still tracked engine-side as `{ flashing: true }`; visualized as a distinct glyph on the player card) |
| "JUSTICE SERVED" (cop wins) | **"BY THE CROWN'S JUSTICE"** |
| "Cop will not testify" (mafia wins) | **"The Privateer sleeps with the fishes."** |

All values live in `src/locales/en.json` under the `cop.*` namespace. The keys themselves stay paper-faithful (e.g. `cop.telephone.heading`) to keep the engine/string mapping legible; the *values* carry the pirate theme.

## Game shape

### Lobby toggle

- New variant toggle, **"A Cop in the Mafia"**, sibling to the existing super-powers toggle in the big-screen lobby.
- Disabled when player count is outside `[5, 6]`; tooltip *"requires 5 or 6 players"*.
- Mutually exclusive with the super-powers toggle (enabling one disables the other; hover hint notes wave-2 will combine).
- When player count drops to 4 mid-lobby, the toggle auto-disables and surfaces a toast *"Cop variant disabled — needs 5-6 players"*. Rising back to 5-6 re-enables the toggle but does not auto-re-toggle; host must opt in again.
- Phones in the lobby waiting room show a variant banner ("A cop is among you…"), same pattern as the existing super-powers banner.

### Setup

- Engine deals **secret roles** at game start, in the same beat that super-powers deals power cards (mutually exclusive in wave 1). Exactly 1 cop + (N-1) mafia. Deterministic by seed.
- Each phone runs a one-time card-flip reveal *before* round 1 commit:
  - **Cop**: black card with badge — *"You are the cop. Call for backup, stay alive, don't blink."*
  - **Mafia**: red card with gangster sigil — *"You are the mafia. The cop is among you. Find them. Kill them. Or get rich trying."*
  - Tap to acknowledge → card flips into the persistent corner widget.
- Big screen during this beat shows a synced "ROLES DEALT" overlay (no role info, just dramatic copy + count of acknowledged players). Round 1 commit begins once all phones acknowledge.

### Round flow

The base 7-phase round (commit → standoff → withdraw → reveal_bbb → reveal_others → split) gains an **8th phase, `telephone`**, between split and the next round's commit, for **rounds 1–6 only**. Rounds 7 and 8 skip phase 8 entirely (call window has closed).

Phase 8 also auto-skips when:
- The variant is off.
- No players participated in the split.

### Win conditions (override base outcome)

| Outcome | Trigger |
|---|---|
| **Cop wins** | Reinforcements arrived by end of round 6 (3 switchboard cards revealed) **AND** cop alive at end of game **AND** cop has ≤1 flashing-light shame marker |
| **Cop wins** | Cop is the only player alive at any point (sole-survivor clause, mirrors base) |
| **Mafia wins** | Any other outcome → richest gangster still alive wins, scored by base rules (cash − $5,000 × *total* shame, regardless of flashing/non-flashing distinction; the distinction matters only for the cop) |

Pre-call shame markers cost the cop nothing; only post-call shame markers count toward the duck-budget (≤1 allowed). Mafia don't care about the distinction — they're scored on total shame like base.

## Phase 8: The Telephone

### Eligibility & pass order

- **Eligible holders**: players who participated in this round's split (i.e. didn't duck, weren't wounded, were standing at split time).
- **Pass order**: ascending seat index among eligible holders. Same anchor every round.
- **Degenerate cases**:
  - 0 eligible holders → phase 8 skipped.
  - 1 eligible holder → that lone player gets the phone solo; if cop, they can call.
  - Cop dead → cop can't be in any future split, so no call possible. Phase 8 still runs (with mafia seeing decoy buttons) so the cop's death isn't telegraphed by the pass being silently skipped.

### Phone holder UI

Both cop and mafia see the **same screen shape** (decoy CALL button is the social bluff prop):

```
┌─────────────────────────┐
│  THE PHONE IS WITH YOU  │
│                         │
│  ╭───────────────────╮  │
│  │      PASS         │  │  ← primary action, hands phone to next holder
│  ╰───────────────────╯  │
│                         │
│  ╭───────────────────╮  │
│  │      CALL         │  │  ← real for cop, decoy for mafia
│  ╰───────────────────╯  │
└─────────────────────────┘
```

- **Cop's CALL**: tap → brief private confirmation animation (~1.2s, *"Call placed"*) → auto-passes. No confirm modal; the drama is in the tap.
- **Mafia's CALL**: tap → no-op except a faint button-press visual. May be tapped repeatedly to "perform". No engine effect.
- **PASS**: tap → phone moves to next holder (or returns to table if last).
- **Self-paced**: no countdown shown. Phase 8 is untimed; the round blocks on the current holder until they tap PASS or CALL — same pause-boundary semantics as the commit phase.

### Big-screen visualization

- After split animation settles, a **telephone card token** appears at table center.
- The token visibly **flies to the first eligible holder's character card** and settles next to them with a subtle bob.
- That holder's character card gets a soft highlight (border glow, reusing the existing "ready" affordance).
- On PASS or CALL, the token flies to the next holder; the previous one's highlight fades.
- After the last holder, the token returns to table center and lands **face-up**, showing its state:
  - **Not used** → token shows the "Telephone — not used" face; ~1s beat; round ends.
  - **Used** → token shows the "Telephone — used" face; **switchboard flip** chains immediately (see below).

### The Switchboard

- Persistent **big-screen widget** with three card slots, ambient on every round the variant is active. Placement: top-right, near the round/phase indicator. Empty slots show silhouettes; filled slots show the revealed switchboard card art.
- Each successful call (telephone landed "used") flips the next slot face-up. Slots 1 and 2 are "Busy"; slot 3 is "Reinforcements Sent".
- **The third flip is the variant's biggest dramatic moment**: ~3s full-screen overlay — siren palette wash, "REINFORCEMENTS ON THE WAY" copy, audio sting (audio parked, consistent with the rest of the project).
- After the overlay clears:
  - The big screen's shame-marker stock visually swaps to the **flashing-light side** (icon design changes for any new shame markers earned from this point).
  - The cop's phone gets a private one-shot informational beat: *"Reinforcements arriving — one more duck is all you can afford."* (Reminder of the rule, not a UI gate.)

### Phase-machine integration

- New phase: `telephone` in the round phase enum, between `split` and the next round's `commit`.
- Skipped (auto-advance) when: variant is off, `round.number > 6`, or no split participants.
- Engine state added to `Round`:
  ```ts
  telephone?: {
    used: boolean;
    holderOrder: string[];  // playerIds in pass order, for replay / debugging
  }
  ```
- Engine state added to `Game`:
  ```ts
  cop?: {
    callsMade: 0 | 1 | 2 | 3;
    reinforcementsRoundOnTheWay?: number;  // round in which the 3rd call landed
  }
  ```
- Shame markers earned in round R where `R > reinforcementsRoundOnTheWay` get tagged `{ flashing: true }` when added to `Player.shame`.

## Role UI

### Persistent role widget (during play)

- Lives in the phone's corner widget slot (the same slot the super-powers card uses; only one of the two systems is active per game in wave 1).
- Tap to re-read. Content:
  - **Cop**: role name + current switchboard count (e.g. "0/3", "1/3", … "3/3 ✓") + a per-round hint when relevant ("Call needs to land by round 6", "You can afford 1 more duck", etc.).
  - **Mafia**: role name only.
- Read-only; never blocks input.

## End-game reveal

The existing reckoning screen choreography is **prefixed with a role-reveal beat**:

1. **"The roles..."** — all role cards flip simultaneously on the big screen, one per player card. ~2s settle.
2. **Investigation summary** — short narrated beats, sequenced:
   - *"Reinforcements were called in round X."* OR *"Reinforcements never came."*
   - *"The cop survived."* OR *"The cop was killed in round Y."*
   - *"The cop took N flashing-light shame markers."* (only shown if reinforcements landed)
3. **Verdict**:
   - **Cop wins** → siren palette wash, *"JUSTICE SERVED"* full-screen, then roll into the existing leaderboard (cop crowned; mafia ranked by cash for narrative).
   - **Mafia wins** → *"The cop will not testify."*, then existing leaderboard runs normally (richest mafia wins; shame deducted at $5k).
4. The existing reckoning ledger choreography runs after the verdict — same cards, same animations, gated behind the role reveal.

## Flashing-light shame visualization

- `Player.shame` becomes `Player.shame: { flashing: boolean }[]` (migration of the existing scalar `shame: number`).
- Big-screen player cards render each marker with either the flat dot glyph or the flashing-light glyph.
- The visual distinction is **public** during play once reinforcements have landed — this is intentional reveal pressure on the cop.
- Pre-call shame markers stay flat for the whole game even after reinforcements (paper rule: only *new* shame after the call is flashing).

## Edge cases

- **Cop dies before calling**: call mission auto-fails. Phase 8 still runs in rounds 1-6 if eligible holders exist — mafia see decoy buttons; switchboard never advances. We deliberately don't broadcast cop-death as a phase-8 special case (gameplay-wise the round is the same; mafia learn they've already won at reckoning).
- **Sole-survivor before round 6**: existing early-end behavior; role reveal happens at reckoning regardless.
- **Insane × cop**: not applicable in wave 1 (toggles mutually exclusive). Handled in wave-2 spec.

## Dev / mock affordances

- New scenarios in `src/components/dev/scenarios.ts`:
  - `cop-calls-early` — cop calls round 1-3, sails to victory.
  - `cop-never-calls` — cop sits on the call, runs out of rounds.
  - `cop-killed-before-call` — mafia bullets the cop in round 2.
  - `cop-overducks` — cop calls but ducks twice after reinforcements.
  - `mafia-rich-cop-loses` — cop calls and survives but mafia wins because cop took 2 flashing-light shames.
- `ScenarioDock` gains a cop-variant toggle (sibling to the super-powers toggle); scenarios opt into the variant.
- The mock big-screen page renders the switchboard widget when the variant is on.

## Testing scope

- **Engine unit tests**:
  - Role dealing: exactly one cop, deterministic by seed.
  - Phase-8 transitions: skip when round > 6, variant off, or no split participants.
  - Switchboard counter advancement.
  - Reinforcement-arrival shame-tagging (markers earned in round R > reinforcement round get `flashing: true`).
  - Win-condition resolver: cop branch (all three predicates) + mafia branch + sole-survivor branch.
- **Resolver tests** for end-game outcomes across the major cases (cop alive + call + ≤1 flashing; cop dead; no call; sole survivor regardless of role).
- **No UI snapshot tests** (consistent with the rest of the codebase).
- **Regression**: full base-game test suite stays green with variant off.

## Wave-2 hooks (not implemented in wave 1)

- Lifting the lobby mutual-exclusion: allow cop + super-powers in the same game.
- Each power × cop interaction is reviewed; the only one needing real engine work is **Insane** (paper rule: grenade ends the round including phase 8). Others are mostly inert but the endgame reveal must surface both role and power per player.
- The role widget and the super-powers widget share a slot in wave 1; wave 2 will need to fit both, either by stacking or by a multi-card carousel — TBD in that spec.
