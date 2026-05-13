import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { slashDraw } from "../../theme/animations";
import { POWER_REGISTRY } from "./registry";
import { POWER_ICONS } from "./icons";

export type PowerCardVariant = "faceDown" | "revealing" | "faceUp" | "used";

interface Props {
  kind: PowerKind;
  variant?: PowerCardVariant;
  size?: "sm" | "md" | "lg";
  // Stamp the X-marks USED slashes regardless of variant — used for the
  // face-down corner card so the holder sees their power got consumed
  // without having to flip the card open.
  used?: boolean;
}

const SIZES = {
  sm: {
    width: 88,
    height: 124,
    titleSize: "0.62rem",
    titleLetter: "0.16em",
    titleCaps: true,
    titleWeight: 700,
    descShown: false,
    pad: 1,
  },
  md: {
    width: 220,
    height: 300,
    titleSize: "1.4rem",
    titleLetter: "0.02em",
    titleCaps: false,
    titleWeight: 800,
    descShown: true,
    descSize: "0.82rem",
    pad: 2.5,
  },
  lg: {
    width: 300,
    height: 400,
    titleSize: "1.95rem",
    titleLetter: "0.02em",
    titleCaps: false,
    titleWeight: 800,
    descShown: true,
    descSize: "0.98rem",
    pad: 3,
  },
} as const;

export function PowerCard({ kind, variant = "faceUp", size = "md", used: usedProp }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  const dims = SIZES[size];
  const faceDown = variant === "faceDown";
  const used = variant === "used" || usedProp;
  const revealing = variant === "revealing";

  if (faceDown) {
    // Back of the card — dark with the power's sigil in dim cream. Falls
    // back to the ⚓ anchor mark for powers without a registered icon.
    const Icon = POWER_ICONS[kind];
    const sigilSize = dims.width * 0.4;
    return (
      <Paper
        elevation={3}
        sx={{
          width: dims.width,
          height: dims.height,
          bgcolor: palette.ink,
          color: palette.paper,
          border: `2px solid ${palette.ruleStrong}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.4s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            color: palette.paperDim,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(Icon ? {} : { fontFamily: fonts.blackletter, fontSize: sigilSize }),
          }}
        >
          {Icon ? <Icon size={sigilSize} /> : "⚓"}
        </Box>
        {used && (
          <Box
            component="svg"
            viewBox="-10 -10 120 120"
            aria-hidden="true"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
              "& path": {
                fill: "none",
                stroke: palette.blood,
                strokeWidth: 8,
                strokeLinecap: "round",
                strokeDasharray: 100,
                strokeDashoffset: 100,
                filter: "drop-shadow(0 0 1.2px rgba(201, 58, 48, 0.55))",
              },
              "& path:nth-of-type(1)": {
                animation: `${slashDraw} 360ms cubic-bezier(0.7, 0, 0.3, 1) forwards`,
              },
              "& path:nth-of-type(2)": {
                animation: `${slashDraw} 380ms cubic-bezier(0.7, 0, 0.3, 1) 280ms forwards`,
              },
            }}
          >
            <path d="M 8 14 L 92 88" pathLength={100} />
            <path d="M 94 10 L 6 90" pathLength={100} />
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={revealing ? 12 : 3}
      sx={{
        width: dims.width,
        height: dims.height,
        p: dims.pad,
        bgcolor: palette.paper,
        color: palette.ink,
        border: `2px solid ${palette.inkDeep}`,
        opacity: used ? 0.55 : 1,
        filter: used ? "grayscale(0.7)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "center",
        transition: "all 0.4s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hairline frame, inset from the outer border for the broadside look */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 6,
          border: `1px solid ${palette.paperFaint}`,
          pointerEvents: "none",
        }}
      />

      <Typography
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: dims.titleSize,
          letterSpacing: dims.titleLetter,
          fontWeight: dims.titleWeight,
          textTransform: dims.titleCaps ? "uppercase" : "none",
          color: palette.ink,
          lineHeight: 1.1,
          position: "relative",
          zIndex: 1,
        }}
      >
        {t(def.nameKey)}
      </Typography>

      {/* Centred sigil — bigger on lg/md, hidden on sm where the title eats
          the space. Per-power icon overrides the default anchor when one is
          registered (see ./icons). */}
      {size !== "sm" && (() => {
        const Icon = POWER_ICONS[kind];
        const sigilSize = dims.width * 0.36;
        return (
          <Box
            aria-hidden
            sx={{
              color: palette.inkDeep,
              opacity: 0.22,
              lineHeight: 1,
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...(Icon ? {} : { fontFamily: fonts.blackletter, fontSize: sigilSize }),
            }}
          >
            {Icon ? <Icon size={sigilSize} /> : "⚓"}
          </Box>
        );
      })()}

      {dims.descShown && (
        <Typography
          sx={{
            fontFamily: fonts.body,
            fontSize: "descSize" in dims ? dims.descSize : "0.82rem",
            fontStyle: "italic",
            color: palette.inkDeep,
            lineHeight: 1.35,
            position: "relative",
            zIndex: 1,
          }}
        >
          {t(def.descriptionKey)}
        </Typography>
      )}

      {used && (
        // Two blood-red slashes across the card — same X-marks-the-spot
        // visual the commit-time checkboxes use, scaled to the card. The
        // strokes draw in one at a time (left slash, then right) via the
        // shared slashDraw keyframe. SVG viewBox is over-extended so the
        // strokes peek past the card's edges for the hand-stamped feel.
        <Box
          component="svg"
          viewBox="-10 -10 120 120"
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 2,
            "& path": {
              fill: "none",
              stroke: palette.blood,
              strokeWidth: 8,
              strokeLinecap: "round",
              strokeDasharray: 100,
              strokeDashoffset: 100,
              filter: "drop-shadow(0 0 1.2px rgba(201, 58, 48, 0.55))",
            },
            "& path:nth-of-type(1)": {
              animation: `${slashDraw} 360ms cubic-bezier(0.7, 0, 0.3, 1) forwards`,
            },
            "& path:nth-of-type(2)": {
              animation: `${slashDraw} 380ms cubic-bezier(0.7, 0, 0.3, 1) 280ms forwards`,
            },
          }}
        >
          <path d="M 8 14 L 92 88" pathLength={100} />
          <path d="M 94 10 L 6 90" pathLength={100} />
        </Box>
      )}
    </Paper>
  );
}
