import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { FlagFor, jollyRogerForColor } from "../flags";

interface AimBarrelProps {
  /**
   * Player colour id. Rendered as the per-colour jolly roger silhouette
   * inside the barrel's sights. Null/undefined renders an empty barrel with
   * a question-mark placeholder (used while the player hasn't picked a mark
   * yet during the commit phase).
   */
  colorOrAvatar?: string | null;
  size?: number;
}

// Circular flintlock-barrel sights — paper-colored disc on the inside of an
// ink rim, blood-tinted jolly roger silhouette aimed through it, dashed
// blood crosshair lines crossing the centre. Used both as the standoff-phase
// "AIM TRUE" focal visual (FlintlockBarrel wraps this) and as the commit-
// phase aim display inside TargetList.
export function AimBarrel({ colorOrAvatar, size = 160 }: AimBarrelProps) {
  const flagSize = Math.round(size * 0.55);
  const insetGlow = Math.round(size * 0.14);
  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.paper} 0%, ${palette.paper} 55%, ${palette.ink} 60%, ${palette.ink} 100%)`,
        boxShadow: `inset 0 0 ${insetGlow}px rgba(90,55,29,0.6)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {colorOrAvatar ? (
        <Box sx={{ color: palette.blood }}>
          <FlagFor id={jollyRogerForColor(colorOrAvatar)} size={flagSize} />
        </Box>
      ) : (
        <Box
          sx={{
            color: palette.paperFaint,
            fontFamily: "serif",
            fontStyle: "italic",
            fontSize: Math.round(size * 0.3),
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ?
        </Box>
      )}
      {/* Crosshair lines pinned to the disc's centre. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "50%",
          left: "8%",
          right: "8%",
          height: 1.5,
          bgcolor: palette.blood,
          opacity: 0.55,
          transform: "translateY(-50%)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: "50%",
          top: "8%",
          bottom: "8%",
          width: 1.5,
          bgcolor: palette.blood,
          opacity: 0.55,
          transform: "translateX(-50%)",
        }}
      />
    </Box>
  );
}
