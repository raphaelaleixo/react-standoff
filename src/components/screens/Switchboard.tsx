import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  callsMade: 0 | 1 | 2 | 3;
}

// Persistent big-screen widget — 3 card slots, ambient on every round
// the cop variant is active. Empty slots show silhouettes; filled
// slots show the revealed switchboard card art. The 3rd slot is the
// "Sails on the horizon" reveal (animated reveal handled by the
// ReinforcementsOverlay; this widget just stays flipped face-up).
export function Switchboard({ callsMade }: Props) {
  const { t } = useTranslation();
  const slots: ("empty" | "busy" | "sent")[] = [
    callsMade >= 1 ? "busy" : "empty",
    callsMade >= 2 ? "busy" : "empty",
    callsMade >= 3 ? "sent" : "empty",
  ];
  return (
    <Box
      sx={{
        display: "flex",
        gap: "0.6rem",
        padding: "0.6rem 0.9rem",
        background: palette.inkUp,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
      }}
    >
      {slots.map((state, i) => (
        <Box
          key={i}
          sx={{
            width: 56,
            height: 80,
            background: state === "empty" ? "transparent" : palette.paper,
            border: `1.5px ${state === "empty" ? "dashed" : "solid"} ${
              state === "empty" ? palette.paperFaint : palette.paper
            }`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: state === "empty" ? palette.paperFaint : palette.ink,
            fontFamily: fonts.displayCaps,
            fontSize: "0.7rem",
            letterSpacing: "0.16em",
            textAlign: "center",
            padding: "0.3rem",
            transition: "background 240ms ease, border-color 240ms ease, color 240ms ease",
          }}
        >
          {state === "busy" && t("cop.switchboard.busy")}
          {state === "sent" && t("cop.switchboard.reinforcementsSent")}
        </Box>
      ))}
    </Box>
  );
}
