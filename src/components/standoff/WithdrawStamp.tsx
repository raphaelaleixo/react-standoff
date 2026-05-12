import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { durations, fadeIn, numberPulse } from "../../theme/animations";

interface WithdrawStampProps {
  count: number;
}

// Withdraw-phase countdown. Mirrors StandoffStamp: eyebrow above the map,
// big centred numeral over the map, italic cry below. The numeral runs
// numberPulse via key={count} so each tick lands with a beat — same as
// the standoff. Slightly smaller than StandoffStamp (14rem vs 18rem) to
// accommodate two-digit counts and stay a touch lighter so the targeting
// lines underneath remain legible while a player decides to yield.
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
        — TEST YOUR COURAGE —
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
          key={count}
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "14rem",
            lineHeight: 1,
            color: palette.paper,
            textShadow: "0 0 24px rgba(255, 195, 120, 0.25)",
            transform: "translateY(-0.18em)",
            animation: `${numberPulse} 320ms cubic-bezier(.2,.7,.2,1.4) both`,
          }}
        >
          {count}
        </Box>
      </Box>
    </Box>
  );
}
