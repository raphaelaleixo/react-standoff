import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { POWER_REGISTRY } from "./registry";
import { POWER_ICONS } from "./icons";

export type PowerCardVariant = "faceDown" | "revealing" | "faceUp" | "used";

interface Props {
  kind: PowerKind;
  variant?: PowerCardVariant;
  size?: "sm" | "md" | "lg";
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

export function PowerCard({ kind, variant = "faceUp", size = "md" }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  const dims = SIZES[size];
  const faceDown = variant === "faceDown";
  const used = variant === "used";
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
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-18deg)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: fonts.displayCaps,
              fontSize: dims.width * 0.18,
              letterSpacing: "0.3em",
              color: palette.blood,
              border: `3px solid ${palette.blood}`,
              padding: "0.12em 0.35em",
              textTransform: "uppercase",
            }}
          >
            {t("powers.used")}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
