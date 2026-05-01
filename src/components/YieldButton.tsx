import { Box, Typography } from "@mui/material";
import { palette } from "../theme/colors";

// Phase 3 phone view: large scrolled YIELD on a yellow ribbon banner.
export function YieldButton({ yielded, onToggle }: {
  yielded: boolean;
  onToggle: () => void;
}) {
  return (
    <Box
      role="button"
      onClick={onToggle}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        py: 4,
        px: 3,
        bgcolor: yielded ? palette.yellow : palette.parchment,
        border: `3px solid ${palette.ink}`,
        borderRadius: 2,
        position: "relative",
        textAlign: "center",
        boxShadow: `0 4px 8px rgba(90,55,29,0.3)`,
        transition: "background 0.2s ease",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          width: 24,
          height: 36,
          bgcolor: palette.yellow,
          border: `3px solid ${palette.ink}`,
          transform: "translateY(-50%)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 50% 50%)",
        },
        "&::before": { left: -16 },
        "&::after": { right: -16, transform: "translateY(-50%) scaleX(-1)" },
      }}
    >
      <Typography variant="h2" sx={{ color: palette.ink, letterSpacing: 6 }}>
        {yielded ? "YIELDED" : "YIELD"}
      </Typography>
      {yielded && (
        <Typography variant="body2" sx={{ color: palette.inkSoft, mt: 1 }}>
          (tap to undo)
        </Typography>
      )}
    </Box>
  );
}
