import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
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
        gridTemplateColumns: "64px 56px 1fr auto auto",
        gap: "1.2rem",
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
      <Box
        sx={{
          width: 48,
          height: 48,
          border: `2px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={jollyRogerForColor(player.colorOrAvatar)} size={34} />
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
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          color: palette.paperDim,
          whiteSpace: "nowrap",
        }}
      >
        {dead ? (
          t("reckoning.forfeit")
        ) : (
          <>
            ${cash.toLocaleString()}
            {player.shame > 0 && (
              <Box component="span" sx={{ color: palette.blood, paddingLeft: "0.4em" }}>
                {t(player.shame === 1 ? "reckoning.rankShame" : "reckoning.rankShames", {
                  amount: penalty.toLocaleString(),
                  n: toRoman(player.shame),
                })}
              </Box>
            )}
          </>
        )}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.25rem",
          letterSpacing: "0.06em",
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
