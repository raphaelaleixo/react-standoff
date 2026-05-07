import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
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
  /**
   * Standoff-phase countdown numeral. When provided (non-null, > 0), a giant
   * blackletter digit is overlaid on top of the dimmed jolly roger and a
   * "STAND" label sits beneath it inside the disc. Pass null/undefined for
   * the commit-phase aim view (no count, full-opacity flag).
   */
  count?: number | null;
}

// Circular flintlock-barrel sights — paper-colored disc on the inside of an
// ink rim, blood-tinted jolly roger silhouette aimed through it, dashed
// blood crosshair lines crossing the centre. Shared between the commit-phase
// aim view (TargetList) and the standoff-phase aim view (PhaseView). When
// `count` is set, the standoff dressing kicks in: flag dims, big blackletter
// numeral overlays, "STAND" label sits beneath.
export function AimBarrel({ colorOrAvatar, size = 160, count }: AimBarrelProps) {
  const flagSize = Math.round(size * 0.55);
  const insetGlow = Math.round(size * 0.14);
  const showCount = count != null && count > 0;
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
        <Box
          sx={{
            color: palette.blood,
            // The flag dims to ~40% during the standoff count so the giant
            // numeral on top reads cleanly without being overpowered by the
            // silhouette beneath.
            opacity: showCount ? 0.4 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
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
      {/* Standoff overlay: giant blackletter numeral + STAND label. */}
      {showCount && (
        <>
          <Box
            sx={{
              position: "absolute",
              fontFamily: fonts.blackletter,
              fontSize: Math.round(size * 0.62),
              lineHeight: 1,
              color: palette.ink,
              textShadow: `0 0 ${Math.round(size * 0.08)}px rgba(255, 195, 120, 0.55)`,
              zIndex: 2,
              // Slight upward nudge — UnifrakturCook digits sit low in the em
              // box; same correction used by the big-screen StandoffStamp.
              transform: "translateY(-0.06em)",
            }}
          >
            {count}
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: `${Math.round(size * 0.13)}px`,
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: Math.round(size * 0.07),
              letterSpacing: "0.4em",
              color: palette.ink,
              opacity: 0.8,
              zIndex: 2,
            }}
          >
            STAND
          </Box>
        </>
      )}
    </Box>
  );
}
