// DEV-only mock for the big-screen view. Renders the new GameBoard with
// fixture data so you can iterate on layout without a live room. The screen
// toggle in DevControlsPanel also routes to MusterScreen / ReckoningScreen
// fixtures so the lobby + end-game can be eyeballed without standing up a
// live game.
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { navyHoursLabel, toRoman } from "../lib/navyHours";
import { countAlive, countDead, countYielded } from "../lib/playerCounts";
import type { Game } from "../game/types";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel, type DevScreen } from "../components/dev/DevControlsPanel";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS } from "../lib/phaseDurations";
import {
  FIXTURE_GAME,
  MOCK_ROOM_STATE,
  RECKONING_GAME,
  RECKONING_ELIMINATED_BY_ROUND,
  RESOLUTION_BROADSIDE,
  RESOLUTION_KILL,
} from "../components/dev/mockFixtures";

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
        roomId="MOCK"
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
