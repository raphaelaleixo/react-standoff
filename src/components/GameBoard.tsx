import { Box } from "@mui/material";
import type { Game } from "../game/types";
import { palette } from "../theme/colors";
import { HoardList } from "./hoard/HoardList";
import { TargetingMap } from "./standoff/TargetingMap";
import { StandoffStamp } from "./standoff/StandoffStamp";
import { RevealBanner } from "./standoff/RevealBanner";
import { CrewRoster } from "./crew/CrewRoster";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS } from "../lib/phaseDurations";

export type GameBoardBanner =
  | { kind: "broadside"; struckCount: number }
  | { kind: "kill"; name: string }
  | null;

interface GameBoardProps {
  game: Game;
  freshlyStruck?: Set<string>;
  banner?: GameBoardBanner;
}

export function GameBoard({ game, freshlyStruck, banner }: GameBoardProps) {
  // Map the round's banknote loot into the HoardList shape. Carry-over data
  // is not currently tracked on Banknote; defer to a follow-up if/when it lands.
  const loot = game.round.loot.map(n => ({ value: n.value }));

  const inStandoff = game.round.phase === "standoff";
  const count = useStandoffCount({
    active: inStandoff,
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
      }}
    >
      {banner && (
        banner.kind === "broadside"
          ? <RevealBanner kind="broadside" struckCount={banner.struckCount} />
          : <RevealBanner kind="kill" name={banner.name} />
      )}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "25% 50% 25%",
          borderTop: `4px double ${palette.ruleStrong}`,
          borderBottom: `4px double ${palette.ruleStrong}`,
          minHeight: 0,
        }}
      >
        <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <HoardList loot={loot} />
        </Box>
        <Box
          sx={{
            padding: "0.6rem 0.85rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            position: "relative",
          }}
        >
          <TargetingMap game={game} />
          {inStandoff && count !== null && <StandoffStamp count={count} />}
        </Box>
        <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <CrewRoster game={game} freshlyStruck={freshlyStruck} />
        </Box>
      </Box>
    </Box>
  );
}
