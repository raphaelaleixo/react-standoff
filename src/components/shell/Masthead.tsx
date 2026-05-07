import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface MastheadProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  /** Optional small-caps subtitle stacked under `center`. */
  centerSub?: React.ReactNode;
  right?: React.ReactNode;
}

export function Masthead({ left, center = "The Standoff", centerSub, right }: MastheadProps) {
  return (
    <Box
      component="header"
      sx={{
        borderBottom: `4px double ${palette.ruleStrong}`,
        padding: "1.2rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: "1.2rem",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.99rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
        }}
      >
        {left}
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "2.1rem",
            fontWeight: 700,
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
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.72rem",
              letterSpacing: "0.4em",
              color: palette.paperDim,
              marginTop: "0.35rem",
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
          fontSize: "0.99rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
        }}
      >
        {right}
      </Box>
    </Box>
  );
}
