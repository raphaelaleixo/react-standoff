import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { durations, fadeIn, popIn } from "../../theme/animations";

// Split-phase stamp shown when the bag can't be cleanly divided across
// the standing players (splitLoot returned empty awards). Same overlay
// slot the StandoffStamp / WithdrawStamp / RevealStamp use — eyebrow
// above, big blackletter label centred, italic cry below.
export function SplitRolloverStamp() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          bottom: "calc(100% + 1em)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: fonts.displayCaps,
          fontSize: "0.95rem",
          letterSpacing: "0.6em",
          color: palette.paperDim,
          animation: `${fadeIn} ${durations.base}ms ease-out both`,
        }}
      >
        — SHARES UNEVEN —
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "7rem",
            lineHeight: 1,
            color: palette.paper,
            textShadow: "0 0 24px rgba(255, 195, 120, 0.25)",
            transform: "translateY(-0.18em)",
            animation: `${popIn} 360ms cubic-bezier(.2,.7,.2,1.4) both`,
          }}
        >
          Rollover
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: "calc(100% + 0.6em)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          color: palette.paperDim,
          animation: `${fadeIn} ${durations.base}ms ease-out 120ms both`,
        }}
      >
        The bag rolls into the next round.
      </Box>
    </Box>
  );
}
