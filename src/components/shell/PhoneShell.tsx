import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "./PageCanvas";
import { FlagFor, jollyRogerForColor } from "../flags";
import { WoundPips } from "../marks/PlayerMarks";
import { toRoman } from "../../lib/navyHours";
import type { Player } from "../../game/types";
import { cashTotal } from "../../lib/score";

interface PhoneShellProps {
  me: Player;
  /** Round number for the header strip. */
  round: number;
  /** Phase label shown next to the round (e.g. "LOAD & AIM", "STANDOFF"). */
  phaseLabel: string;
  children: React.ReactNode;
}

// Phone-shaped page canvas with a player header strip + round/phase strip.
// Header layout mirrors the in-game CrewRow: per-color jolly roger chip,
// displayName as the prominent label, cash + wound pips on the right. No
// pirate flag-name — we settled on a single name per player.
export function PhoneShell({ me, round, phaseLabel, children }: PhoneShellProps) {
  const { t } = useTranslation();
  const cash = cashTotal(me);
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        padding: "8px",
        boxSizing: "border-box",
        // Cap the canvas at phone-width on larger screens so the layout stays
        // thumb-sized regardless of where it's rendered (mock page on desktop,
        // player view on a tablet, etc.).
        display: "flex",
        justifyContent: "center",
      }}
    >
      <PageCanvas
        borderRadius={28}
        sx={{ width: "100%", maxWidth: "440px", height: "100%" }}
      >
        {/* Header strip — flag chip + name on the left, cash + wounds on the right. */}
        <Box
          sx={{
            borderBottom: `3px double ${palette.ruleStrong}`,
            padding: "0.65rem 0.85rem 0.55rem",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: "0.65rem",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 30,
              border: `2px solid ${palette.paper}`,
              background: flagColor(me.colorOrAvatar),
              color: palette.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlagFor id={jollyRogerForColor(me.colorOrAvatar)} size={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.95rem",
                letterSpacing: "0.16em",
                lineHeight: 1,
                color: palette.paper,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {me.displayName}
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.18rem" }}>
            <Box
              sx={{
                fontFamily: fonts.blackletter,
                fontWeight: 700,
                fontSize: "1.05rem",
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
                fontSize: "0.62rem",
                letterSpacing: "0.04em",
                color: palette.paperDim,
              }}
            >
              <WoundPips count={me.wounds} size={9} />
              <Box component="span">{t("player.header.wounds", { n: toRoman(me.wounds) })}</Box>
            </Box>
          </Box>
        </Box>

        {/* Round + phase strip. */}
        <Box
          sx={{
            textAlign: "center",
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            padding: "0.4rem 0",
            borderBottom: `1px solid ${palette.ruleStrong}`,
            color: palette.paperDim,
            flexShrink: 0,
          }}
        >
          {t("shell.round")}{" "}
          <Box
            component="em"
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              letterSpacing: "0.04em",
              paddingLeft: "0.35em",
              color: palette.blood,
            }}
          >
            {t("shell.ofTotal", { n: toRoman(round) })}
          </Box>
          <Box component="span" sx={{ padding: "0 0.6em", color: palette.rule }}>
            ·
          </Box>
          <Box component="span" sx={{ color: palette.paper }}>
            {phaseLabel}
          </Box>
        </Box>

        {/* Body. */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </Box>
      </PageCanvas>
    </Box>
  );
}
