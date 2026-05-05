import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface StandoffStampProps {
  count: number;
}

export function StandoffStamp({ count }: StandoffStampProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "0.95rem",
          letterSpacing: "0.6em",
          color: palette.paperDim,
        }}
      >
        — AT THE COUNT OF —
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "18rem",
            lineHeight: 0.85,
            color: palette.paper,
            textShadow: "0 0 24px rgba(255, 195, 120, 0.25)",
          }}
        >
          {count}
        </Box>
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          letterSpacing: "0.05em",
          color: palette.paperDim,
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
