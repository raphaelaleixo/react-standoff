import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { durations, fadeIn } from "../../theme/animations";

interface WithdrawStampProps {
  count: number;
}

// Withdraw-phase countdown. Mirrors StandoffStamp's eyebrow / cry layout
// (positioned above and below the targeting map's outer Box) but skips
// the centred numeral — the targeting lines must stay readable while
// players decide whether to yield.
export function WithdrawStamp({ count }: WithdrawStampProps) {
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
        — STRIKE THE COLOURS —
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: "calc(100% + 1em)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          letterSpacing: "0.05em",
          color: palette.paperDim,
          animation: `${fadeIn} ${durations.base}ms ease-out both`,
        }}
      >
        yield in{" "}
        <Box
          component="span"
          sx={{
            fontFamily: fonts.displayCaps,
            fontStyle: "normal",
            fontSize: "1.2rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: palette.gold,
            margin: "0 0.18em",
          }}
        >
          {count}
        </Box>
        seconds…
      </Box>
    </Box>
  );
}
