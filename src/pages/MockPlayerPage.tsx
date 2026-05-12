// DEV-only mock for the player phone view. Renders PhoneShell + PhaseView
// against fixture state so you can iterate on phone layout without a live
// room. The DevControlsPanel drives the same mock game state used by
// MockBigScreen — phase, round, individual commits, wounds, etc. — so you
// can flip between phases (commit / standoff / withdraw / reveal) and see
// the player surface respond.
//
// A floating Seat selector at the top swaps which player is "me", so you
// can verify the same UI from any seat (including dead).

import { useEffect, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { BulletCard, Game, PowerKind } from "../game/types";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";
import { InsaneRevealButton } from "../components/screens/InsaneRevealButton";
import { SpecialistPromptScreen } from "../components/screens/SpecialistPromptScreen";
import { ToughPromptScreen } from "../components/screens/ToughPromptScreen";
import { eligibleForInsane, eligibleForSpecialist, eligibleForTough } from "../game/powers";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel, type DevScreen } from "../components/dev/DevControlsPanel";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS } from "../lib/phaseDurations";
import {
  FIXTURE_GAME_PHONE,
  MOCK_PHONE_PRESPENT,
  RECKONING_GAME,
} from "../components/dev/mockFixtures";

export default function MockPlayerPage() {
  const { game, actions } = useMockGameState(FIXTURE_GAME_PHONE);
  const { open, setOpen } = useDevPanelToggle(true);
  // Default to player "a" (Cap'n Maud) so you land on a populated hand. The
  // selector at the top of the page lets you switch seats live.
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("a");
  // Dev-screen toggle — mirrors MockBigScreen. "reckoning" swaps the live
  // mock game for the RECKONING fixture so the phone end-game view can be
  // previewed without driving an actual game to phase "ended". "muster" has
  // no player-side surface and just falls through to the in-game ledger.
  const [screen, setScreen] = useState<DevScreen>("game");
  const isReckoning = screen === "reckoning";
  // Super Powers variant toggle + per-seat power injector. Flipping the
  // variant lights up variant-conditional UI in PhaseView; the power
  // injector lets the dev preview the start-reveal / power widget paths
  // without having to actually deal the game.
  const [variantOn, setVariantOn] = useState(false);
  const [myPower, setMyPower] = useState<PowerKind | null>(null);
  // Local armed state for Pocket Inferno — the production page reads this
  // from `round.activations.insane`, but the mock state machine has no
  // resolver/submitInsane to drive that slot, so we track it client-side
  // and synthesize the activation into renderGame for downstream reads.
  const [grenadeArmed, setGrenadeArmed] = useState(false);
  // Reset armed when the active power changes (clearing or swapping powers).
  useEffect(() => { setGrenadeArmed(false); }, [myPower, selectedPlayerId]);
  const baseRenderGame: Game = isReckoning ? RECKONING_GAME : game;
  // Apply variant + power injection to whatever game we're rendering. We
  // only ever push the power into the active seat — other seats stay clean.
  const renderGame: Game = {
    ...baseRenderGame,
    variants: { superPowers: variantOn },
    players: baseRenderGame.players.map(p =>
      p.id === selectedPlayerId
        ? { ...p, effects: myPower ? [{ kind: myPower, revealed: false, used: false }] : p.effects }
        : p,
    ),
    round: {
      ...baseRenderGame.round,
      activations: grenadeArmed && myPower === "insane"
        ? { ...baseRenderGame.round.activations, insane: { playerId: selectedPlayerId } }
        : baseRenderGame.round.activations,
    },
  };

  // Mock-only auto-advance through standoff → standoff_hold → withdraw, same
  // as MockBigScreen so the phone surface previews the production pacing.
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
      const t = setTimeout(() => actions.setPhase("withdraw"), STANDOFF_HOLD_MS);
      return () => clearTimeout(t);
    }
  }, [game.round.phase, standoffCount, actions]);

  // Source of seats follows whichever game we're rendering — switching to
  // reckoning shows the RECKONING_PLAYERS roster in the seat selector.
  const me =
    renderGame.players.find(p => p.id === selectedPlayerId) ?? renderGame.players[0];

  // Wire the mock state's setCommit into the submitCommit / submitDuck signature
  // PhaseView expects, so the commit picker actually persists picks into the
  // mock game and the DevControlsPanel reflects them.
  const submitCommit = async (id: string, bullet: BulletCard, target: string) => {
    actions.setCommit(id, { bullet, target });
  };
  const submitDuck = async (id: string, withdrew: boolean) => {
    actions.setCommit(id, { withdrew });
  };

  // For commit phase the dev wants to interact with the picker, so we mask
  // out the active player's existing commit (if any) before passing the
  // game through. Other phases need the commits intact for the right UI
  // (standoff aim target, withdraw aimed-at-list, etc.). In reckoning the
  // fixture is frozen so we hand it through untouched.
  const phoneGame: Game = isReckoning
    ? renderGame
    : renderGame.round.phase === "commit" && renderGame.round.commits[selectedPlayerId]
    ? {
        ...renderGame,
        round: {
          ...renderGame.round,
          commits: { ...renderGame.round.commits, [selectedPlayerId]: {} },
        },
      }
    : renderGame;

  // Specialist / Tough prompts take over the phone canvas the same way
  // PlayerPage does in production — they replace the surface, but the dev
  // panel + seat selector stay mounted so the dev can step out.
  const showSpecialistPrompt =
    !isReckoning &&
    renderGame.variants.superPowers &&
    renderGame.round.phase === "specialist_prompt" &&
    eligibleForSpecialist(renderGame, me.id);
  const showToughPrompt =
    !isReckoning &&
    renderGame.variants.superPowers &&
    renderGame.round.phase === "tough_prompt" &&
    eligibleForTough(renderGame, me.id);
  const promptExpiresAtMs = renderGame.round.phaseStartedAt + 10000;
  const playedBullet = renderGame.round.commits[me.id]?.bullet;

  let surface: React.ReactNode;
  if (showSpecialistPrompt && playedBullet) {
    surface = (
      <SpecialistPromptScreen
        me={me}
        playedBullet={playedBullet}
        onUse={() => { /* mock: no-op, dev advances phase manually */ }}
        onSkip={() => { /* mock: no-op */ }}
        expiresAtMs={promptExpiresAtMs}
      />
    );
  } else if (showToughPrompt) {
    surface = (
      <ToughPromptScreen
        onUse={() => { /* mock: no-op, dev advances phase manually */ }}
        onSkip={() => { /* mock: no-op */ }}
        expiresAtMs={promptExpiresAtMs}
      />
    );
  } else {
    surface = (
      <PhoneShell
        me={me}
        roomId="MOCK"
        aboveFooter={
          myPower === "insane" && !isReckoning &&
          (eligibleForInsane(renderGame, me.id) || grenadeArmed) ? (
            <InsaneRevealButton
              armed={grenadeArmed}
              onReveal={() => setGrenadeArmed(true)}
            />
          ) : undefined
        }
      >
        <PhaseView
          game={phoneGame}
          me={me}
          submitCommit={submitCommit}
          submitDuck={submitDuck}
          handPrespent={isReckoning ? [] : MOCK_PHONE_PRESPENT[me.id] ?? []}
        />
      </PhoneShell>
    );
  }

  return (
    <>
      <SeatSelector
        players={renderGame.players.map(p => ({ id: p.id, displayName: p.displayName }))}
        selectedId={me.id}
        onSelect={setSelectedPlayerId}
      />
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
        myPower={myPower}
        onMyPowerChange={setMyPower}
      />
    </>
  );
}

// Floating seat selector — pinned to the top-left so it doesn't fight the
// phone canvas. Each chip is a player's id; the active one inverts.
function SeatSelector({
  players,
  selectedId,
  onSelect,
}: {
  players: Array<{ id: string; displayName: string }>;
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 100,
        background: palette.ink,
        border: `1.5px solid ${palette.paper}`,
        padding: "0.35rem 0.5rem",
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.6rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          marginBottom: "0.25rem",
          textAlign: "center",
        }}
      >
        SEAT
      </Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={selectedId}
        onChange={(_, value: string | null) => {
          if (value) onSelect(value);
        }}
        sx={{
          // Tighter MUI overrides — these toggle buttons are dev chrome,
          // not part of the broadside design language.
          "& .MuiToggleButton-root": {
            color: palette.paper,
            borderColor: palette.rule,
            padding: "0.15rem 0.5rem",
            fontFamily: fonts.body,
            textTransform: "none",
            "&.Mui-selected": {
              background: palette.paper,
              color: palette.ink,
              "&:hover": { background: palette.paper },
            },
          },
        }}
      >
        {players.map(p => (
          <ToggleButton key={p.id} value={p.id}>
            {p.displayName.split(" ")[0]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
