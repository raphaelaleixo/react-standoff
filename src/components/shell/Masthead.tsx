import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { StandoffLogo } from "./StandoffLogo";

interface MastheadProps {
  left?: React.ReactNode;
  /**
   * Centre slot. When omitted, the StandoffLogo wordmark renders in its
   * place — that's the default in-game header. Pass a string / node to
   * override (e.g. "The Reckoning" on the end-game screen).
   */
  center?: React.ReactNode;
  /** Optional small-caps subtitle stacked under `center`. */
  centerSub?: React.ReactNode;
  right?: React.ReactNode;
  /**
   * When set, the wordmark becomes a clickable home-link with a hover lift
   * and keyboard activation. Off by default — in-game mastheads should NOT
   * pass this, since a stray tap on a TV during a live round shouldn't bail
   * the host out of the room.
   */
  onLogoClick?: () => void;
}

export function Masthead({ left, center, centerSub, right, onLogoClick }: MastheadProps) {
  const logoClickable = onLogoClick != null;
  const handleLogoKey = (e: React.KeyboardEvent) => {
    if (!logoClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLogoClick?.();
    }
  };
  return (
    <Box
      component="header"
      sx={{
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
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {center == null ? (
          <Box
            role={logoClickable ? "button" : undefined}
            tabIndex={logoClickable ? 0 : undefined}
            aria-label={logoClickable ? "Return to home" : undefined}
            onClick={logoClickable ? onLogoClick : undefined}
            onKeyDown={logoClickable ? handleLogoKey : undefined}
            sx={{
              color: palette.paper,
              filter: "drop-shadow(0 0 12px rgba(255, 195, 120, 0.15))",
              ...(logoClickable && {
                cursor: "pointer",
                borderRadius: "4px",
                transition: "filter 0.25s ease, transform 0.18s ease",
                "&:hover": {
                  filter: "drop-shadow(0 0 18px rgba(255, 195, 120, 0.3))",
                },
                "&:active": { transform: "translateY(1px)" },
                "&:focus-visible": {
                  outline: `2px solid ${palette.paper}`,
                  outlineOffset: "6px",
                },
              }),
            }}
          >
            <StandoffLogo width="7.2rem" />
          </Box>
        ) : (
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
        )}
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
