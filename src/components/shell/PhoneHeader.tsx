import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { SkullLogo } from "./SkullLogo";
import { StandoffLogo } from "./StandoffLogo";

interface PhoneHeaderProps {
  /** Room code for the centre slot. When omitted, the wordmark renders instead — same default Masthead uses for off-game contexts (the join code-entry page). */
  roomId?: string;
  /** Player's chosen flag colour. Renders the flag tile on the right when set. */
  flagId?: string;
}

// Compact header for phone screens — skull glyph on the left, ROOM CODE in
// the middle (or the wordmark when no room is in play yet), optional player
// flag tile on the right. The flag slot stays a fixed width even when empty
// so the centre doesn't shift between states.
export function PhoneHeader({ roomId, flagId }: PhoneHeaderProps) {
  const { t } = useTranslation();
  const FLAG_TILE_W = "2.8rem";
  const FLAG_TILE_H = "1.95rem";
  return (
    <Box
      sx={{
        padding: "0.7rem 0.85rem 0.55rem",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: "0.7rem",
        flexShrink: 0,
        color: palette.paper,
      }}
    >
      <SkullLogo height="1.8rem" />
      {roomId ? (
        <Box
          sx={{
            textAlign: "center",
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.95rem",
            letterSpacing: "0.28em",
            color: palette.paperDim,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {t("shell.room")}{" "}
          <Box
            component="em"
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              letterSpacing: "0.06em",
              color: palette.paper,
            }}
          >
            {roomId}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", color: palette.paper }}>
          <StandoffLogo width="6rem" />
        </Box>
      )}
      <Box
        sx={{
          width: FLAG_TILE_W,
          height: FLAG_TILE_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: flagId ? flagColor(flagId) : "transparent",
        }}
      >
        {flagId && <FlagFor id={jollyRogerForColor(flagId)} size="1.3rem" />}
      </Box>
    </Box>
  );
}
