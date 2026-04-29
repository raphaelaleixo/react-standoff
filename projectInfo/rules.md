# Standoff — Rules Spec

A digital adaptation of *Cash'n Guns* (Ludovic Maublanc, Repos Production, 2005). Theme and visual identity are deliberately undecided — see "Open design decisions" — so the working title is **Standoff** and the rules below stay theme-neutral where possible.

## Theme & overview

A real-time party game of bluff and intimidation. Players are co-located around a big-screen device, each with a phone. Every round the table reveals a pile of cash and the players simultaneously aim at each other; on the count of three, anyone scared backs down, the brave ones reveal whether they actually had a bullet, the survivors split the loot. Eight rounds, then count the money. Richest player still alive wins.

The signature mechanic in the paper game is *physically pointing a foam gun at another player*. The digital version replaces the foam gun with a phone-as-gun: targets are picked by tapping on the phone, but players are **encouraged to physically point their phones** at each other for theatrics during the count-to-three.

## Player count

- **v1: 4–6 players.** Below 4 there's no real bluff space; above 6 the resolution gets unwieldy.
- **Data model must allow >6.** Don't hardcode the player count in types or UI layout — a future variant or expansion may push this higher.
- Seats are symmetric (no asymmetric named roles in v1; the cop variant is out of scope until later).

## Components (data shape)

These map to TypeScript types under `src/game/`:

- **Bullet card.** `'clic' | 'bang' | 'bang_bang_bang'`. Each player starts with 8: 5×clic, 2×bang, 1×bang!bang!bang!. Each card is played exactly once across the 8 rounds.
- **Banknote.** `{ value: 5000 | 10000 | 20000 }`. The shared loot deck has 40 notes: 15×$5k, 15×$10k, 10×$20k. Shuffled at game start.
- **Player.**
  - `id`, `displayName`, `colorOrAvatar`
  - `bullets: BulletCard[]` — remaining cards (8 → 0 over the game)
  - `cash: Banknote[]` — banknotes currently held
  - `wounds: 0 | 1 | 2 | 3` (3 = dead, money returned to box)
  - `shame: number` — count of shame markers; each costs $5k at end
  - `status: 'alive' | 'dead'`
  - `effects: Effect[]` — empty in v1; reserved for super powers / secret roles later
- **Round.**
  - `number: 1..8`
  - `phase: 'commit' | 'aim_reveal' | 'withdraw' | 'reveal_bbb' | 'reveal_others' | 'split' | 'recap'`
  - `loot: Banknote[]` — 5 freshly drawn each round plus any unsplit carryover
  - `commits: Record<playerId, { bullet?: BulletCard; target?: playerId; withdrew?: boolean }>` — each field hidden from other players until the corresponding reveal moment
- **Game.**
  - `players: Player[]`, `round: Round`, `bankDeck: Banknote[]`, `discardedBullets: BulletCard[]`, `seed: string` (for reproducible shuffles).

