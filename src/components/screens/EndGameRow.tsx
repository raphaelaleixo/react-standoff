import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import type { Player } from "../../game/types";
import { cashTotal, shamePenalty, netScore } from "../../lib/score";
import { toRoman } from "../../lib/navyHours";
import { slideUpIn } from "../../theme/animations";

interface EndGameRowProps {
  rank: number;
  player: Player;
  /** Round number when this player walked the plank, or null if they survived. */
  eliminatedRound: number | null;
  /** Stagger delay for the entrance animation (ms). 0 = animates immediately. */
  enterDelayMs?: number;
}

// Each piece of info gets its own grid column so values line up across rows
// like a proper ledger. Widths are fixed where the content is bounded
// (rank, chip, pips, money strings) so vertical alignment holds even when
// cash totals shrink or shame counts vary; the name column is the only
// flex 1fr.
const GRID_COLUMNS = "44px 60px 1fr 52px 80px 110px 110px 130px";

export function EndGameRow({ rank, player, eliminatedRound, enterDelayMs = 0 }: EndGameRowProps) {
  const { t } = useTranslation();
  const dead = player.status === "dead";
  const cash = cashTotal(player);
  const penalty = shamePenalty(player);
  const score = dead ? null : netScore(player);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        gap: "1rem",
        alignItems: "center",
        padding: "0.5rem 0",
        borderBottom: `1px solid ${palette.rule}`,
        // The slide-up animation fades opacity 0 → 1; dead-row dim has to
        // ride on top of that without being overridden by the animation's
        // final keyframe, so we use filter:opacity instead of plain opacity.
        // animation-fill-mode `both` pins the row at the "from" state during
        // the stagger delay so unannounced ranks don't flash visible.
        animation: `${slideUpIn} 400ms ease-out ${enterDelayMs}ms both`,
        filter: dead ? "opacity(0.55)" : undefined,
      }}
    >
      {/* Rank */}
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
      {/* Flag chip */}
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
      {/* Name (+ optional planked-round suffix) */}
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
      {/* Wounds */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <WoundPips count={player.wounds} />
      </Box>
      {/* Shame */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <ShamePips count={player.shame} />
      </Box>
      {/* Cash */}
      <MoneyCell value={dead ? null : `$${cash.toLocaleString()}`} color={palette.paper} />
      {/* Shame penalty (negative) */}
      <MoneyCell
        value={dead || player.shame === 0 ? null : `− $${penalty.toLocaleString()}`}
        color={palette.blood}
      />
      {/* Net score / DEAD */}
      <Box
        sx={{
          fontFamily: dead ? fonts.displayCaps : fonts.blackletter,
          fontFeatureSettings: dead ? '"smcp"' : undefined,
          fontWeight: dead ? undefined : 700,
          fontSize: "1.4rem",
          letterSpacing: dead ? "0.06em" : undefined,
          color: dead ? palette.blood : palette.paper,
          fontStyle: dead ? "italic" : "normal",
          textAlign: "right",
        }}
      >
        {dead ? t("reckoning.dead") : `$${score!.toLocaleString()}`}
      </Box>
    </Box>
  );
}

// Money column cell — blackletter bold for non-null values, em-dash placeholder
// when the column doesn't apply to this row (dead player, or no shame penalty).
function MoneyCell({ value, color }: { value: string | null; color: string }) {
  if (value == null) {
    return (
      <Box sx={{ textAlign: "right", color: palette.paperFaint, fontFamily: fonts.body, fontStyle: "italic" }}>
        —
      </Box>
    );
  }
  return (
    <Box
      sx={{
        textAlign: "right",
        fontFamily: fonts.blackletter,
        fontWeight: 700,
        fontSize: "1.1rem",
        color,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </Box>
  );
}
