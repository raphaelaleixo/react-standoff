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
// directly to the load: CLICK is one hollow cartridge (empty chamber, hammer-
// snap, no shot), SHOT is one filled cartridge (one round chambered),
// QUICKDRAW is three filled cartridges (triple-loaded).
function BulletStack({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Bullet filled={false} />
      </Box>
    );
  }
  const count = load === "bang_bang_bang" ? 3 : 1;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Bullet key={i} filled />
      ))}
    </Box>
  );
}

// Small cartridge silhouette — rounded top (the projectile tip), straight-
// sided case, slightly wider rim + base at the bottom. A thin divider line
// near the top hints at the case-vs-projectile split for the filled variant.
// The hollow variant uses the same outline but with no fill, low opacity, so
// CLICK reads as "empty chamber" against the filled SHOT / QUICKDRAW pips.
function Bullet({ filled }: { filled: boolean }) {
  const stroke = filled ? "none" : palette.paper;
  const strokeWidth = filled ? 0 : 1.4;
  const fill = filled ? palette.paper : "none";
  const opacity = filled ? 1 : 0.7;
  return (
    <Box
      component="svg"
      viewBox="0 0 14 28"
      width={14}
      height={28}
      data-bullet-pip={filled ? "filled" : "hollow"}
      aria-hidden="true"
      sx={{ display: "block", overflow: "visible" }}
    >
      {/* Cartridge body — rounded shoulder + tip up top, straight case down. */}
      <path
        d="M 7 1.6 C 10.5 1.6, 12.6 4, 12.6 8 L 12.6 22 L 1.4 22 L 1.4 8 C 1.4 4, 3.5 1.6, 7 1.6 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        opacity={opacity}
      />
      {/* Case-shoulder divider — a faint line where the projectile meets the
          brass. Filled-only; hollow's outline already implies the silhouette. */}
      {filled && (
        <line
          x1="2"
          y1="9"
          x2="12"
          y2="9"
          stroke={palette.inkUp}
          strokeWidth={0.7}
          opacity={0.7}
        />
      )}
      {/* Rim — slightly wider than the case, the lip the firing pin catches. */}
      <rect
        x="0"
        y="22"
        width="14"
        height="3.5"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        opacity={opacity}
      />
    </Box>
  );
}
