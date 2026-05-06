import { useRef } from "react";
import { Box, Fade } from "@mui/material";
import type { Game } from "../game/types";
import { palette } from "../theme/colors";
import { HoardList } from "./hoard/HoardList";
import { TargetingMap } from "./standoff/TargetingMap";
import { StandoffStamp } from "./standoff/StandoffStamp";
import { RevealBanner } from "./standoff/RevealBanner";
import { CrewRoster } from "./crew/CrewRoster";
import { useStandoffCount } from "../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS } from "../lib/phaseDurations";
import { durations } from "../theme/animations";

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
  const inStandoff = game.round.phase === "standoff";
  const count = useStandoffCount({
    active: inStandoff,
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });
  // Latch the last visible count so the StandoffStamp keeps reading the
  // same digit while it fades out after the phase has already advanced.
  const lastCountRef = useRef(0);
  if (count !== null) lastCountRef.current = count;
  const showStamp = inStandoff && count !== null;

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
          <HoardList loot={game.round.loot} />
        </Box>
        <Box
          sx={{
            padding: "0.6rem 0.85rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <TargetingMap
            game={game}
            overlay={
              <Fade in={showStamp} timeout={{ enter: 0, exit: durations.base }} unmountOnExit>
                <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <StandoffStamp count={lastCountRef.current} />
                </Box>
              </Fade>
            }
          />
        </Box>
        <Box sx={{ padding: "0.6rem 0.85rem", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <CrewRoster game={game} freshlyStruck={freshlyStruck} />
        </Box>
      </Box>
    </Box>
  );
}
