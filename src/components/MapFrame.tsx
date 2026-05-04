import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { palette } from "../theme/colors";

// Parchment background with compass rose and decorative motifs. Wraps the
// big-screen game board. The visual frame inherits the targeting-line
// geometry already in GameBoard — see standoff_targeting_lines.md memory.
export function MapFrame({ children, size = 700 }: { children: ReactNode; size?: number }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        mx: "auto",
        background: `
          radial-gradient(ellipse at 30% 20%, ${palette.paper} 0%, ${palette.paperDim} 80%),
          ${palette.paper}
        `,
        boxShadow: `inset 0 0 80px rgba(90, 55, 29, 0.25)`,
        borderRadius: "8px",
        overflow: "hidden",
        border: `2px solid ${palette.ink}`,
      }}
    >
      <CompassRose />
      <DecorativeBorder />
      {children}
    </Box>
  );
}

function CompassRose() {
  return (
    <Box sx={{ position: "absolute", bottom: 14, right: 14, opacity: 0.55, pointerEvents: "none" }}>
      <svg viewBox="0 0 64 64" width={70} height={70}>
        <g fill={palette.ink} stroke={palette.ink}>
          <polygon points="32,4 36,30 32,32 28,30" />
          <polygon points="32,60 36,34 32,32 28,34" fillOpacity="0.6" />
          <polygon points="4,32 30,28 32,32 30,36" fillOpacity="0.6" />
          <polygon points="60,32 34,28 32,32 34,36" fillOpacity="0.6" />
          <circle cx="32" cy="32" r="3" fill="none" strokeWidth="1.5" />
          <text x="32" y="14" textAnchor="middle" fontFamily="Pirata One, serif" fontSize="8">N</text>
        </g>
      </svg>
    </Box>
  );
}

function DecorativeBorder() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 8,
        border: `1px dashed ${palette.ink}`,
        opacity: 0.35,
        borderRadius: "6px",
        pointerEvents: "none",
      }}
    />
  );
}
