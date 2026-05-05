import { useId } from "react";
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import type { Game, RoundPhase } from "../../game/types";
import { Roundel } from "./Roundel";
import { seatPositions, pairGeometry } from "./geometry";

const CANVAS = 480;
const RADIUS = 180;
const LANE_GAP = 14;
const ROUNDEL_RADIUS = 32; // Roundel default size is 64
const ARROW_TARGET_PADDING = 6; // Pixels of breathing room between arrow tip and target circle edge
const PHASES_WITH_LINES: RoundPhase[] = ["withdraw", "reveal_withdraw", "reveal_bbb", "reveal_others"];

interface TargetingMapProps {
  game: Game;
  /** Dim the whole map (used during the standoff countdown overlay). */
  dim?: boolean;
}

interface OffsetLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Calculate offset parallel line perpendicular to the original
function offsetLine(x1: number, y1: number, x2: number, y2: number, offset: number): OffsetLine {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const perpX = -dy / length;
  const perpY = dx / length;
  return {
    x1: x1 + perpX * offset,
    y1: y1 + perpY * offset,
    x2: x2 + perpX * offset,
    y2: y2 + perpY * offset,
  };
}

// Calculate a point at a ratio along a line
function pointAtRatio(line: OffsetLine, ratio: number) {
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  return {
    x: line.x1 + dx * ratio,
    y: line.y1 + dy * ratio,
  };
}

export function TargetingMap({ game, dim }: TargetingMapProps) {
  const uid = useId();
  const arrowId = `ah-${uid}`;
  const arrowBeigeId = `ah-beige-${uid}`;
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
          <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={palette.blood} />
          </marker>
          <marker id={arrowBeigeId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={palette.paperDim} />
          </marker>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {showLines && (() => {
          // In the withdraw phase yields are still mutable — show provisional aim
          // in beige + dashed (no glow). After lock-in (reveal_*) shots are committed
          // in blood with the menacing glow.
          const provisional = game.round.phase === "withdraw";
          const lineStroke = provisional ? palette.paperDim : palette.blood;
          const lineDash = provisional ? "6 4" : undefined;
          const markerRef = `url(#${provisional ? arrowBeigeId : arrowId})`;
          return (
          <g filter={provisional ? undefined : `url(#${glowId})`}>
            {pairs.map(({ i, j }) => {
              const pi = players[i];
              const pj = players[j];
              const ci = game.round.commits[pi.id];
              const cj = game.round.commits[pj.id];
              // During withdraw and reveal_withdraw, show all committed lines (including yielded).
              // During reveal_bbb / reveal_others, hide withdrawn players' lines (their shot was voided).
              const isWithdrawPhase = game.round.phase === "withdraw" || game.round.phase === "reveal_withdraw";
              const forward = !!ci && ci.target === pj.id && (isWithdrawPhase || !ci.withdrew);
              const backward = !!cj && cj.target === pi.id && (isWithdrawPhase || !cj.withdrew);
              const x1 = center + positions[i].x;
              const y1 = center + positions[i].y;
              const x2 = center + positions[j].x;
              const y2 = center + positions[j].y;

              // Dual lanes: one offset up, one offset down
              const forwardLane = offsetLine(x1, y1, x2, y2, LANE_GAP / 2);
              const backwardLane = offsetLine(x1, y1, x2, y2, -LANE_GAP / 2);

              // Arrow tips stop a fixed pixel distance from the target circle so
              // every arrow looks equally close to its target, regardless of how
              // far apart the two players sit on the hex.
              const lineLen = Math.hypot(x2 - x1, y2 - y1);
              const stopDist = ROUNDEL_RADIUS + ARROW_TARGET_PADDING;
              const forwardRatio = (lineLen - stopDist) / lineLen;
              const backwardRatio = stopDist / lineLen;
              const forwardArrowEnd = pointAtRatio(forwardLane, forwardRatio);
              const backwardArrowEnd = pointAtRatio(backwardLane, backwardRatio);

              return (
                <g key={`${i}-${j}`}>
                  {forward && (
                    <>
                      <line
                        x1={forwardLane.x1} y1={forwardLane.y1}
                        x2={forwardArrowEnd.x} y2={forwardArrowEnd.y}
                        stroke={lineStroke} strokeWidth={1.8}
                        strokeDasharray={lineDash}
                        markerEnd={markerRef}
                        style={{ transition: "stroke 0.2s ease" }}
                      />
                      <line
                        x1={forwardArrowEnd.x} y1={forwardArrowEnd.y}
                        x2={forwardLane.x2} y2={forwardLane.y2}
                        stroke={lineStroke} strokeWidth={1.8}
                        strokeDasharray={lineDash}
                        style={{ transition: "stroke 0.2s ease" }}
                      />
                    </>
                  )}
                  {backward && (
                    <>
                      <line
                        x1={backwardLane.x2} y1={backwardLane.y2}
                        x2={backwardArrowEnd.x} y2={backwardArrowEnd.y}
                        stroke={lineStroke} strokeWidth={1.8}
                        strokeDasharray={lineDash}
                        markerEnd={markerRef}
                        style={{ transition: "stroke 0.2s ease" }}
                      />
                      <line
                        x1={backwardArrowEnd.x} y1={backwardArrowEnd.y}
                        x2={backwardLane.x1} y2={backwardLane.y1}
                        stroke={lineStroke} strokeWidth={1.8}
                        strokeDasharray={lineDash}
                        style={{ transition: "stroke 0.2s ease" }}
                      />
                    </>
                  )}
                </g>
              );
            })}
          </g>
          );
        })()}
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
            flagId="jolly_roger"
            colorId={p.colorOrAvatar}
            ducked={ducked(p.id)}
            dim={p.status === "dead"}
          />
        </Box>
      ))}
    </Box>
  );
}
