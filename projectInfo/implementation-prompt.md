# Standoff — Implementation Kickoff

You're starting implementation of **Standoff**, a digital adaptation of *Cash'n Guns*. **Read `projectInfo/rules.md` first** — it has the full design spec including data shapes, phase-by-phase flow, and view contracts.

The parent `Projects/CLAUDE.md` (auto-loaded) defines the stack and architecture. Re-read its `react-gameroom` rule explicitly: **if the library doesn't cleanly support what you need, propose a library change rather than working around it on the consumer side.** Standoff has unusual real-time-sync needs (simultaneous private commits revealed at countdown-zero, multi-phase per-round state machine) — expect gaps and stop to discuss them.

## Non-obvious decisions (don't re-litigate)

- **Phone-as-gun is metaphorical, not sensor-based.** Targets are tapped, not pointed. Don't reach for IMU/compass.
- **Tempo is hybrid.** Phase 2 (load & aim) is untimed — bullet *and* target are committed together; phase advances when all alive players are ready. Phase 3 is a purely theatrical 3-2-1 countdown that accepts no input — only job is tension before the aim reveal at 0. Phase 4 (withdraw) has a real 3-2-1 countdown capturing duck/stay until 0. Reveals are auto-paced animations. The untimed phases (load & aim, recap modal) are the disconnect-pause boundaries. **No "bullet lost / too slow" rule** in v1 — the untimed commit removes the time pressure that justified it.
- **Reveal cadence is paper-faithful.** Aim targets and withdraw decisions stay hidden until their reveal moments — *no live feedback*. Bullet reveals are dramatic-sequenced: B!B!B! first, then bangs and clics.
- **Server-authoritative randomness only.** Shuffles and draws live on the room document via `react-gameroom`, seeded for replay. No client-side `Math.random` for game state.
- **State machine is phased.** Each round walks fixed phases in order. Don't collapse them — cop-variant and super-power expansions will insert phases later.
- **Data model leaves room for v2.** Each `Player` has `effects: Effect[]` (empty in v1) as the integration hook for super powers and secret roles.
- **Theme/visuals are undecided.** Placeholder names and colors only. No gangster/Western/sci-fi commitment yet.
- **No sounds in v1.** Design with a future mute toggle in mind, but don't add audio now.

## Suggested starting order

1. **Domain types** (`src/game/types.ts`): `BulletCard`, `Banknote`, `Player`, `Round`, `RoundPhase`, `Game`. Match `rules.md` § Components.
2. **Pure resolver** (`src/game/`): given a round's committed state, return the resolved round (wounds, split, eliminations). Unit-test with vitest before any UI — the no-change split algorithm is where the rulebook complexity lives.
3. **Big-screen lobby** in `RoomPage` using `react-gameroom`'s room/join primitives. Lobby-to-started transition only; no game logic.
4. **State machine** in the room document: phase progression, countdown timers, server-authoritative commits.
5. **Big-screen game view.** Player cards, loot pile, targeting lines, split animation. Drive from a `MockBigScreen` (parent CLAUDE.md requires DEV-only mock pages).
6. **Phone view (`PlayerPage`).** Phase-dependent UI: card picker → gun aesthetic → duck button → recap. Use a `MockPhone` dev page.

**Stop and confirm the domain types with me before writing any UI.**
