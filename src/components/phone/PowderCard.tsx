import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { BulletCard } from "../../game/types";

interface PowderCardProps {
  load: BulletCard;
  /** Selected = lifted + blood background; the player's currently chosen card. */
  selected?: boolean;
  /** Spent = face-down skull back; cannot be tapped. */
  spent?: boolean;
  onClick?: () => void;
  "data-testid"?: string;
}

const NAMES: Record<BulletCard, string> = {
  clic: "CLICK",
  bang: "SHOT",
  bang_bang_bang: "QUICKDRAW",
};

export function PowderCard({ load, selected, spent, onClick, "data-testid": testid }: PowderCardProps) {
  if (spent) {
    return (
      <Box
        data-testid={testid}
        data-spent="true"
        sx={{
          aspectRatio: "2 / 3",
          background: palette.inkDeep,
          border: `1.5px solid ${palette.paperFaint}`,
          color: palette.paperDim,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.25rem",
        }}
      >
        <Box sx={{ fontSize: "1.4rem", lineHeight: 1 }}>☠</Box>
        <Box sx={{ width: "50%", borderTop: `1px solid ${palette.paperDim}`, opacity: 0.5 }} />
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.5rem",
            letterSpacing: "0.22em",
            opacity: 0.6,
          }}
        >
          SPENT
        </Box>
      </Box>
    );
  }

  const handle = () => {
    if (spent) return;
    onClick?.();
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      data-testid={testid}
      data-load={load}
      data-selected={selected ? "true" : "false"}
      onClick={handle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle();
        }
      }}
      sx={{
        aspectRatio: "2 / 3",
        background: selected ? palette.blood : palette.inkUp,
        color: palette.paper,
        border: `1.5px solid ${palette.paper}`,
        boxShadow: selected
          ? `3px 3px 0 ${palette.inkDeep}, inset 0 0 0 2px ${palette.paper}`
          : `2px 2px 0 ${palette.inkDeep}`,
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        cursor: "pointer",
        transform: selected ? "translateY(-3px)" : "none",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        "&:focus-visible": {
          outline: `2px solid ${palette.paper}`,
          outlineOffset: "2px",
        },
      }}
    >
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
        <BulletStack load={load} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.62rem",
          letterSpacing: "0.22em",
          paddingBottom: "0.45rem",
          color: palette.paper,
        }}
      >
        {NAMES[load]}
      </Box>
    </Box>
  );
}

// Vertical stack of bullet pips at the centre of the card. The pip count maps
// directly to the load: CLICK is one hollow circle (empty chamber, hammer-
// snap, no shot), SHOT is one filled circle (one round chambered), QUICKDRAW
// is three filled circles (triple-loaded).
function BulletStack({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <BulletPip filled={false} />
      </Box>
    );
  }
  const count = load === "bang_bang_bang" ? 3 : 1;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <BulletPip key={i} filled />
      ))}
    </Box>
  );
}

function BulletPip({ filled }: { filled: boolean }) {
  return (
    <Box
      data-bullet-pip={filled ? "filled" : "hollow"}
      sx={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: filled ? palette.paper : "transparent",
        border: filled ? "none" : `2px solid ${palette.paper}`,
        opacity: filled ? 1 : 0.65,
        boxShadow: filled ? `inset -1px -1px 0 rgba(0,0,0,0.25)` : "none",
      }}
    />
  );
}
