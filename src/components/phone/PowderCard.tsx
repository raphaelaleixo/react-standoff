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

// Vertical stack of target reticles at the centre of the card — echoes the
// AimBarrel sights (circle + crosshair lines) at small scale. CLICK is one
// empty target (no hit), SHOT is one target with a centre bullet hole,
// QUICKDRAW stacks three targets with bullet holes.
function BulletStack({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Reticle filled={false} />
      </Box>
    );
  }
  const count = load === "bang_bang_bang" ? 3 : 1;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Reticle key={i} filled />
      ))}
    </Box>
  );
}

// Target reticle — paper-stroked circle with horizontal + vertical crosshair
// lines, mirroring the AimBarrel sights. Filled adds a centre bullet hole
// (the round that landed); hollow (CLICK) drops the centre and dims the
// strokes so it reads as "an empty sight, no shot".
function Reticle({ filled }: { filled: boolean }) {
  const strokeOpacity = filled ? 1 : 0.5;
  return (
    <Box
      component="svg"
      viewBox="0 0 20 20"
      width={20}
      height={20}
      data-bullet-pip={filled ? "filled" : "hollow"}
      aria-hidden="true"
      sx={{ display: "block", overflow: "visible" }}
    >
      {/* Outer ring */}
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        stroke={palette.paper}
        strokeWidth={1.5}
        opacity={strokeOpacity}
      />
      {/* Horizontal crosshair */}
      <line
        x1="0.5"
        y1="10"
        x2="19.5"
        y2="10"
        stroke={palette.paper}
        strokeWidth={1.1}
        opacity={strokeOpacity * 0.85}
      />
      {/* Vertical crosshair */}
      <line
        x1="10"
        y1="0.5"
        x2="10"
        y2="19.5"
        stroke={palette.paper}
        strokeWidth={1.1}
        opacity={strokeOpacity * 0.85}
      />
      {/* Centre bullet hole — filled only */}
      {filled && <circle cx="10" cy="10" r="2.2" fill={palette.paper} />}
    </Box>
  );
}
