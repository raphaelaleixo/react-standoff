import { Box } from "@mui/material";
import type { Game } from "../game/types";
import { palette } from "../theme/colors";
import { HoardList } from "./hoard/HoardList";
import { TargetingMap } from "./standoff/TargetingMap";
import { CrewRoster } from "./crew/CrewRoster";

interface GameBoardProps {
  game: Game;
  freshlyStruck?: Set<string>;
}

export function GameBoard({ game, freshlyStruck }: GameBoardProps) {
  // Map the round's banknote loot into the HoardList shape. Carry-over data
  // is not currently tracked on Banknote; defer to a follow-up if/when it lands.
  const loot = game.round.loot.map(n => ({ value: n.value }));

  return (
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
      <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <TargetingMap game={game} />
      </Box>
      <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <CrewRoster game={game} freshlyStruck={freshlyStruck} />
      </Box>
    </Box>
  );
}
