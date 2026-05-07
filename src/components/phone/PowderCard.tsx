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

const CORNERS: Record<BulletCard, string> = {
  clic: "×",
  bang: "●",
  bang_bang_bang: "⚡",
};

export function PowderCard({ load, selected, spent, onClick, "data-testid": testid }: PowderCardProps) {
  const isQuickdraw = load === "bang_bang_bang";

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
      data-special={isQuickdraw ? "true" : "false"}
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
        border: `1.5px solid ${isQuickdraw ? palette.gold : palette.paper}`,
        boxShadow: selected
          ? `3px 3px 0 ${palette.inkDeep}, inset 0 0 0 2px ${palette.paper}`
          : isQuickdraw
            ? `2px 2px 0 ${palette.goldDeep}, inset 0 0 0 1.5px ${palette.gold}`
            : `2px 2px 0 ${palette.inkDeep}`,
        position: "relative",
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
      {/* Corner marks — small typographic hint at the load type. */}
      <Box sx={{ position: "absolute", top: 4, left: 6, fontFamily: fonts.displayCaps, fontSize: "0.65rem", lineHeight: 1, opacity: 0.85 }}>
        {CORNERS[load]}
      </Box>
      <Box sx={{ position: "absolute", top: 4, right: 6, fontFamily: fonts.displayCaps, fontSize: "0.65rem", lineHeight: 1, opacity: 0.85 }}>
        {CORNERS[load]}
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.2rem" }}>
        <ChamberSVG load={load} color={palette.paper} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.6rem",
          letterSpacing: "0.22em",
          paddingBottom: "0.35rem",
          color: isQuickdraw && !selected ? palette.gold : "inherit",
        }}
      >
        {NAMES[load]}
      </Box>
    </Box>
  );
}

// Schematic chamber: a horizontal cartridge with bullet markers in the middle.
// Click → diagonal cancel; Shot → single bullet; Quickdraw → triple-loaded.
function ChamberSVG({ load, color }: { load: BulletCard; color: string }) {
  return (
    <svg viewBox="0 0 60 50" width="92%" height="92%" aria-hidden="true">
      <rect x="10" y="15" width="40" height="20" fill="none" stroke={color} strokeWidth="2.2" />
      <rect x="6" y="22" width="6" height="6" fill={color} />
      <rect x="48" y="22" width="6" height="6" fill={color} />
      {load === "clic" && (
        <line x1="14" y1="13" x2="46" y2="37" stroke={palette.blood} strokeWidth="2.2" strokeLinecap="round" />
      )}
      {load === "bang" && <circle cx="30" cy="25" r="5" fill={color} />}
      {load === "bang_bang_bang" && (
        <>
          <circle cx="20" cy="25" r="4.5" fill={color} />
          <circle cx="30" cy="25" r="4.5" fill={color} />
          <circle cx="40" cy="25" r="4.5" fill={color} />
        </>
      )}
    </svg>
  );
}
