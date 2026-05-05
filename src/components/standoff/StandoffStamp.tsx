import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { durations, fadeIn, numberPulse } from "../../theme/animations";

interface StandoffStampProps {
  count: number;
}

export function StandoffStamp({ count }: StandoffStampProps) {
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
        — AT THE COUNT OF —
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
            fontSize: "18rem",
            lineHeight: 1,
            color: palette.paper,
            textShadow: "0 0 24px rgba(255, 195, 120, 0.25)",
            // UnifrakturCook digits sit low in their em-box, so the flex-
            // centered line box leaves the visible glyph below the map's
            // geometric middle. Nudge the rendered digit up to compensate.
            // The numberPulse keyframe carries the same translateY through
            // its scale steps so the pop doesn't fight the centering nudge.
            transform: "translateY(-0.18em)",
            animation: `${numberPulse} 320ms cubic-bezier(.2,.7,.2,1.4) both`,
          }}
        >
          {count}
        </Box>
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
        three… two… one…{" "}
        <Box
          component="span"
          sx={{
            fontFamily: fonts.displayCaps,
            fontStyle: "normal",
            letterSpacing: "0.3em",
            color: palette.blood,
          }}
        >
          STAND.
        </Box>
      </Box>
    </Box>
  );
}
