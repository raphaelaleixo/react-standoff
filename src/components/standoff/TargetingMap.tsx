import { useId, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import type { Game, RoundPhase } from "../../game/types";
import { Roundel } from "./Roundel";
import { seatPositions, pairGeometry } from "./geometry";
import { durations } from "../../theme/animations";
import { jollyRogerForColor } from "../flags";

const CANVAS = 480;
const RADIUS = 180;
const LANE_GAP = 14;
const ROUNDEL_RADIUS = 32; // Roundel default size is 64
const ARROW_TARGET_PADDING = 6; // Pixels of breathing room between arrow tip and target circle edge
// `split` is included so the lines stay rendered through the round-end
// fade-out — the wrapper <g> below transitions opacity to 0 during split,
// and the per-line visibility logic (bbb-victim filter) keeps its
// reveal_others state so nothing flickers visible just before it fades.
// Lines first appear during the silent `standoff_hold` beat — they draw in
// while the standoff stamp has already faded and before the yield countdown
// starts — then stay through withdraw and the reveal sequence.
const PHASES_WITH_LINES: RoundPhase[] = ["standoff_hold", "withdraw", "reveal_withdraw", "reveal_bbb", "reveal_others", "split"];

interface TargetingMapProps {
  game: Game;
  /** Dim the whole map (used during the standoff countdown overlay). */
  dim?: boolean;
  /** Optional overlay rendered as a sibling of the SVG / roundels. Sized to the map's square bounds. */
  overlay?: React.ReactNode;
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

export function TargetingMap({ game, dim, overlay }: TargetingMapProps) {
  const uid = useId();
  const arrowId = `ah-${uid}`;
  const arrowBeigeId = `ah-beige-${uid}`;
  const glowId = `glow-${uid}`;
  const players = game.players;
  const positions = seatPositions(players.length, RADIUS);
  const pairs = pairGeometry(positions);
  const showLines = PHASES_WITH_LINES.includes(game.round.phase);

  // Draw-in animation state: lines transition from invisible (offset = full
  // segment length) to fully drawn (offset = 0) over `durations.draw` the
  // first time the round enters PHASES_WITH_LINES. Subsequent phase changes
  // within the same round keep the lines stable.
  // Track the showLines transition so the draw-in animation plays each time
  // the lines mount (showLines false → true), not once per round. Phase
  // transitions inside PHASES_WITH_LINES (withdraw → reveal_withdraw →
  // reveal_bbb → reveal_others) keep the lines stable.
  const wasShowingLinesRef = useRef(false);
  const [drawState, setDrawState] = useState<"pre" | "active" | "done">("done");
  // useLayoutEffect — not useEffect — so the "pre" state lands before the
  // browser ever paints the new round. Otherwise the arrows flash visible
  // for one frame between phase change and the draw-in starting.
  useLayoutEffect(() => {
    if (!showLines) {
      wasShowingLinesRef.current = false;
      return;
    }
    if (wasShowingLinesRef.current) return;
    wasShowingLinesRef.current = true;
    setDrawState("pre");
    const raf = requestAnimationFrame(() => setDrawState("active"));
    const t = setTimeout(() => setDrawState("done"), durations.draw);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [showLines]);
  const ducked = (id: string) =>
    !!game.round.commits[id]?.withdrew &&
    (game.round.phase === "reveal_withdraw" || game.round.phase === "reveal_bbb" || game.round.phase === "reveal_others" || game.round.phase === "split");

  // BBB victims: anyone targeted by a non-yielded BBB shooter where the target
  // themselves didn't yield (ducking voids the incoming BBB per the gangster
  // rule). They take a wound in reveal_bbb and are out of the round — their
  // bullet is discarded face-down.
  const bbbVictims = new Set<string>();
  for (const p of players) {
    const c = game.round.commits[p.id];
    if (c?.bullet === "bang_bang_bang" && !c.withdrew && c.target) {
      const tc = game.round.commits[c.target];
      if (!tc?.withdrew) bbbVictims.add(c.target);
    }
  }
  // Bang victims: from reveal_others on, any non-yielded non-BBB-victim bang
  // shooter lands a wound on a non-yielded non-BBB-victim target.
  const bangVictims = new Set<string>();
  if (game.round.phase === "reveal_others" || game.round.phase === "split") {
    for (const p of players) {
      const c = game.round.commits[p.id];
      if (c?.bullet === "bang" && !c.withdrew && c.target) {
        if (bbbVictims.has(p.id)) continue; // shooter's bullet was discarded by surprise
        const tc = game.round.commits[c.target];
        if (tc?.withdrew) continue;        // gangster rule
        if (bbbVictims.has(c.target)) continue; // target already laid down
        bangVictims.add(c.target);
      }
    }
  }
  // Wounded-this-round = anyone who's taken a hit by the current phase. They
  // stay laid down (struck visual) through the rest of the round.
  const wounded = new Set<string>([...bbbVictims, ...bangVictims]);
  const struck = (id: string) =>
    wounded.has(id) &&
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
          <filter
            id={glowId}
            filterUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={CANVAS}
            height={CANVAS}
          >
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {showLines && (() => {
          const phase = game.round.phase;
          // standoff_hold and withdraw show every committed line (yields are
          // still private — the YieldRibbon only appears during withdraw, and
          // even toggled mid-countdown the choice can't be revealed yet).
          // Once yields are public (reveal_withdraw and on), any line touching
          // a ducked player is voided — both the duckee's shot and any shot
          // aimed at them, per the gangster rule.
          //
          // From reveal_bbb on, BBB victims are also out of the round: their
          // own bullet was discarded by the surprise hit, and any non-BBB shot
          // aimed at them is wasted on a wounded target. BBB shots themselves
          // still fire (mutual BBB lands on both shooters).
          const lineVisible = (
            shooter: typeof game.round.commits[string],
            target: typeof game.round.commits[string],
            shooterId: string,
            targetId: string,
          ) => {
            if (phase === "standoff_hold" || phase === "withdraw") return true;
            if (shooter?.withdrew || target?.withdrew) return false;
            if (phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
              const isBbbLine = shooter?.bullet === "bang_bang_bang";
              if (!isBbbLine && (bbbVictims.has(shooterId) || bbbVictims.has(targetId))) {
                return false;
              }
            }
            return true;
          };
          // A line "fires" — gets ink-filled with blood-red + glow — when its
          // bullet lands a wound. BBB lines fire from reveal_bbb on (and stay
          // red through reveal_others). Bang lines join in reveal_others. Clic
          // shots are revealed too but don't hit anything, so they stay in the
          // provisional beige style (a "click" sigh-of-relief, not an ink fill).
          const lineFired = (bullet?: string) => {
            if (phase === "reveal_bbb") return bullet === "bang_bang_bang";
            if (phase === "reveal_others") return bullet === "bang" || bullet === "bang_bang_bang";
            return false;
          };
          const FIRE_FILL_DURATION = 0.35; // seconds to fill the line source→target
          // Draw-in via SVG mask: each direction renders an invisible
          // "reveal stroke" inside a <mask> whose stroke-dashoffset animates
          // from lineLen → 0. The visible dashed line stays "6 4" the whole
          // time and is only painted where the mask is white, so the dashes
          // appear progressively from source to target without ever flashing
          // as a solid line.
          const maskRevealStyle: React.CSSProperties = {
            transition: drawState === "active"
              ? `stroke-dashoffset ${durations.draw}ms ease-out`
              : undefined,
          };
          // Arrow polygons stay hidden until the beige lines finish drawing,
          // then fade in. Once visible they carry on with their existing
          // fire-fill colour shift (handled inline below).
          const arrowDrawStyle: React.CSSProperties = {
            opacity: drawState === "done" ? 1 : 0,
            transition: `opacity ${durations.fast}ms ease-out`,
          };
          return (
          <g
            // Round-end fade: when phase becomes "split" the whole line set
            // fades together over durations.base. The per-line filtering
            // above keeps each line in its reveal_others state during the
            // fade so nothing flickers visible just before it disappears.
            style={{
              opacity: phase === "split" ? 0 : 1,
              transition: `opacity ${durations.base}ms ease`,
            }}
          >
            {pairs.map(({ i, j }) => {
              const pi = players[i];
              const pj = players[j];
              const ci = game.round.commits[pi.id];
              const cj = game.round.commits[pj.id];
              // "Committed" = the line exists in the round state (a shooter
              // locked this target). "Visible" = it should be on screen right
              // now. We render committed lines unconditionally and toggle
              // visibility via opacity so phase transitions can fade voided
              // lines out instead of snapping them.
              const forwardCommitted = !!ci && ci.target === pj.id;
              const backwardCommitted = !!cj && cj.target === pi.id;
              const forwardVisible = forwardCommitted && lineVisible(ci, cj, pi.id, pj.id);
              const backwardVisible = backwardCommitted && lineVisible(cj, ci, pj.id, pi.id);
              const forwardFired = lineFired(ci?.bullet);
              const backwardFired = lineFired(cj?.bullet);
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

              // For the fire-fill animation we ink-on a red overlay on top of
              // the beige track. Split into two sub-segments so the long
              // source→arrow piece animates first, then the short arrow→target
              // continuation. Per-piece durations keep the fill speed uniform
              // across pairs of different physical lengths.
              const segLong = lineLen - stopDist;   // source → arrow tip
              const segShort = stopDist;            // arrow tip → target center
              const durLong = (segLong / lineLen) * FIRE_FILL_DURATION;
              const durShort = (segShort / lineLen) * FIRE_FILL_DURATION;

              // Angle of the i→j vector in degrees (same axis as both lanes —
              // a perpendicular offset doesn't rotate the line).
              const lineAngleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

              return (
                <g key={`${i}-${j}`}>
                  {forwardCommitted && (
                    <g
                      data-line-visible={forwardVisible ? "true" : "false"}
                      data-line-fired={forwardFired ? "true" : "false"}
                      style={{ opacity: forwardVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
                    >
                      {/* Beige dashed track — wiped in via the mask below */}
                      <defs>
                        <mask id={`beige-fwd-${uid}-${i}-${j}`} maskUnits="userSpaceOnUse">
                          <line
                            x1={forwardLane.x1} y1={forwardLane.y1}
                            x2={forwardLane.x2} y2={forwardLane.y2}
                            stroke="white" strokeWidth={6}
                            strokeDasharray={`${lineLen} ${lineLen}`}
                            strokeDashoffset={drawState === "pre" ? lineLen : 0}
                            style={maskRevealStyle}
                          />
                        </mask>
                      </defs>
                      <g mask={`url(#beige-fwd-${uid}-${i}-${j})`}>
                        <line
                          x1={forwardLane.x1} y1={forwardLane.y1}
                          x2={forwardArrowEnd.x} y2={forwardArrowEnd.y}
                          stroke={palette.paperDim} strokeWidth={1.8}
                          strokeDasharray="6 4"
                        />
                        <line
                          x1={forwardArrowEnd.x} y1={forwardArrowEnd.y}
                          x2={forwardLane.x2} y2={forwardLane.y2}
                          stroke={palette.paperDim} strokeWidth={1.8}
                          strokeDasharray="6 4"
                        />
                      </g>
                      {/* Red ink overlay — fills source→target on fire */}
                      <g filter={`url(#${glowId})`} style={{ opacity: forwardFired ? 1 : 0, transition: "opacity 0.1s ease" }}>
                        <line
                          x1={forwardLane.x1} y1={forwardLane.y1}
                          x2={forwardArrowEnd.x} y2={forwardArrowEnd.y}
                          stroke={palette.blood} strokeWidth={1.8}
                          style={{
                            strokeDasharray: `${segLong} ${segLong}`,
                            strokeDashoffset: forwardFired ? 0 : segLong,
                            transition: `stroke-dashoffset ${durLong}s ease-out`,
                          }}
                        />
                        <line
                          x1={forwardArrowEnd.x} y1={forwardArrowEnd.y}
                          x2={forwardLane.x2} y2={forwardLane.y2}
                          stroke={palette.blood} strokeWidth={1.8}
                          style={{
                            strokeDasharray: `${segShort} ${segShort}`,
                            strokeDashoffset: forwardFired ? 0 : segShort,
                            transition: `stroke-dashoffset ${durShort}s ease-out ${durLong}s`,
                          }}
                        />
                      </g>
                      {/* Arrow — beige until the line fills, then turns red */}
                      <polygon
                        points="-10,-5 0,0 -10,5"
                        transform={`translate(${forwardArrowEnd.x},${forwardArrowEnd.y}) rotate(${lineAngleDeg})`}
                        fill={forwardFired ? palette.blood : palette.paperDim}
                        style={{
                          ...arrowDrawStyle,
                          // Delay the colour shift until ink actually reaches the arrow tip
                          // (durLong) — not the full source→target fill — so the arrow
                          // turns red just as the red overlay arrives at it.
                          transition: `${arrowDrawStyle.transition}, fill 0.12s ease ${forwardFired ? durLong : 0}s, filter 0.12s ease ${forwardFired ? durLong : 0}s`,
                          filter: forwardFired ? "drop-shadow(0 0 1.8px rgba(201,58,48,0.55))" : "none",
                        }}
                      />
                    </g>
                  )}
                  {backwardCommitted && (
                    <g
                      data-line-visible={backwardVisible ? "true" : "false"}
                      data-line-fired={backwardFired ? "true" : "false"}
                      style={{ opacity: backwardVisible ? 1 : 0, transition: "opacity 0.4s ease" }}
                    >
                      {/* Beige dashed track — wiped in via the mask below */}
                      <defs>
                        <mask id={`beige-bwd-${uid}-${i}-${j}`} maskUnits="userSpaceOnUse">
                          <line
                            x1={backwardLane.x2} y1={backwardLane.y2}
                            x2={backwardLane.x1} y2={backwardLane.y1}
                            stroke="white" strokeWidth={6}
                            strokeDasharray={`${lineLen} ${lineLen}`}
                            strokeDashoffset={drawState === "pre" ? lineLen : 0}
                            style={maskRevealStyle}
                          />
                        </mask>
                      </defs>
                      <g mask={`url(#beige-bwd-${uid}-${i}-${j})`}>
                        <line
                          x1={backwardLane.x2} y1={backwardLane.y2}
                          x2={backwardArrowEnd.x} y2={backwardArrowEnd.y}
                          stroke={palette.paperDim} strokeWidth={1.8}
                          strokeDasharray="6 4"
                        />
                        <line
                          x1={backwardArrowEnd.x} y1={backwardArrowEnd.y}
                          x2={backwardLane.x1} y2={backwardLane.y1}
                          stroke={palette.paperDim} strokeWidth={1.8}
                          strokeDasharray="6 4"
                        />
                      </g>
                      {/* Red ink overlay — fills source→target on fire */}
                      <g filter={`url(#${glowId})`} style={{ opacity: backwardFired ? 1 : 0, transition: "opacity 0.1s ease" }}>
                        <line
                          x1={backwardLane.x2} y1={backwardLane.y2}
                          x2={backwardArrowEnd.x} y2={backwardArrowEnd.y}
                          stroke={palette.blood} strokeWidth={1.8}
                          style={{
                            strokeDasharray: `${segLong} ${segLong}`,
                            strokeDashoffset: backwardFired ? 0 : segLong,
                            transition: `stroke-dashoffset ${durLong}s ease-out`,
                          }}
                        />
                        <line
                          x1={backwardArrowEnd.x} y1={backwardArrowEnd.y}
                          x2={backwardLane.x1} y2={backwardLane.y1}
                          stroke={palette.blood} strokeWidth={1.8}
                          style={{
                            strokeDasharray: `${segShort} ${segShort}`,
                            strokeDashoffset: backwardFired ? 0 : segShort,
                            transition: `stroke-dashoffset ${durShort}s ease-out ${durLong}s`,
                          }}
                        />
                      </g>
                      {/* Arrow — beige until the line fills, then turns red */}
                      <polygon
                        points="-10,-5 0,0 -10,5"
                        transform={`translate(${backwardArrowEnd.x},${backwardArrowEnd.y}) rotate(${lineAngleDeg + 180})`}
                        fill={backwardFired ? palette.blood : palette.paperDim}
                        style={{
                          ...arrowDrawStyle,
                          transition: `${arrowDrawStyle.transition}, fill 0.12s ease ${backwardFired ? durLong : 0}s, filter 0.12s ease ${backwardFired ? durLong : 0}s`,
                          filter: backwardFired ? "drop-shadow(0 0 1.8px rgba(201,58,48,0.55))" : "none",
                        }}
                      />
                    </g>
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
            flagId={jollyRogerForColor(p.colorOrAvatar)}
            colorId={p.colorOrAvatar}
            ducked={ducked(p.id)}
            dim={p.status === "dead"}
            struck={struck(p.id)}
          />
        </Box>
      ))}
      {overlay}
    </Box>
  );
}
