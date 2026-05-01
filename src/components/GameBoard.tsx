import { Box, Stack, Typography } from "@mui/material";
import type { Game, Player, RoundPhase } from "../game/types";
import { CaptainsChest } from "./loot/CaptainsChest";
import { MapFrame } from "./MapFrame";
import { FlagFor } from "./flags";
import { flagColor, palette } from "../theme/colors";

const RADIUS = 240;
const CANVAS = 700;
const NODE_WIDTH = 130;
const LINE_GAP = 10;
const LANE_THICKNESS = 3;

// Top-centered seat positions for an N-vertex regular polygon. The first seat
// sits at the top (-90°) and the rest follow clockwise so neighboring slot IDs
// are visually adjacent.
function seatPositions(n: number) {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (i * 360) / n) * (Math.PI / 180);
    out.push({ x: RADIUS * Math.cos(angle), y: RADIUS * Math.sin(angle) });
  }
  return out;
}

function pairGeometry(positions: { x: number; y: number }[]) {
  const out: { i: number; j: number; length: number; rotation: number }[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      out.push({
        i, j,
        length: Math.hypot(dx, dy),
        rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
      });
    }
  }
  return out;
}

// Targeting lines render only after the standoff "0" reveal moment, persist
// through the reveal phases, and clear when split begins.
const PHASES_WITH_LINES: RoundPhase[] = ["withdraw", "reveal_bbb", "reveal_others"];

export function GameBoard({ game }: { game: Game }) {
  const players = game.players;
  const positions = seatPositions(players.length);
  const pairs = pairGeometry(positions);
  const phase = game.round.phase;
  const showLines = PHASES_WITH_LINES.includes(phase);
  // Duck state stays hidden on the big screen during the withdraw countdown —
  // it's only revealed at the start of phase 4 (reveal_bbb), per the spec.
  const ducked = (id: string) =>
    !!game.round.commits[id]?.withdrew &&
    (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split");

  // Public commit status during phase 1 only (phase 4 ducks stay hidden until "0")
  const commitStatus = (id: string): "ready" | "choosing" | null => {
    if (phase !== "commit") return null;
    const c = game.round.commits[id];
    return c && c.bullet !== undefined && c.target !== undefined ? "ready" : "choosing";
  };

  const center = CANVAS / 2;

  return (
    <MapFrame size={CANVAS}>
      {pairs.map(({ i, j, length, rotation }) => {
        const pi = players[i];
        const pj = players[j];
        const ci = game.round.commits[pi.id];
        const cj = game.round.commits[pj.id];
        const forward = showLines && !!ci && !ci.withdrew && ci.target === pj.id;
        const backward = showLines && !!cj && !cj.withdrew && cj.target === pi.id;
        return (
          <PairLine
            key={`${i}-${j}`}
            originX={center + positions[i].x}
            originY={center + positions[i].y}
            length={length}
            rotation={rotation}
            forward={forward}
            backward={backward}
          />
        );
      })}

      {players.map((p, i) => (
        <PlayerNode
          key={p.id}
          player={p}
          x={center + positions[i].x}
          y={center + positions[i].y}
          ducked={ducked(p.id)}
          commitStatus={commitStatus(p.id)}
        />
      ))}

      <CaptainsChest loot={game.round.loot} centerX={center} centerY={center} />
    </MapFrame>
  );
}

function PairLine({ originX, originY, length, rotation, forward, backward }: {
  originX: number;
  originY: number;
  length: number;
  rotation: number;
  forward: boolean;
  backward: boolean;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        left: originX,
        top: originY,
        width: length,
        height: LINE_GAP,
        transformOrigin: "0 50%",
        transform: `translateY(-${LINE_GAP / 2}px) rotate(${rotation}deg)`,
        borderTop: `${LANE_THICKNESS}px solid ${forward ? palette.signal : "transparent"}`,
        borderBottom: `${LANE_THICKNESS}px solid ${backward ? palette.signal : "transparent"}`,
        boxSizing: "content-box",
        pointerEvents: "none",
        transition: "border-color 0.3s ease",
        // Forward arrow head, near the receiving end (right side of the lane).
        "&::before": forward ? {
          content: '""',
          position: "absolute",
          right: "12%",
          top: -LANE_THICKNESS - 4,
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: `10px solid ${palette.signal}`,
        } : undefined,
        // Backward arrow head, opposite end.
        "&::after": backward ? {
          content: '""',
          position: "absolute",
          left: "12%",
          bottom: -LANE_THICKNESS - 4,
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderRight: `10px solid ${palette.signal}`,
        } : undefined,
      }}
    />
  );
}

function PlayerNode({ player, x, y, ducked, commitStatus }: {
  player: Player;
  x: number;
  y: number;
  ducked: boolean;
  commitStatus: "ready" | "choosing" | null;
}) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const dead = player.status === "dead";
  const accent = flagColor(player.colorOrAvatar);
  const transform =
    `translate(-50%, -50%)` +
    (ducked ? " rotate(8deg) scale(0.9)" : "");
  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_WIDTH,
        bgcolor: palette.parchment,
        border: `3px solid ${dead ? palette.inkSoft : accent}`,
        borderRadius: 2,
        py: 1,
        px: 1,
        opacity: dead ? 0.45 : 1,
        transform,
        filter: ducked ? "grayscale(0.7)" : "none",
        transition: "transform 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        boxShadow: `0 2px 4px rgba(90, 55, 29, 0.3)`,
        zIndex: 10,
        color: accent,
      }}
    >
      {commitStatus && !dead && <CommitBadge status={commitStatus} />}
      <Box sx={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FlagFor id={player.colorOrAvatar} size={48} />
      </Box>
      <Typography
        variant="body2"
        noWrap
        sx={{ width: "100%", textAlign: "center", fontWeight: 600, color: palette.ink }}
      >
        {player.displayName}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: i < player.wounds ? palette.signal : "transparent",
              border: `1px solid ${palette.ink}`,
            }}
          />
        ))}
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: palette.ink }}>
          ${cash.toLocaleString()}
        </Typography>
        {player.shame > 0 && (
          <Box sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 0.5,
            bgcolor: palette.yellow,
            border: `1px solid ${palette.ink}`,
            borderRadius: 0.5,
            fontSize: 10,
            color: palette.ink,
            fontWeight: 700,
          }}>
            ⚐ ×{player.shame}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function CommitBadge({ status }: { status: "ready" | "choosing" }) {
  const isReady = status === "ready";
  return (
    <Box
      sx={{
        position: "absolute",
        top: -12,
        right: -12,
        zIndex: 11,
        px: 1,
        py: 0.25,
        bgcolor: isReady ? palette.goldDeep : palette.inkSoft,
        color: palette.parchment,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        boxShadow: `0 1px 3px rgba(90,55,29,0.5)`,
        animation: isReady ? "none" : "pulse 1.4s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      }}
    >
      {isReady ? "Ready ✓" : "Choosing…"}
    </Box>
  );
}
