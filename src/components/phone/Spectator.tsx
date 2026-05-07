import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { toRoman } from "../../lib/navyHours";
import { CrewRoster } from "../crew/CrewRoster";
import type { Game } from "../../game/types";

interface SpectatorProps {
  game: Game;
  /** Player has walked the plank — show the elimination banner above the roster. */
  eliminated?: boolean;
  /** Round in which they were eliminated; rendered as a roman numeral. */
  eliminatedRound?: number;
}

// Phone-side spectator surface for the reveal sub-phases (passive watching)
// and for eliminated players. Big-screen carries the action — this surface
// just mirrors the live crew ledger so the player can see the round play out
// from their seat. Optional 'YE WALKED THE PLANK' banner sits above the
// roster when the player has been eliminated.
export function Spectator({ game, eliminated, eliminatedRound }: SpectatorProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "0.7rem 0.6rem",
        overflow: "auto",
        gap: "0.6rem",
      }}
    >
      {eliminated && (
        <Box
          sx={{
            textAlign: "center",
            padding: "0.9rem 0.7rem",
            border: `1.5px solid ${palette.blood}`,
            color: palette.blood,
            background: `color-mix(in srgb, ${palette.blood} 8%, transparent)`,
          }}
        >
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontSize: "1.55rem",
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            YE WALKED THE PLANK
          </Box>
          {eliminatedRound != null && (
            <Box
              sx={{
                fontFamily: fonts.body,
                fontStyle: "italic",
                fontSize: "0.85rem",
                marginTop: "0.3rem",
                color: palette.paperDim,
              }}
            >
              — round {toRoman(eliminatedRound)} —
            </Box>
          )}
        </Box>
      )}
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.62rem",
          letterSpacing: "0.4em",
          textAlign: "center",
          color: palette.paperDim,
        }}
      >
        {t("player.watchScreen").toUpperCase()}
      </Box>
      <CrewRoster game={game} />
    </Box>
  );
}
