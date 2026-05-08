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

// Vertical stack of tally crosses at the centre of the card. The cross count
// maps directly to the load: CLICK is one faint cross (hammer-snap, no shot
// — the cross is "void"), SHOT is one solid cross (one round notched on the
// gunwale), QUICKDRAW is three solid crosses stacked.
function BulletStack({ load }: { load: BulletCard }) {
  if (load === "clic") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Cross filled={false} />
      </Box>
    );
  }
  const count = load === "bang_bang_bang" ? 3 : 1;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Cross key={i} filled />
      ))}
    </Box>
  );
}

// Tally cross — two strokes crossing at the centre. Filled = paper-colored
// at full opacity. Hollow (CLICK) = same shape, lower opacity, hinting at
// "the mark that wasn't" — the round that didn't fire.
function Cross({ filled }: { filled: boolean }) {
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
      <line
        x1="3"
        y1="3"
        x2="17"
        y2="17"
        stroke={palette.paper}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={filled ? 1 : 0.4}
      />
      <line
        x1="17"
        y1="3"
        x2="3"
        y2="17"
        stroke={palette.paper}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={filled ? 1 : 0.4}
      />
    </Box>
  );
}
