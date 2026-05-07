import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface YieldRibbonProps {
  yielded: boolean;
  onToggle: () => void;
}

// Yellow notched yield ribbon — the player's escape hatch during the
// withdraw phase. Big blackletter YIELD / YIELDED label, italic body
// subline beneath. Tap toggles state; the colour inverts (yellow → ink)
// on yielded so the choice reads at a glance and the "change yer mind"
// affordance is obvious.
//
// Notched ends are rendered with two ::before/::after pseudo-elements
// that take a triangular bite out of either end, so the ribbon reads as
// a banner unfurled across the screen rather than a flat button.
export function YieldRibbon({ yielded, onToggle }: YieldRibbonProps) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      sx={{
        position: "relative",
        width: "100%",
        background: yielded ? palette.ink : palette.yellow,
        color: yielded ? palette.paper : palette.ink,
        textAlign: "center",
        border: `3px solid ${yielded ? palette.paper : palette.ink}`,
        boxShadow: yielded
          ? `5px 5px 0 ${palette.inkDeep}`
          : `5px 5px 0 ${palette.ink}`,
        padding: "1.4rem 1.6rem 1.5rem",
        cursor: "pointer",
        userSelect: "none",
        transition: "background 0.15s ease, transform 0.1s ease",
        "&:active": { transform: "translate(1px, 1px)" },
        "&:focus-visible": {
          outline: `2px solid ${palette.blood}`,
          outlineOffset: "3px",
        },
        // Notched ends — a triangular bite cut into the left and right
        // edges, so the ribbon reads as a banner with cut tips.
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          width: "16px",
          height: "calc(100% + 6px)",
          background: palette.ink,
          transform: "translateY(-50%)",
          pointerEvents: "none",
        },
        "&::before": {
          left: "-3px",
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
        },
        "&::after": {
          right: "-3px",
          clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
        },
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontWeight: 700,
          fontSize: "3rem",
          lineHeight: 1,
          letterSpacing: "0.04em",
        }}
      >
        {yielded ? "YIELDED" : "YIELD"}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
          marginTop: "0.4rem",
          opacity: 0.85,
        }}
      >
        {yielded ? "— CHANGE YER MIND? —" : "— hands up, powder dry —"}
      </Box>
    </Box>
  );
}
