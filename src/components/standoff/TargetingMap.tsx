import { useId } from "react";
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import type { Game, RoundPhase } from "../../game/types";
import { Roundel } from "./Roundel";
import { seatPositions, pairGeometry } from "./geometry";

const CANVAS = 480;
const RADIUS = 180;
const PHASES_WITH_LINES: RoundPhase[] = ["withdraw", "reveal_bbb", "reveal_others"];

interface TargetingMapProps {
  game: Game;
  /** Dim the whole map (used during the standoff countdown overlay). */
  dim?: boolean;
}

export function TargetingMap({ game, dim }: TargetingMapProps) {
  const uid = useId();
  const arrowId = `ah-${uid}`;
  const glowId = `glow-${uid}`;
  const players = game.players;
  const positions = seatPositions(players.length, RADIUS);
  const pairs = pairGeometry(positions);
  const showLines = PHASES_WITH_LINES.includes(game.round.phase);
  const ducked = (id: string) =>
    !!game.round.commits[id]?.withdrew &&
    (game.round.phase === "reveal_bbb" || game.round.phase === "reveal_others" || game.round.phase === "split");
  const center = CANVAS / 2;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: CANVAS,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        opacity: dim ? 0.55 : 1,
        filter: dim ? "saturate(0.6)" : undefined,
        transition: "opacity 0.3s ease, filter 0.3s ease",
      }}
    >
      <svg
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={palette.blood} />
          </marker>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {showLines && (
          <g filter={`url(#${glowId})`}>
            {pairs.map(({ i, j }) => {
              const pi = players[i];
              const pj = players[j];
              const ci = game.round.commits[pi.id];
              const cj = game.round.commits[pj.id];
              const forward = !!ci && !ci.withdrew && ci.target === pj.id;
              const backward = !!cj && !cj.withdrew && cj.target === pi.id;
              const x1 = center + positions[i].x;
              const y1 = center + positions[i].y;
              const x2 = center + positions[j].x;
              const y2 = center + positions[j].y;
              return (
                <g key={`${i}-${j}`}>
                  {forward && (
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={palette.blood} strokeWidth={2.4}
                      markerEnd={`url(#${arrowId})`}
                    />
                  )}
                  {backward && (
                    <line
                      x1={x2} y1={y2} x2={x1} y2={y1}
                      stroke={palette.blood} strokeWidth={2.4}
                      markerEnd={`url(#${arrowId})`}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {players.map((p, i) => (
        <Box
          key={p.id}
          sx={{
            position: "absolute",
            left: center + positions[i].x,
            top: center + positions[i].y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Roundel
            flagId={p.colorOrAvatar}
            name={p.displayName.toUpperCase()}
            ducked={ducked(p.id)}
            dim={p.status === "dead"}
          />
        </Box>
      ))}
    </Box>
  );
}
