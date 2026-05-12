// DEV-only mock for the big-screen view. Renders the new GameBoard with
// fixture data so you can iterate on layout without a live room. The screen
// toggle in DevControlsPanel also routes to MusterScreen / ReckoningScreen
// fixtures so the lobby + end-game can be eyeballed without standing up a
// live game.
import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FullscreenButton } from "../components/shell/FullscreenButton";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { MusterScreen } from "../components/screens/MusterScreen";
import { ReckoningScreen } from "../components/screens/ReckoningScreen";
import { PowerRevealOverlay } from "../components/powers/PowerRevealOverlay";
import { POWER_KINDS } from "../game/powerKinds";
import { toRoman } from "../lib/navyHours";
import type { Game, PowerKind } from "../game/types";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel, type DevScreen } from "../components/dev/DevControlsPanel";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { useBigScreenZoom } from "../hooks/useBigScreenZoom";
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
  useBigScreenZoom();
  const { game, actions } = useMockGameState(FIXTURE_GAME);
  const { open, setOpen } = useDevPanelToggle(true);
  const [screen, setScreen] = useState<DevScreen>("game");
  // Super Powers variant dev controls. `variantOn` flips the Game.variants
  // flag so any variant-conditional UI lights up; `forcedActivations` lets us
  // inject synthetic power reveals into the round's resolution so the big-
  // screen overlay can be visually reviewed without a live game.
  const [variantOn, setVariantOn] = useState(false);
  const [forcedActivations, setForcedActivations] = useState<PowerKind[]>([]);
  const [revealAllBadges, setRevealAllBadges] = useState(false);
  // Toggle that synthesizes a grenade-terminated resolution so the dev can
  // eyeball the explosion overlay + roundTerminated state without a live game.
  const [grenadeOverride, setGrenadeOverride] = useState(false);

  // Overlay a phase-appropriate resolution onto the mock game so the reveal
  // banners have data to render. The dev hook only tracks phase + commits;
  // the real resolver isn't wired in here, so we hand-pick a resolution per
  // phase. Other phases see no resolution and the banner stays hidden.
  // GameBoard reads `resolution.awards` / `.carryover` to drive the split-
  // phase choreography (notes leave table, then cash ticks up).
  const displayGame = useMemo<Game>(() => {
    const firstPlayerId = game.players[0]?.id ?? "a";
    const injected = forcedActivations.map(k => ({ playerId: firstPlayerId, kind: k }));
    let resolution =
      game.round.phase === "reveal_bbb" ? RESOLUTION_BROADSIDE :
      game.round.phase === "reveal_others" || game.round.phase === "split" ? RESOLUTION_KILL :
      undefined;
    if (resolution && injected.length > 0) {
      resolution = { ...resolution, powerActivations: [...resolution.powerActivations, ...injected] };
    } else if (!resolution && injected.length > 0) {
      // No real resolution this phase, but the dev injected activations —
      // synthesize a minimal resolution shell so the overlay still fires.
      resolution = {
        shots: [], ducks: [], standing: [], woundedThisRound: {},
        eliminated: [], awards: {}, carryover: [], powerActivations: injected,
      };
    }
    if (grenadeOverride) {
      const firstAlive = game.players.find(p => p.status === "alive");
      const holderId = firstAlive?.id ?? firstPlayerId;
      resolution = {
        shots: [], ducks: [], standing: [], woundedThisRound: {},
        eliminated: [], awards: {}, carryover: [],
        powerActivations: [{ playerId: holderId, kind: "insane" }],
        roundTerminated: { reason: "grenade", playerId: holderId },
      };
    }
    // When the dev wants every badge visible, hand each player a different
    // PowerKind (cycling) and mark it revealed so CrewRow renders the
    // PowerBadge in the rail.
    const players = revealAllBadges
      ? game.players.map((p, i) => ({
          ...p,
          effects: [{
            kind: POWER_KINDS[i % POWER_KINDS.length],
            revealed: true,
            used: false,
          }],
        }))
      : game.players;

    return {
      ...game,
      players,
      variants: { superPowers: variantOn },
      round: { ...game.round, resolution },
    };
  }, [game, variantOn, forcedActivations, revealAllBadges, grenadeOverride]);

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
    // Apply the same variant + power-injection overrides to the reckoning
    // fixture so the dev can preview Davy Jones's Cut bonus, Super Coward
    // sign-flip, and the flip-up-on-reveal cards in the leaderboard.
    const reckoningGame: Game = {
      ...RECKONING_GAME,
      variants: { superPowers: variantOn },
      players: revealAllBadges
        ? RECKONING_GAME.players.map((p, i) => ({
            ...p,
            effects: [{
              kind: POWER_KINDS[i % POWER_KINDS.length],
              revealed: true,
              used: false,
            }],
          }))
        : RECKONING_GAME.players,
    };
    surface = (
      <ReckoningScreen
        game={reckoningGame}
        roomId="MOCK"
        eliminatedByRound={RECKONING_ELIMINATED_BY_ROUND}
        onPlayAgain={() => {}}
        onReturn={() => {}}
      />
    );
  } else {
    const overlayActivations = displayGame.round.resolution?.powerActivations ?? [];
    surface = (
      <Box sx={{ width: "100vw", height: "100vh" }}>
        <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
          <Masthead
            left={<>{t("shell.room")} <em>MOCK</em></>}
            right={<FullscreenButton />}
          />
          <GameBoard game={displayGame} />
          <Foot
            cry={<>{t("shell.round")} {t("shell.ofTotal", { n: toRoman(displayGame.round.number) })}</>}
          />
          <PowerRevealOverlay
            activations={overlayActivations}
            players={displayGame.players}
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
        variantSuperPowers={variantOn}
        onVariantSuperPowersChange={setVariantOn}
        forcedActivations={forcedActivations}
        onForcedActivationsChange={setForcedActivations}
        revealAllBadges={revealAllBadges}
        onRevealAllBadgesChange={setRevealAllBadges}
        onForceGrenadeExplosion={() => setGrenadeOverride(prev => !prev)}
      />
    </>
  );
}
