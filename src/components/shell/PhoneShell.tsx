import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "./PageCanvas";
import { PhoneHeader } from "./PhoneHeader";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { toRoman } from "../../lib/navyHours";
import type { Player } from "../../game/types";
import { cashTotal } from "../../lib/score";

interface PhoneShellProps {
  me: Player;
  /** Room code for the header. */
  roomId: string;
  children: React.ReactNode;
}

// Phone-shaped page canvas. PhoneHeader at top (skull + ROOM code + chosen
// flag tile), the phase body in the middle, and a footer strip showing
// cash, wounds, and shame markers — the stash bookkeeping that used to sit
// inline with the header.
export function PhoneShell({ me, roomId, children }: PhoneShellProps) {
  const { t } = useTranslation();
  const cash = cashTotal(me);
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100dvh",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <PageCanvas
        borderRadius={28}
        sx={{ width: "100%", maxWidth: "440px", height: "100%" }}
      >
        <PhoneHeader roomId={roomId} flagId={me.colorOrAvatar} />

        {/* Body. */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </Box>

        {/* Footer — stash, wounds, shame. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "0.85rem",
            padding: "0.7rem 0.95rem 0.8rem",
            borderTop: `1px solid ${palette.rule}`,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "1.25rem",
              lineHeight: 1,
              color: cash > 0 ? palette.paper : palette.paperDim,
            }}
          >
            ${cash.toLocaleString()}
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              color: palette.paperDim,
              justifySelf: "center",
            }}
          >
            <WoundPips count={me.wounds} size={10} />
            <Box component="span">{t("player.header.wounds", { n: toRoman(me.wounds) })}</Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            {me.shame > 0 && <ShamePips count={me.shame} size={10} />}
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}
