import { Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PowerKind } from "../../game/types";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { POWER_REGISTRY } from "./registry";
import { POWER_ICONS } from "./icons";

interface Props {
  kind: PowerKind;
  size?: number;
}

// Small cream-paper coin showing the power's sigil. Lives in the big-screen
// crew rail next to a player's flag once their effect flips `revealed: true`.
// Hover reveals the power's name via the registry's i18n key. Falls back to
// the default ⚓ anchor mark for powers without a registered icon.
export function PowerBadge({ kind, size = 28 }: Props) {
  const { t } = useTranslation();
  const def = POWER_REGISTRY[kind];
  const Icon = POWER_ICONS[kind];
  return (
    <Tooltip title={t(def.nameKey)}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: palette.paper,
          color: palette.ink,
          border: `1.5px solid ${palette.inkDeep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `1px 1px 0 ${palette.inkDeep}`,
          flexShrink: 0,
          ...(Icon ? {} : { fontFamily: fonts.blackletter, fontSize: size * 0.55 }),
        }}
      >
        {Icon ? <Icon size={size * 0.62} /> : "⚓"}
      </Box>
    </Tooltip>
  );
}
