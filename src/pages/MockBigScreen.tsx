// DEV-only mock for the big-screen view. Renders the new GameBoard with
// fixture data so you can iterate on layout without a live room. The screen
// toggle in DevControlsPanel also routes to MusterScreen / ReckoningScreen
// fixtures so the lobby + end-game can be eyeballed without standing up a
// live game.
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { RoomState } from "react-gameroom";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { navyHoursLabel, toRoman } from "../lib/navyHours";
import { countAlive, countDead, countYielded } from "../lib/playerCounts";
import type { Game, Player, RoundResolution } from "../game/types";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel, type DevScreen } from "../components/dev/DevControlsPanel";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS } from "../lib/phaseDurations";

const PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",  bullets: ["bang","clic","clic","clic","clic","bang","bang_bang_bang"], cash: [{ id: "bn-a1", value: 10000 }, { id: "bn-a2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",   bullets: [], cash: [{ id: "bn-b1", value: 20000 }, { id: "bn-b2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",   bullets: [], cash: [{ id: "bn-c1", value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ id: "bn-d1", value: 20000 }, { id: "bn-d2", value: 5000 }], wounds: 2, shame: 1, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart",   bullets: [], cash: [{ id: "bn-e1", value: 10000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery",  bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
];

// Static stand-ins for what the real round resolver would write into
// game.round.resolution. Used by MockBigScreen to demo the reveal banners
// without running the actual resolution pipeline. The shooter / target /
// outcome fields here mirror the fixture commits above so the targeting
// arrows and crew pills stay coherent across phases.
const RESOLUTION_BROADSIDE: RoundResolution = {
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

const RESOLUTION_KILL: RoundResolution = {
  ...RESOLUTION_BROADSIDE,
  // d had 2 wounds going in; c's bang tips them over and they walk the plank.
  eliminated: ["d"],
};

// Muster fixture: 4 of 6 seats taken (mix of ready / joining), 2 empty. Mirrors
// the in-game PLAYERS so the colours stay consistent when you toggle between
// game / muster mid-session.
const MOCK_ROOM_STATE: RoomState<Player> = {
  roomId: "MOCK",
  status: "lobby",
  players: [
    { id: 1, name: "Maud",    status: "ready",   data: PLAYERS[0] },
    { id: 2, name: "Mary",    status: "ready",   data: PLAYERS[1] },
    { id: 3, name: "Match",   status: "joining", data: PLAYERS[2] },
    { id: 4, name: "One-Eye", status: "joining", data: PLAYERS[3] },
    { id: 5, status: "empty" },
    { id: 6, status: "empty" },
  ],
  config: { minPlayers: 4, maxPlayers: 6, requireFull: false },
};

// Reckoning fixture: round VIII, an obvious winner with a clean ledger, a
// shame-stained runner-up, a third-place stack, a near-tie pair, and one
// dead body so every variant of EndGameRow has a representative.
const RECKONING_PLAYERS: Player[] = [
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

const RECKONING_GAME: Game = {
  seed: "mock-reckoning",
  players: RECKONING_PLAYERS,
  round: { number: 8, phase: "split", phaseStartedAt: 0, loot: [], commits: {} },
  bankDeck: [],
  discardedBullets: [],
  phase: "ended",
} as Game;

// Wet Match walked the plank in round VI — surfaces the "walked the plank,
// rd. 6" suffix on the dead row.
const RECKONING_ELIMINATED_BY_ROUND: Record<string, number> = { c: 6 };

const FIXTURE_GAME: Game = {
  seed: "mock",
  players: PLAYERS,
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

export default function MockBigScreen() {
  const { t } = useTranslation();
  const { game, actions } = useMockGameState(FIXTURE_GAME);
  const { open, setOpen } = useDevPanelToggle(true);
  const [screen, setScreen] = useState<DevScreen>("game");

  // Overlay a phase-appropriate resolution onto the mock game so the reveal
  // banners have data to render. The dev hook only tracks phase + commits;
  // the real resolver isn't wired in here, so we hand-pick a resolution per
  // phase. Other phases see no resolution and the banner stays hidden.
  //
  // For "split" we additionally redistribute loot to standing players' cash
  // (so the cash tickers go up) and reduce game.round.loot to the carryover
  // banknotes (so the awarded notes fade out of the hoard).
  const displayGame = useMemo<Game>(() => {
    if (game.round.phase === "split") {
      const awardedToC = game.round.loot.filter(n => n.id === "loot-1" || n.id === "loot-3");
      const awardedToE = game.round.loot.filter(n => n.id === "loot-4");
      const carryover = game.round.loot.filter(
        n => n.id !== "loot-1" && n.id !== "loot-3" && n.id !== "loot-4",
      );
      const players = game.players.map(p => {
        if (p.id === "c") return { ...p, cash: [...p.cash, ...awardedToC] };
        if (p.id === "e") return { ...p, cash: [...p.cash, ...awardedToE] };
        return p;
      });
      return {
        ...game,
        players,
        round: { ...game.round, loot: carryover, resolution: RESOLUTION_KILL },
      };
    }
    const resolution =
      game.round.phase === "reveal_bbb" ? RESOLUTION_BROADSIDE :
      game.round.phase === "reveal_others" ? RESOLUTION_KILL :
      undefined;
    return { ...game, round: { ...game.round, resolution } };
  }, [game]);

  // Mock-only auto-advance: in production the server transitions the round
  // out of standoff. Here, watch the StandoffStamp's count and advance to
  // withdraw the moment it reads 0 so the dev mock matches the on-screen
  // animation instead of a separate Play-round timer.
  const standoffCount = useStandoffCount({
    active: game.round.phase === "standoff",
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });
  useEffect(() => {
    if (game.round.phase === "standoff" && standoffCount === 0) {
      actions.setPhase("standoff_hold");
      return;
    }
    if (game.round.phase === "standoff_hold") {
      // Hold beat where the targeting lines draw in. Match the production
      // duration so the mock previews real pacing.
      const t = setTimeout(() => actions.setPhase("withdraw"), STANDOFF_HOLD_MS);
      return () => clearTimeout(t);
    }
  }, [game.round.phase, standoffCount, actions]);

  let surface: React.ReactNode;
  if (screen === "muster") {
    surface = (
      <MusterScreen
        roomState={MOCK_ROOM_STATE}
        joinUrl="https://standoff.party/join/MOCK"
        canStart
        onStart={() => {}}
      />
    );
  } else if (screen === "reckoning") {
    surface = (
      <ReckoningScreen
        game={RECKONING_GAME}
        eliminatedByRound={RECKONING_ELIMINATED_BY_ROUND}
        onPlayAgain={() => {}}
        onReturn={() => {}}
      />
    );
  } else {
    surface = (
      <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
        <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
          <Masthead
            left={<>{t("shell.round")} <em>{t("shell.ofTotal", { n: toRoman(displayGame.round.number) })}</em></>}
            right={<>{t("shell.room")} <em>MOCK</em></>}
          />
          <GameBoard game={displayGame} />
          <Foot
            left={`${countAlive(displayGame)} ${t("shell.alive")} · ${countYielded(displayGame)} ${t("shell.yielded")} · ${countDead(displayGame)} ${t("shell.dead")}`}
            cry={navyHoursLabel(displayGame.round.number, t)}
            right={t("shell.next")}
          />
        </PageCanvas>
      </Box>
    );
  }

  return (
    <>
      {surface}
      <DevControlsPanel
        open={open}
        game={game}
        actions={actions}
        onClose={() => setOpen(false)}
        screen={screen}
        onScreenChange={setScreen}
      />
    </>
  );
}
