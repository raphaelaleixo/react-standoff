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
import type { BulletCard, Game } from "../game/types";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel } from "../components/dev/DevControlsPanel";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS } from "../lib/phaseDurations";
import { FIXTURE_GAME_PHONE, MOCK_PHONE_PRESPENT } from "../components/dev/mockFixtures";

export default function MockPlayerPage() {
  const { game, actions } = useMockGameState(FIXTURE_GAME_PHONE);
  const { open, setOpen } = useDevPanelToggle(true);
  // Default to player "a" (Cap'n Maud) so you land on a populated hand. The
  // selector at the top of the page lets you switch seats live.
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("a");

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

  const me = game.players.find(p => p.id === selectedPlayerId) ?? game.players[0];

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
  // (standoff aim target, withdraw aimed-at-list, etc.).
  const phoneGame: Game =
    game.round.phase === "commit" && game.round.commits[selectedPlayerId]
      ? {
          ...game,
          round: {
            ...game.round,
            commits: { ...game.round.commits, [selectedPlayerId]: {} },
          },
        }
      : game;

  return (
    <>
      <SeatSelector
        players={game.players.map(p => ({ id: p.id, displayName: p.displayName }))}
        selectedId={selectedPlayerId}
        onSelect={setSelectedPlayerId}
      />
      <PhoneShell me={me} roomId="MOCK">

        <PhaseView
          game={phoneGame}
          me={me}
          submitCommit={submitCommit}
          submitDuck={submitDuck}
          handPrespent={MOCK_PHONE_PRESPENT[me.id] ?? []}
        />
      </PhoneShell>
      <DevControlsPanel
        open={open}
        game={game}
        actions={actions}
        onClose={() => setOpen(false)}
        screen="game"
        onScreenChange={() => {}}
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
