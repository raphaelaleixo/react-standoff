import { Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { POWER_REGISTRY } from "./registry";

interface Props {
  kind: PowerKind;
  size?: number;
}

export function PowerBadge({ kind, size = 28 }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  return (
    <Tooltip title={t(def.nameKey)}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Pirata One', serif",
          fontSize: size * 0.5,
        }}
      >
        ⚓
      </Box>
    </Tooltip>
  );
}
