import { Box } from "@mui/material";
import type { Game, Player } from "../../game/types";
import { CrewRow, type CrewStatus } from "./CrewRow";
import { SectionHeader } from "../shell/SectionHeader";
import { FLAG_LABELS } from "../../game/playerFlags";

interface CrewRosterProps {
  game: Game;
  /** Player ids that were just struck this round (for visual highlight). */
  freshlyStruck?: Set<string>;
}

function deriveStatus(game: Game, p: Player, fresh: Set<string>): CrewStatus {
  if (p.status === "dead") return "dead";
  const c = game.round.commits[p.id];
  switch (game.round.phase) {
    case "commit":
      return c?.bullet && c?.target ? "ready" : "choosing";
    case "standoff":
      return "aiming";
    case "withdraw":
      return c?.withdrew ? "yielded" : "aiming";
    case "reveal_withdraw":
      return c?.withdrew ? "yielded" : "aiming";
    case "reveal_bbb":
    case "reveal_others":
      if (fresh.has(p.id)) return "struck";
      if (c?.withdrew) return "yielded";
      return "aiming";
    case "split":
      return c?.withdrew ? "yielded" : "out";
    default:
      return "out";
  }
}

export function CrewRoster({ game, freshlyStruck }: CrewRosterProps) {
  const fresh = freshlyStruck ?? new Set<string>();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <SectionHeader title="The Crew" subtitle="six souls, one prize" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {game.players.map(p => (
          <CrewRow
            key={p.id}
            player={p}
            flagName={(FLAG_LABELS as Record<string, string>)[p.colorOrAvatar] ?? p.colorOrAvatar.toUpperCase()}
            status={deriveStatus(game, p, fresh)}
            freshWoundIndex={fresh.has(p.id) ? p.wounds - 1 : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}
