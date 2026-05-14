import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Role } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Lantern } from "../screens/icons/Lantern";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";

// Role card faces — mirror PowerCard's faceDown/faceUp recipe so the
// cop-variant role card flips look-and-feel identical to a super-powers
// card in PhoneShell's corner widget slot. Both faces are 300×400 (lg
// PowerCard size).

// Back of the card — deep blood-red so it reads as a "sealed letter"
// and is clearly distinct from PowerCard's ink-dark back. Same recipe
// otherwise: ruleStrong border + paperDim blackletter "?" centred.
export function RoleCardBack() {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: palette.bloodDeep,
        color: palette.paper,
        border: `2px solid ${palette.ruleStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "5.5rem",
          fontWeight: 800,
          lineHeight: 1,
          color: palette.paperDim,
        }}
      >
        Role
      </Box>
    </Paper>
  );
}

// Front of the card — paper bg with the hairline inset frame, blackletter
// title at top, dimmed sigil watermark (opacity 0.22) in the middle,
// italic body at the bottom. Same layout as PowerCard lg. The pirate
// (mafia) front uses the player's own jolly roger so the watermark
// reads as "this is the flag you fly".
export function RoleCardFront({ role, colorOrAvatar }: { role: Role; colorOrAvatar: string }) {
  const { t } = useTranslation();
  const isCop = role === "cop";
  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        height: "100%",
        p: 3,
        bgcolor: palette.paper,
        color: palette.ink,
        border: `2px solid ${palette.inkDeep}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 6,
          border: `1px solid ${palette.paperFaint}`,
          pointerEvents: "none",
        }}
      />

      <Typography
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "1.95rem",
          letterSpacing: "0.02em",
          fontWeight: 800,
          color: palette.ink,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isCop ? t("cop.reveal.cop") : t("cop.reveal.mafia")}
      </Typography>

      <Box
        aria-hidden
        sx={{
          color: palette.inkDeep,
          opacity: 0.22,
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isCop ? (
          <Lantern lit size={108} />
        ) : (
          <FlagFor id={jollyRogerForColor(colorOrAvatar)} size={108} />
        )}
      </Box>

      <Typography
        sx={{
          fontFamily: fonts.body,
          fontSize: "0.98rem",
          fontStyle: "italic",
          color: palette.inkDeep,
          lineHeight: 1.35,
          position: "relative",
          zIndex: 1,
        }}
      >
        {isCop ? t("cop.reveal.copBody") : t("cop.reveal.mafiaBody")}
      </Typography>
    </Paper>
  );
}
