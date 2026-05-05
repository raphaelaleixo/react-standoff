import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface MastheadProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  centerSub?: React.ReactNode;
  right?: React.ReactNode;
}

const DEFAULT_SUB = "A NEW & TRUE BALLAD OF MUTINY · MMXXVI";

export function Masthead({ left, center = "The Standoff", centerSub = DEFAULT_SUB, right }: MastheadProps) {
  return (
    <Box
      component="header"
      sx={{
        borderBottom: `4px double ${palette.ruleStrong}`,
        padding: "0.7rem 1.5rem 0.55rem",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "end",
        gap: "1.2rem",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          paddingBottom: "0.45rem",
        }}
      >
        {left}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "2.1rem",
            lineHeight: 0.9,
            letterSpacing: "0.02em",
            color: palette.paper,
            textShadow: "0 0 12px rgba(255, 195, 120, 0.15)",
          }}
        >
          {center}
        </Box>
        {centerSub && (
          <Box
            sx={{
              fontFamily: fonts.bodySc,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.6rem",
              letterSpacing: "0.36em",
              color: palette.paperDim,
              marginTop: "0.18rem",
            }}
          >
            {centerSub}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          textAlign: "right",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          paddingBottom: "0.45rem",
        }}
      >
        {right}
      </Box>
    </Box>
  );
}
