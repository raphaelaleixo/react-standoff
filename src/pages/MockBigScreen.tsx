// DEV-only mock for the big-screen view. Loads a scenario (an opening
// position with players, powers, and pre-filled commits) into an in-memory
// game store, then runs the REAL state machine in useGameState against it
// — phases tick naturally, the resolver runs, the explosion overlay plays
// when it should. Use the scenario picker to choose which situation to
// rehearse, Reset to restart from the beginning, and the muster/reckoning
// toggle to switch surfaces.
import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FullscreenButton } from "../components/shell/FullscreenButton";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { RolesDealtOverlay } from "../components/screens/RolesDealtOverlay";
import { PowerRevealOverlay } from "../components/powers/PowerRevealOverlay";
import { toRoman } from "../lib/navyHours";
import { useGameState } from "../hooks/useGameState";
import { useBigScreenZoom } from "../hooks/useBigScreenZoom";
import { createLocalGameStore, type LocalGameStore } from "../components/dev/localGameStore";
import { SCENARIOS } from "../components/dev/scenarios";
import { ScenarioDock, type DockSurface } from "../components/dev/ScenarioDock";
import { PUBLIC_POWER_KINDS } from "../game/powerKinds";
import type { PowerActivation } from "../game/types";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import {
  MOCK_ROOM_STATE,
  RECKONING_GAME,
  RECKONING_ELIMINATED_BY_ROUND,
} from "../components/dev/mockFixtures";

const SURFACES: DockSurface[] = ["game", "muster", "reckoning"];

export default function MockBigScreen() {
  const { t } = useTranslation();
  useBigScreenZoom();
  // One in-memory store for the whole page lifetime. Scenarios load via
  // store.reset(); useGameState's effects then drive the state machine.
  const [store] = useState<LocalGameStore>(() => createLocalGameStore(null));
  const serverNow = useCallback(() => Date.now(), []);
  const { game, rolesDealtSeen } = useGameState(store, serverNow);

  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [surface, setSurface] = useState<DockSurface>("game");

  const loadScenario = useCallback(
    (id: string) => {
      const def = SCENARIOS.find(s => s.id === id);
      if (!def) return;
      store.reset(def.build());
    },
    [store],
  );

  const handlePlay = () => loadScenario(scenarioId);
  const handleReset = () => store.reset(null);

  const activeScenario = SCENARIOS.find(s => s.id === scenarioId);
  // Mirror RoomPage: filter insane out of the resolution-based overlay
  // (the audience already saw the card from the synthetic reveal when the
  // holder armed it — the detonation is told via the BOOM stamp + wound
  // pips, not a replay).
  const overlayActivations =
    (game?.round.resolution?.powerActivations ?? []).filter(
      a => a.kind !== "insane",
    );

  // Fire scenario phase-entry hooks once per phase transition. This is how
  // scenarios inject the activations production reads from a phone (tough,
  // insane) — without it, big-screen-only mode can never reach the resolves
  // those phases gate on.
  const lastPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!game) {
      lastPhaseRef.current = null;
      return;
    }
    const phase = game.round.phase;
    if (lastPhaseRef.current === phase) return;
    lastPhaseRef.current = phase;
    activeScenario?.onPhaseEnter?.[phase]?.(store);
  }, [game, activeScenario, store]);

  // Synthetic round-start reveals for revealed-on-deal powers (Dead Eye /
  // Bloodhound). Captured once at round 1 commit entry and held stable so
  // the overlay plays through even after the state machine has moved on
  // to standoff. Cleared on store reset.
  const [initialReveals, setInitialReveals] = useState<PowerActivation[]>([]);
  useEffect(() => {
    if (!game) {
      setInitialReveals([]);
      return;
    }
    if (initialReveals.length > 0) return;
    if (game.round.number !== 1 || game.round.phase !== "commit") return;
    const out: PowerActivation[] = [];
    for (const p of game.players) {
      for (const e of p.effects) {
        if (PUBLIC_POWER_KINDS.has(e.kind) && e.revealed) {
          out.push({ playerId: p.id, kind: e.kind });
        }
      }
    }
    if (out.length > 0) setInitialReveals(out);
  }, [game, initialReveals.length]);

  // Local toggle for the "roles dealt" overlay (cop variant). Page-local
  // lifecycle: flips true once when useGameState reports the round 1
  // commit-entry signal, and back false when the overlay's onDone fires.
  const [rolesDealtVisible, setRolesDealtVisible] = useState(false);
  useEffect(() => {
    if (rolesDealtSeen) setRolesDealtVisible(true);
  }, [rolesDealtSeen]);

  return (
    <>
      {surface === "muster" ? (
        <MusterScreen
          roomState={MOCK_ROOM_STATE}
          joinUrl="https://standoff.ludoratory.com/join/MOCK"
          canStart
          onStart={() => {}}
        />
      ) : surface === "reckoning" ? (
        <ReckoningScreen
          game={RECKONING_GAME}
          roomId="MOCK"
          eliminatedByRound={RECKONING_ELIMINATED_BY_ROUND}
          onPlayAgain={() => {}}
          onReturn={() => {}}
        />
      ) : game ? (
        <Box sx={{ width: "100vw", height: "100vh" }}>
          <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
            <Masthead
              left={<>{t("shell.room")} <em>MOCK</em></>}
              right={<FullscreenButton />}
            />
            <GameBoard game={game} />
            <Foot
              cry={
                <>
                  {t("shell.round")} {t("shell.ofTotal", { n: toRoman(game.round.number) })}
                </>
              }
            />
            <PowerRevealOverlay
              activations={overlayActivations}
              players={game.players}
            />
            {/* Round-start reveal for publicly-dealt powers (Dead Eye /
                Bloodhound). Plays once at scenario load so the audience
                sees the card animate in before settling into a crew-rail
                badge. */}
            <PowerRevealOverlay
              activations={initialReveals}
              players={game.players}
            />
            {/* Synthetic insane reveal overlay — same trick RoomPage uses. */}
            {game.round.activations.insane &&
              !game.round.resolution?.roundTerminated && (
                <PowerRevealOverlay
                  activations={[
                    {
                      playerId: game.round.activations.insane.playerId,
                      kind: "insane" as const,
                    },
                  ]}
                  players={game.players}
                />
              )}
            <RolesDealtOverlay
              visible={rolesDealtVisible}
              onDone={() => setRolesDealtVisible(false)}
              acknowledgedCount={game.players.length}
              totalCount={game.players.length}
            />
          </PageCanvas>
        </Box>
      ) : (
        <ScenarioIdle scenario={activeScenario} />
      )}
      <ScenarioDock
        surface={surface}
        onSurfaceChange={setSurface}
        surfaces={SURFACES}
        scenarioId={scenarioId}
        onScenarioChange={setScenarioId}
        onPlay={handlePlay}
        onReset={handleReset}
        playing={game !== null}
        blurb={activeScenario?.blurb ?? ""}
      />
    </>
  );
}

function ScenarioIdle({ scenario }: { scenario: { label: string; blurb: string } | undefined }) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        color: palette.paper,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.7rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          marginBottom: "0.6rem",
        }}
      >
        SCENARIO
      </Box>
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "2.2rem",
          lineHeight: 1.1,
          marginBottom: "0.9rem",
        }}
      >
        {scenario?.label ?? "Pick a scenario"}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          maxWidth: "32rem",
          color: palette.paperDim,
        }}
      >
        {scenario?.blurb ?? "Press ▶ Play in the dev dock below."}
      </Box>
    </Box>
  );
}

