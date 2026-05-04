// DEV-only mock for the big-screen view. Renders the new GameBoard with
// fixture data so you can iterate on layout without a live room.
import { Box } from "@mui/material";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Foot } from "../components/shell/Foot";
import { GameBoard } from "../components/GameBoard";
import { navyHoursLabel } from "../lib/navyHours";
import type { Game, Player } from "../game/types";
import { useMockGameState } from "../components/dev/useMockGameState";
import { useDevPanelToggle } from "../components/dev/useDevPanelToggle";
import { DevControlsPanel } from "../components/dev/DevControlsPanel";

const PLAYERS: Player[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",  bullets: ["bang","clic","clic","clic","clic","bang","bang_bang_bang"], cash: [{ id: "bn-a1", value: 10000 }, { id: "bn-a2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard",   bullets: [], cash: [{ id: "bn-b1", value: 20000 }, { id: "bn-b2", value: 5000 }], wounds: 1, shame: 0, status: "alive", effects: [] },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low",   bullets: [], cash: [{ id: "bn-c1", value: 5000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet", bullets: [], cash: [{ id: "bn-d1", value: 20000 }, { id: "bn-d2", value: 5000 }], wounds: 2, shame: 1, status: "alive", effects: [] },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart",   bullets: [], cash: [{ id: "bn-e1", value: 10000 }], wounds: 0, shame: 0, status: "alive", effects: [] },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery",  bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
];

const FIXTURE_GAME: Game = {
  seed: "mock",
  players: PLAYERS,
  round: {
    number: 3,
    phase: "withdraw",
    phaseStartedAt: 0,
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
      c: { bullet: "bang", target: "e" },
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
  const { game, actions } = useMockGameState(FIXTURE_GAME);
  const { open, setOpen } = useDevPanelToggle(true);

  const aliveCount = game.players.filter(p => p.status === "alive").length;
  const deadCount = game.players.filter(p => p.status === "dead").length;
  const yieldedCount = Object.values(game.round.commits).filter(c => c.withdrew).length;

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>ROUND <em>{game.round.number} of VIII</em></>}
          right={<>PHASE <em>{game.round.phase}</em></>}
        />
        <GameBoard game={game} />
        <Foot
          left={`${aliveCount} ALIVE · ${yieldedCount} YIELDED · ${deadCount} DEAD`}
          cry={navyHoursLabel(game.round.number)}
          right="NEXT · WHO SHALL FALL?"
        />
      </PageCanvas>
      <DevControlsPanel
        open={open}
        game={game}
        actions={actions}
        onClose={() => setOpen(false)}
      />
    </Box>
  );
}