The state machine is **phased**, not free-form — the round resolver progresses through phases in fixed order, and each phase has clear entry/exit conditions. This lets later variants insert phases (e.g. the cop variant's "telephone" phase 8) without restructuring.

## Setup

1. Players join the room from `/room/:id/player`. Each picks a placeholder color/icon and a display name.
2. Host taps **Start** on the big screen once 4–6 players have joined.
3. The 40-banknote deck is shuffled (server-authoritative, seeded for replay).
4. Each player is dealt 8 bullet cards (face down on their phone — only they can see them).
5. All players begin alive, 0 wounds, 0 shame, $0.

## Round flow (the 7 phases)

Each round runs the same loop. Tempo rule: **untimed phases wait for all alive players to commit, then trigger the next timed countdown automatically.**

### Phase 1 — Reveal loot (auto, ~1.5s)
Big screen draws 5 banknotes from the deck and lays them face up alongside any unsplit carryover from the previous round. All standing-but-laid-down players from the previous round pop back upright.

### Phase 2 — Load & aim (untimed)
Each phone shows two pickers side by side: the player's remaining bullets, and a grid of alive opponents. The player picks **one bullet card and one target**, then locks both in with a single Ready tap. Both selections are **private** — others see only "X is choosing" → "X is ready" on the big screen.

When all alive players have committed, phase 3 starts automatically.

### Phase 3 — Standoff countdown (theatrical, 3-2-1)
Pure theatrics. Targets are *already locked* from phase 2 — this countdown does not accept input and has no commitment deadline.

- Big screen shows a visible **3 → 2 → 1** countdown.
- Each phone shows a gun-barrel/crosshair UI confirming the locked target ("Aiming at: [name]"). No tap actions are accepted.
- Players are encouraged to physically point their phones at their (already-committed) target for theatrics.
- At "0", the big screen reveals all targeting lines simultaneously with an animation.

### Phase 4 — Cojones / withdraw (3-2-1 countdown)
- Big screen shows another **3 → 2 → 1** countdown. Each phone now shows: who is aiming you (if anyone), and a big **DUCK** button (or equivalent — "withdraw / hide / cower"). Default if you do nothing = stay in.
- Decision is private until "0".
- At "0":
  - All players who tapped DUCK simultaneously lay their character down on the big screen, take a **shame marker**, discard their played bullet face-down, and are out for the round.
  - Players who were aiming a duckee discard their played bullet face-down (the unwritten gangster rule: don't shoot a player who gave up).
  - Everyone else stays in and proceeds to reveal.
- A player may duck even if not aimed at — sometimes you just want to keep your bullet for later.

### Phase 5 — Reveal bang!bang!bang! (auto, dramatic)
Big screen reveals all `bang_bang_bang` cards first, simultaneously, with a TV-moment animation. Targeted-and-still-standing players take a wound, lay down, discard their played bullet face-down (they were taken by surprise — they don't get to shoot back).

Note: two players who B!B!B!'d each other both get hit.

### Phase 6 — Reveal bang & clic (auto, dramatic)
Big screen reveals the remaining cards, simultaneously, paced after the B!B!B! moment. `bang` hits land — target takes a wound, lays down. `clic` does nothing (small comic beat / sigh of relief). Multiple bangs on the same target stack into multiple wounds. A player wounded in phase 5 can still take more wounds in phase 6.

### Phase 7 — Split the loot (auto)
Only players whose character is **still standing** (didn't duck, took 0 wounds this round) take the split. Big screen runs the deterministic split algorithm:

> Distribute the loot in equal parts among standing players. **No change is allowed** — only whole banknotes can move. If multiple distributions are possible, hand out the largest banknotes first. Banknotes that can't be distributed equally stay on the table for next round.

Banknotes fly across the screen to the winners' character cards; their cash totals tick up live. Wounded survivors get $0 this round but are still alive.

**Example:** 5 banknotes on the table — 1×$20k, 2×$10k, 2×$5k = $50k. With 3 standing players, each gets $10k (player A: $10k note, B: $10k note, C: 2×$5k notes). The $20k stays — it can't be split evenly. With 5 standing, no split is possible: everything stays on the table for next round.

A player wounded to 3 wounds is **eliminated**: status → dead, all their cash returned to the box (forfeited), they're out for the rest of the game.

### Phase R — Recap modal (untimed)
Between rounds, the big screen shows a recap modal:

- Round summary: who shot whom, who got paid, who died.
- Each phone privately shows that player's remaining bullets ("you have left: 4×clic, 1×bang, 1×B!B!B!"), wounds, cash, shame.
- Each alive player taps **Ready** on their phone to advance.
- This is the **disconnect-pause boundary** (see Edge cases).

When all alive players are Ready, the next round begins.

## End-game trigger

The game ends when **any** of the following is true:

- 8th round completes (most common).
- Only one player remains alive (early winner = that player).
- Zero players remain alive at end of a round (no winner).

## Scoring

For each alive player at end:

```
final_score = sum(banknotes held) - 5000 * shame_markers
```

**Tiebreakers, in order:**
1. Highest `final_score`.
2. Fewest shame markers.
3. Most wounds (the gritty survivor wins ties).

If still tied: shared win.

End-game ranked reveal: the big screen reveals positions one at a time from last to first, showing each player's score, shame deduction, and tiebreaker context. Final winner gets a victory animation.

## Big-screen view contract (`/room/:id`)

Always-visible elements (post-lobby):

- **Round/phase indicator.** "Round 3 of 8 — Phase: Standoff" + big countdown when timed.
- **Loot pile.** The face-up banknotes available this round.
- **Player cards** for every player, arranged around the screen. Each card shows:
  - Name + color/avatar
  - Standing or laid-down state (animated)
  - Wound count (visual: 1, 2, 3 plaster icons; 3 = dead/grayed-out)
  - Shame markers (visual)
  - Current cash total ("$45,000")
- **Targeting lines** (drawn at "0" of phase 3 standoff countdown, persist through phases 5 and 6) — animated arrows from shooter to target.
- **Round history log** is **out of scope for v1** (was discussed but not committed; can be added later).

Lobby state (pre-start): list of joined players, room code prominently displayed for late joiners, **Start** button enabled at 4+ players.

End-game state: ranked leaderboard with reveal-by-rank animation.

## Phone view contract (`/room/:id/player/:playerId`)

Phase-dependent. The phone is the *gun* — the UI metaphor leans into that during the load & aim and standoff phases.

- **Lobby:** name + color picker, "waiting for host to start".
- **Phase 2 (load & aim):** two pickers — remaining bullets (tap one) and alive opponents (tap one). Both must be selected, then a Ready tap locks them in. After commit, show "weapon loaded, target acquired — waiting for others". Selections may be changed freely until Ready is tapped.
- **Phase 3 (standoff countdown):** crosshair / gun-barrel aesthetic confirming the locked target ("Aiming at: [name]"). No input. Live countdown visible.
- **Phase 4 (withdraw):** big DUCK button + indicator of who is aiming you. Live countdown. Decision accepted until 0.
- **Phase 5/6 (reveal):** read-only view of the big screen action; haptic vibration on getting shot or hitting someone.
- **Phase 7 (split):** read-only; haptic on getting paid.
- **Phase R (recap):** private summary + remaining-bullets reminder + Ready button.
- **Eliminated state:** spectator view — read-only big-screen mirror, no controls.

Hidden info per phase:
- Phase 2 commits: bullet hidden from everyone until phase 5/6 reveal; target hidden from everyone until end of phase 3 countdown.
- Phase 4 commit (duck/stay): hidden from everyone until end of phase 4 countdown.

## Random elements (server-authoritative)

All randomness must live on the authoritative game state (Firebase via `react-gameroom`), not on individual clients:

- Loot deck shuffle at game start.
- Loot draws each round (5 from the top).

Use a seeded RNG so a game can be replayed for debugging. Store the seed on the room document.

There is **no** RNG during a round — bullet card outcomes are not random, they're whatever the player chose to play.

## Edge cases

- **Disconnect mid-round.** Don't pause mid-countdown — finish the current real-time phase. The natural pause boundaries are the untimed phases: phase 2 (load & aim) and phase R (recap). If a player is disconnected and hasn't committed at one of those, the phase blocks until they reconnect (since untimed phases wait for all alive players). Big screen shows "Waiting for [Player] to reconnect…". Players are co-located, so this is a real-world coordination problem — they'll know whose phone died. There is no "bullet lost / too slow" penalty in v1: untimed commits remove the time pressure that the rulebook used to enforce that rule.
- **Manual reset escape hatch.** Big screen exposes a host-only "Reset round" / "Reset game" control for unrecoverable disconnects. (Confirm dialog before firing — irreversible.)
- **Tied resolution within a phase.** Mutual B!B!B! → both wounded. Mutual bang → both wounded. This is correct per the rulebook.
- **Nobody splits.** If no one is standing at end of phase 6 (all ducked or wounded), all loot stays on the table for next round.
- **Loot can't be split.** Indivisible piles stay on the table; carryover is normal.
- **Player dies mid-round.** Their cash is forfeited to the box; they don't take part in the split this round (they're laid down). Big screen shows a "killed" animation; their card is grayed out for the rest of the game.
- **Last player standing before round 8.** Game ends immediately; that player wins; no further rounds.
- **Zero alive at end of round.** Game ends with no winner. Big screen shows a "everyone's dead" outro.
- **Late joiners.** Allowed only during the lobby. Once Start is pressed, the room is closed to new players.

## Naming / vocabulary

These are public-facing labels (UI strings, i18n keys); use them consistently in code:

- **Round** — not "turn"
- **Bullet** — for cards (clic / bang / B!B!B!)
- **Loot** — for the cash on the table
- **Cash** / **Take** — for cash held by a player
- **Wound** — for a hit
- **Shame** — for the marker taken when ducking
- **Duck** / **Withdraw** — verb for laying down (rulebook: "Cojones / Cowards" — too character-flavored, decide later)
- **Standoff** — working title; theme not finalized

## Open design decisions

- **Visual theme.** Not chosen. Placeholder names/colors only in v1. Candidates discussed: original Cash'n Guns gangster homage; Western standoff; sci-fi bounty hunters; corporate boardroom satire. Pick one once the mechanic *feels* good.
- **Sound.** Parked. The 3-2-1 voice, gunshot SFX, "Cojones!" comedic stinger are wanted but not needed in v1. Mute toggle on host side will be a requirement when sounds land.
- **Round history log** on big screen. Discussed, deferred. Easy to add later.
- **Super Powers expansion.** Out of scope for v1. The 10 super-power cards (6 Feet Under, Unbreakable, Dragon Skin, etc.) are a known future addition — the `effects: Effect[]` field on `Player` is the integration hook.
- **Cop in the Mafia variant.** Out of scope for v1. Adds secret roles, the under-table phone-pass mechanic, and a switchboard countdown. Will need its own design pass — the phone-pass has a "trust mechanic" digital adaptation problem analogous to the foam-gun one we already solved.
- **Player count above 6.** Allowed by the data model but not balanced. Bullet card distribution and per-round loot count are tuned for 4–6; expansion will need rebalancing.
- **"Game length feels too long."** 8 rounds × ~30 seconds is ~4 minutes minimum; with deliberation, more like 10–15. If playtest says it drags, a "quick mode" of 5 rounds × 5 cards is a known fallback.
