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

// Card name as line(s). QUICKDRAW breaks onto two lines so the long word
// doesn't squeeze the small card or shrink the letter-spacing.
const NAME_LINES: Record<BulletCard, string[]> = {
  clic: ["CLICK"],
  bang: ["SHOT"],
  bang_bang_bang: ["QUICK", "DRAW"],
};

export function PowderCard({ load, selected, spent, onClick, "data-testid": testid }: PowderCardProps) {
  const handle = () => {
    if (spent) return;
    onClick?.();
  };

  return (
    <Box
      role={spent ? undefined : "button"}
      tabIndex={spent ? -1 : 0}
      data-testid={testid}
      data-load={load}
      data-selected={selected && !spent ? "true" : "false"}
      data-spent={spent ? "true" : "false"}
      onClick={spent ? undefined : handle}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (spent) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handle();
        }
      }}
      sx={{
        position: "relative",
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
        cursor: spent ? "default" : "pointer",
        transform: !spent && selected ? "translateY(-3px)" : "none",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        "&:focus-visible": {
          outline: `2px solid ${palette.paper}`,
          outlineOffset: "2px",
        },
      }}
    >
      {/* Card face — kept underneath the spent X overlay so the player can
          still see which round they used each card in. */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem",
          opacity: 1,
        }}
      >
        <BulletStack load={load} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.62rem",
          letterSpacing: "0.22em",
          lineHeight: 1.15,
          paddingBottom: "0.45rem",
          color: palette.paper,
          opacity: 1,
        }}
      >
        {NAME_LINES[load].map(line => (
          <Box key={line}>{line}</Box>
        ))}
      </Box>
      {/* Spent overlay — big red X struck across the card face. The face
          stays visible (dimmed) underneath so the player can read which
          round they used the card in without opening a history pane. */}
      {spent && (
        <Box
          component="svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          data-spent-x
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <line x1="14" y1="14" x2="86" y2="86" stroke={palette.blood} strokeWidth="3.5" strokeLinecap="round" opacity={0.95} />
          <line x1="86" y1="14" x2="14" y2="86" stroke={palette.blood} strokeWidth="3.5" strokeLinecap="round" opacity={0.95} />
        </Box>
      )}
    </Box>
  );
}

// Centre glyph for each load. CLICK is a typographic em-dash (the round
// that wasn't), SHOT is one target reticle (one hit), QUICKDRAW is a
// lightning bolt — single dramatic mark for the round's biggest threat.
function BulletStack({ load }: { load: BulletCard }) {
  if (load === "clic") return <Dash />;
  if (load === "bang_bang_bang") return <Bolt />;
  return <Reticle />;
}

// Target reticle — paper-stroked circle with horizontal + vertical crosshair
// lines, mirroring the AimBarrel sights. Includes a centre bullet hole
// (the round that landed).
function Reticle() {
  return (
    <Box
      component="svg"
      viewBox="0 0 20 20"
      width={26}
      height={26}
      data-glyph="reticle"
      aria-hidden="true"
      sx={{ display: "block", overflow: "visible" }}
    >
      <circle cx="10" cy="10" r="8" fill="none" stroke={palette.paper} strokeWidth={1.5} />
      <line x1="0.5" y1="10" x2="19.5" y2="10" stroke={palette.paper} strokeWidth={1.1} opacity={0.85} />
      <line x1="10" y1="0.5" x2="10" y2="19.5" stroke={palette.paper} strokeWidth={1.1} opacity={0.85} />
      <circle cx="10" cy="10" r="2.2" fill={palette.paper} />
    </Box>
  );
}

// Lightning bolt — paper-filled zigzag with two inner notches at the centre
// horizontal. The single big glyph for QUICKDRAW reads as "one decisive
// surge" instead of trying to count three reticles.
function Bolt() {
  return (
    <Box
      component="svg"
      viewBox="0 0 20 28"
      width={26}
      height={36}
      data-glyph="bolt"
      aria-hidden="true"
      sx={{ display: "block", overflow: "visible" }}
    >
      <path
        d="M 13 0 L 3 14 L 9 14 L 7 28 L 17 14 L 11 14 Z"
        fill={palette.paper}
      />
    </Box>
  );
}

// Em-dash — the round that wasn't. Plain typographic glyph at low opacity
// keeps the empty chamber's visual weight light against the SHOT reticle.
function Dash() {
  return (
    <Box
      data-glyph="dash"
      aria-hidden="true"
      sx={{
        fontFamily: fonts.body,
        fontSize: "1.6rem",
        lineHeight: 1,
        color: palette.paper,
        opacity: 0.5,
      }}
    >
      —
    </Box>
  );
}
