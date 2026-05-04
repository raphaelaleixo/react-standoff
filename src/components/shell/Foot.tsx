import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface FootProps {
  left?: React.ReactNode;
  cry?: React.ReactNode;
  right?: React.ReactNode;
}

export function Foot({ left, cry, right }: FootProps) {
  return (
    <Box
      component="footer"
      sx={{
        padding: "0.4rem 1.5rem 0.45rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        fontFamily: fonts.displayCaps,
        fontSize: "0.65rem",
        letterSpacing: "0.18em",
        color: palette.paper,
        flexShrink: 0,
      }}
    >
      <Box data-foot-slot="left">{left}</Box>
      <Box
        data-foot-slot="cry"
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.95rem",
          letterSpacing: "0.05em",
          color: palette.paperDim,
        }}
      >
        {cry}
      </Box>
      <Box data-foot-slot="right" sx={{ textAlign: "right" }}>
        {right}
      </Box>
    </Box>
  );
}
