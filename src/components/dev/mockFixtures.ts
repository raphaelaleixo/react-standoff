// Shared dev-only fixtures for the mock pages (MockBigScreen + MockPlayerPage).
// Same six players run through both surfaces, so colours / cash / wounds /
// shame stay consistent if you flip between them mid-session.

import type { RoomState } from "react-gameroom";
import type { BulletCard, Game, Player, RoundResolution } from "../../game/types";

// Big-screen fixture players. Each player has a small cash stack and a few
// wounds/shame so the in-game ledger has interesting numbers to render. Only
// player "a" carries a full hand here; the big-screen view doesn't need to
// know other players' bullets, so they sit empty for the ledger fixture.
export const MOCK_PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",  bullets: ["bang","clic","clic","clic","clic","bang","bang_bang_bang"], cash: [{ id: "bn-a1", value: 10000 }, { id: "bn-a2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",   bullets: [], cash: [{ id: "bn-b1", value: 20000 }, { id: "bn-b2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",   bullets: [], cash: [{ id: "bn-c1", value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ id: "bn-d1", value: 20000 }, { id: "bn-d2", value: 5000 }], wounds: 2, shame: 1, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart",   bullets: [], cash: [{ id: "bn-e1", value: 10000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery",  bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
];

// Phone-mock players' face-up bullets — what they still hold this round.
// Combined with MOCK_PHONE_PRESPENT (spent earlier in the game), every seat
// renders exactly 8 hand slots, with a mix of face-up and face-with-X cards
// so the spent-card visual treatment is visible regardless of which seat
// you switch to.
const PHONE_HAND_FACE_UP: BulletCard[] = ["clic", "clic", "bang", "bang", "bang_bang_bang"];
export const MOCK_PHONE_PLAYERS: Player[] = MOCK_PLAYERS.map(p => ({
  ...p,
  bullets: PHONE_HAND_FACE_UP,
}));

// Bullets pre-marked as spent for each seat. Counts vary so flipping seats
// shows different spent loadouts; each total (face-up + prespent) is 8 to
// match the full starting hand size.
export const MOCK_PHONE_PRESPENT: Record<string, BulletCard[]> = {
  a: ["clic", "bang", "bang_bang_bang"],
  b: ["clic", "bang", "bang_bang_bang"],
  c: ["clic", "bang", "bang_bang_bang"],
  d: ["clic", "bang", "bang_bang_bang"],
  e: ["clic", "bang", "bang_bang_bang"],
  f: ["clic", "bang", "bang_bang_bang"],
};

export const RESOLUTION_BROADSIDE: RoundResolution = {
  shots: [
    { shooter: "b", target: "a", card: "bang_bang_bang", outcome: "hit" },
    { shooter: "a", target: "c", card: "bang", outcome: "hit" },
    { shooter: "c", target: "d", card: "bang", outcome: "hit" },
    { shooter: "d", target: "b", card: "bang", outcome: "hit" },
    { shooter: "e", target: "f", card: "clic", outcome: "no_effect_clic" },
  ],
  ducks: [],
  standing: ["c", "e"],
  woundedThisRound: { a: 1, b: 1, d: 1 },
  eliminated: [],
  awards: {},
  carryover: [],
};

export const RESOLUTION_KILL: RoundResolution = {
  ...RESOLUTION_BROADSIDE,
  // d had 2 wounds going in; c's bang tips them over and they walk the plank.
  eliminated: ["d"],
  // c (20k + 10k) and e (5k) get the take; the 10k + 5k carry over.
  // Loot ids match FIXTURE_GAME below.
  awards: {
    c: [
      { id: "loot-1", value: 20000 },
      { id: "loot-3", value: 10000 },
    ],
    e: [{ id: "loot-4", value: 5000 }],
  },
  carryover: [
    { id: "loot-2", value: 10000 },
    { id: "loot-5", value: 5000 },
  ],
};

// Muster fixture: 4 of 6 seats taken (mix of ready / joining), 2 empty.
export const MOCK_ROOM_STATE: RoomState<Player> = {
  roomId: "MOCK",
  status: "lobby",
  players: [
    { id: 1, name: "Maud",    status: "ready",   data: MOCK_PLAYERS[0] },
    { id: 2, name: "Mary",    status: "ready",   data: MOCK_PLAYERS[1] },
    { id: 3, name: "Match",   status: "joining", data: MOCK_PLAYERS[2] },
    { id: 4, name: "One-Eye", status: "joining", data: MOCK_PLAYERS[3] },
    { id: 5, status: "empty" },
    { id: 6, status: "empty" },
  ],
  config: { minPlayers: 4, maxPlayers: 6, requireFull: false },
};

// Reckoning fixture: round VIII, an obvious winner with a clean ledger, a
// shame-stained runner-up, a third-place stack, a near-tie pair, and one
// dead body so every variant of EndGameRow has a representative.
export const RECKONING_PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
    bullets: [], cash: [{ id: "ra1", value: 20000 }, { id: "ra2", value: 20000 }, { id: "ra3", value: 20000 }, { id: "ra4", value: 20000 }, { id: "ra5", value: 5000 }],
    wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary", colorOrAvatar: "blackbeard",
    bullets: [], cash: [{ id: "rb1", value: 20000 }, { id: "rb2", value: 20000 }, { id: "rb3", value: 10000 }],
    wounds: 1, shame: 1, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye", colorOrAvatar: "stede_bonnet",
    bullets: [], cash: [{ id: "rd1", value: 20000 }, { id: "rd2", value: 10000 }, { id: "rd3", value: 5000 }],
    wounds: 2, shame: 0, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt", colorOrAvatar: "black_bart",
    bullets: [], cash: [{ id: "re1", value: 20000 }, { id: "re2", value: 5000 }],
    wounds: 0, shame: 2, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam", colorOrAvatar: "henry_avery",
    bullets: [], cash: [{ id: "rf1", value: 10000 }],
    wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match", colorOrAvatar: "edward_low",
    bullets: [], cash: [], wounds: 3, shame: 0, status: "dead", effects: [] },
];

