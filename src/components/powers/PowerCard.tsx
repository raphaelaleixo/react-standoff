import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { POWER_REGISTRY } from "./registry";

export type PowerCardVariant = "faceDown" | "revealing" | "faceUp" | "used";

interface Props {
  kind: PowerKind;
  variant?: PowerCardVariant;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 80, height: 110, titleVariant: "caption" as const, descVariant: "caption" as const, descShown: false },
  md: { width: 200, height: 280, titleVariant: "h6" as const, descVariant: "body2" as const, descShown: true },
  lg: { width: 280, height: 380, titleVariant: "h5" as const, descVariant: "body1" as const, descShown: true },
};

export function PowerCard({ kind, variant = "faceUp", size = "md" }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  const dims = SIZES[size];
  const faceDown = variant === "faceDown";
  const used = variant === "used";

  return (
    <Paper
      elevation={3}
      sx={{
        width: dims.width,
        height: dims.height,
        p: 2,
        bgcolor: faceDown ? "background.paper" : "secondary.light",
        opacity: used ? 0.4 : 1,
        filter: used ? "grayscale(0.8)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: faceDown ? "center" : "space-between",
        transition: "all 0.4s ease",
        position: "relative",
      }}
    >
      {faceDown ? (
        <Typography variant="overline">⚓</Typography>
      ) : (
        <>
          <Typography variant={dims.titleVariant} sx={{ fontFamily: "'Pirata One', serif", textAlign: "center" }}>
            {t(def.nameKey)}
          </Typography>
          {dims.descShown && (
            <Typography variant={dims.descVariant} sx={{ textAlign: "center", opacity: 0.85 }}>
              {t(def.descriptionKey)}
            </Typography>
          )}
          {used && (
            <Box sx={{ position: "absolute", transform: "rotate(-15deg)", bottom: 24 }}>
              <Typography variant="h6" sx={{ color: "error.main" }}>
                {t("powers.used")}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
