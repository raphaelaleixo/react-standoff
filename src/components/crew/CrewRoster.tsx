import { Box } from "@mui/material";
import type { Game, Player } from "../../game/types";
import { CrewRow, type CrewStatus } from "./CrewRow";
import { SectionHeader } from "../shell/SectionHeader";

interface CrewRosterProps {
  game: Game;
  /** Player ids that were just struck this round (for the wound-pip pulse). */
  freshlyStruck?: Set<string>;
}

// Players wounded by the current phase: BBB victims from reveal_bbb on, plus
// bang victims once reveal_others lands. Mirrors the targeting map's logic so
// the STRUCK pill and the map's struck roundel light up for the same players.
function computeStruck(game: Game): Set<string> {
  const struck = new Set<string>();
  const phase = game.round.phase;
  if (phase !== "reveal_bbb" && phase !== "reveal_others" && phase !== "split") {
    return struck;
  }
  for (const p of game.players) {
    const c = game.round.commits[p.id];
    if (c?.bullet === "bang_bang_bang" && !c.withdrew && c.target) {
      const tc = game.round.commits[c.target];
      if (!tc?.withdrew) struck.add(c.target);
    }
  }
  if (phase === "reveal_others" || phase === "split") {
    for (const p of game.players) {
      const c = game.round.commits[p.id];
      if (c?.bullet === "bang" && !c.withdrew && c.target) {
        if (struck.has(p.id)) continue; // shooter was BBB-wounded → bullet voided
        const tc = game.round.commits[c.target];
        if (tc?.withdrew) continue;
        if (struck.has(c.target)) continue;
        struck.add(c.target);
      }
    }
  }
  return struck;
}

// Apply this round's in-flight wound to the displayed pip count once it's
// dramatically resolved — so the BBB victim shows their new pip in reveal_bbb,
// the bang victim shows it in reveal_others, etc. Caps at 3 (death).
function effectiveWounds(p: Player, struck: Set<string>): Player["wounds"] {
  const w = p.wounds + (struck.has(p.id) ? 1 : 0);
  return Math.min(w, 3) as Player["wounds"];
}

// Yielding gives a shame marker. The marker becomes visible once the duck is
// public — reveal_withdraw onward.
function effectiveShame(p: Player, game: Game): number {
  const phase = game.round.phase;
  const yieldRevealed =
    phase === "reveal_withdraw" ||
    phase === "reveal_bbb" ||
    phase === "reveal_others" ||
    phase === "split";
  return yieldRevealed && game.round.commits[p.id]?.withdrew ? p.shame + 1 : p.shame;
}

function deriveStatus(
  game: Game,
  p: Player,
  struck: Set<string>,
): CrewStatus | undefined {
  if (p.status === "dead") return "dead";
  const c = game.round.commits[p.id];
  switch (game.round.phase) {
    case "commit":
      return c?.bullet && c?.target ? "ready" : "choosing";
    case "standoff":
    case "standoff_hold":
    case "withdraw":
      return undefined;
    case "reveal_withdraw":
      return c?.withdrew ? "yielded" : undefined;
    case "reveal_bbb":
    case "reveal_others":
    case "split":
      if (struck.has(p.id)) return "struck";
      if (c?.withdrew) return "yielded";
      // No pill for standing players — they're alive and (in split) get the take.
      return undefined;
    default:
      return undefined;
  }
}

export function CrewRoster({ game, freshlyStruck }: CrewRosterProps) {
  const fresh = freshlyStruck ?? new Set<string>();
  // Union the freshlyStruck signal from the parent (real-time wound application)
  // with our commits-based derivation so the STRUCK pill works for both live
  // games and the mock board (where freshlyStruck isn't simulated).
  const struck = new Set<string>([...computeStruck(game), ...fresh]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <SectionHeader title="The Crew" subtitle="six souls, one prize" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {game.players.map(p => {
          const wounds = effectiveWounds(p, struck);
          const shame = effectiveShame(p, game);
          return (
            <CrewRow
              key={p.id}
              player={{ ...p, wounds, shame }}
              status={deriveStatus(game, p, struck)}
              freshWoundIndex={fresh.has(p.id) ? wounds - 1 : undefined}
            />
          );
        })}
      </Box>
    </Box>
  );
}