export const RECKONING_GAME: Game = {
  seed: "mock-reckoning",
  players: RECKONING_PLAYERS,
  round: { number: 8, phase: "split", phaseStartedAt: 0, loot: [], commits: {} },
  bankDeck: [],
  discardedBullets: [],
  phase: "ended",
} as Game;

export const RECKONING_ELIMINATED_BY_ROUND: Record<string, number> = { c: 6 };

// In-game ledger fixture (drives MockBigScreen).
export const FIXTURE_GAME: Game = {
  seed: "mock",
  players: MOCK_PLAYERS,
  round: {
    number: 3,
    phase: "withdraw",
    phaseStartedAt: Date.now(),
    loot: [
      { id: "loot-1", value: 20000 },
      { id: "loot-2", value: 10000 },
      { id: "loot-3", value: 10000 },
      { id: "loot-4", value: 5000 },
      { id: "loot-5", value: 5000 },
    ],
    commits: {
      a: { bullet: "bang", target: "c" },
      b: { bullet: "bang_bang_bang", target: "a" },
      c: { bullet: "bang", target: "d" },
      d: { bullet: "bang", target: "b" },
      e: { bullet: "clic", target: "f" },
      f: { withdrew: true, bullet: "clic", target: "a" },
    },
  },
  bankDeck: [],
  discardedBullets: [],
  phase: "in_progress",
};

// Phone-mock fixture: same shape as FIXTURE_GAME but seats every player with
// a four-card face-up hand so the Hand grid is interactive from any seat.
// Round starts on `commit` so the picker is the default surface; the dev can
// flip to other phases via DevControlsPanel.
//
// Commits match FIXTURE_GAME so flipping to withdraw / standoff exercises a
// realistic threat readout. Per-seat attacker counts are:
//   a — II MARKS ON YE (b, f)
//   b — MARK ON YE (d)
//   c — MARK ON YE (a)
//   d — MARK ON YE (c)
//   e — AT EASE
//   f — MARK ON YE (e)
// MockPlayerPage masks the active seat's commit during the commit phase, so
// the picker remains interactive regardless of these defaults.
export const FIXTURE_GAME_PHONE: Game = {
  seed: "mock-phone",
  players: MOCK_PHONE_PLAYERS,
  round: {
    number: 3,
    phase: "commit",
    phaseStartedAt: Date.now(),
    loot: [
      { id: "loot-1", value: 20000 },
      { id: "loot-2", value: 10000 },
      { id: "loot-3", value: 10000 },
      { id: "loot-4", value: 5000 },
      { id: "loot-5", value: 5000 },
    ],
    commits: {
      a: { bullet: "bang", target: "c" },
      b: { bullet: "bang_bang_bang", target: "a" },
      c: { bullet: "bang", target: "d" },
      d: { bullet: "bang", target: "b" },
      e: { bullet: "clic", target: "f" },
      f: { withdrew: true, bullet: "clic", target: "a" },
    },
  },
  bankDeck: [],
  discardedBullets: [],
  phase: "in_progress",
};
