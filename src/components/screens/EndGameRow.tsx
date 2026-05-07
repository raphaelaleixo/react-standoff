import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import type { Player } from "../../game/types";
import { cashTotal, shamePenalty, netScore } from "../../lib/score";
import { toRoman } from "../../lib/navyHours";

interface EndGameRowProps {
  rank: number;
  player: Player;
  /** Round number when this player walked the plank, or null if they survived. */
  eliminatedRound: number | null;
}

export function EndGameRow({ rank, player, eliminatedRound }: EndGameRowProps) {
  const { t } = useTranslation();
  const dead = player.status === "dead";
  const cash = cashTotal(player);
  const penalty = shamePenalty(player);
  const score = dead ? null : netScore(player);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "44px 60px 1fr auto auto auto",
        gap: "1rem",
        alignItems: "center",
        padding: "0.5rem 0",
        borderBottom: `1px solid ${palette.rule}`,
        opacity: dead ? 0.55 : 1,
      }}
    >
      <Box
        sx={{
          textAlign: "right",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.5rem",
          letterSpacing: "0.04em",
          color: palette.paperDim,
        }}
      >
        {toRoman(rank)}
      </Box>
      {/* Flag chip — flag aspect, matches CrewRow's pattern. */}
      <Box
        sx={{
          width: 60,
          height: 40,
          border: `2px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={jollyRogerForColor(player.colorOrAvatar)} size={28} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "1rem",
            letterSpacing: "0.16em",
            color: palette.paper,
          }}
        >
          {player.displayName}
          {eliminatedRound != null && (
            <Box
              component="span"
              sx={{
                fontFamily: fonts.body,
                fontStyle: "italic",
                letterSpacing: "0.04em",
                color: palette.paperDim,
                paddingLeft: "0.6em",
                fontSize: "0.9rem",
              }}
            >
              · {t("reckoning.plankedRound", { round: eliminatedRound })}
            </Box>
          )}
        </Box>
      </Box>
      {/* Wound + shame pips — visceral count, mirrors the in-game CrewRow. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-end" }}>
        <WoundPips count={player.wounds} />
        <ShamePips count={player.shame} />
      </Box>
      {/* Cash − penalty breakdown. Dollar amounts in blackletter, separator in
          italic body — same money treatment as the crew column's cash chip. */}
      <Box sx={{ whiteSpace: "nowrap", display: "flex", alignItems: "baseline", gap: "0.4em" }}>
        {dead ? (
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", color: palette.paperDim }}>
            {t("reckoning.forfeit")}
          </Box>
        ) : (
          <>
            <Box sx={{ fontFamily: fonts.blackletter, fontWeight: 700, fontSize: "1.1rem", color: palette.paper }}>
              ${cash.toLocaleString()}
            </Box>
            {player.shame > 0 && (
              <>
                <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", color: palette.paperDim }}>−</Box>
                <Box sx={{ fontFamily: fonts.blackletter, fontWeight: 700, fontSize: "1.1rem", color: palette.blood }}>
                  ${penalty.toLocaleString()}
                </Box>
              </>
            )}
          </>
        )}
      </Box>
      <Box
        sx={{
          fontFamily: dead ? fonts.displayCaps : fonts.blackletter,
          fontFeatureSettings: dead ? '"smcp"' : undefined,
          fontWeight: dead ? undefined : 700,
          fontSize: "1.4rem",
          letterSpacing: dead ? "0.06em" : undefined,
          color: dead ? palette.blood : palette.paper,
          fontStyle: dead ? "italic" : "normal",
          minWidth: "5em",
          textAlign: "right",
        }}
      >
        {dead ? t("reckoning.dead") : `$${score!.toLocaleString()}`}
      </Box>
    </Box>
  );
}
