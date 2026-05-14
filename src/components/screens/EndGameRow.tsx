import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { PowerBadge } from "../powers/PowerBadge";
import { Crown } from "./icons/Crown";
import type { Player } from "../../game/types";
import { cashTotal } from "../../lib/score";
import { finalScore, hasEffect } from "../../game/scoring";
import { toRoman } from "../../lib/navyHours";
import { slideUpIn } from "../../theme/animations";

interface EndGameRowProps {
  rank: number;
  player: Player;
  /** Round number when this player walked the plank, or null if they survived. */
  eliminatedRound: number | null;
  /** Stagger delay for the entrance animation (ms). 0 = animates immediately. */
  enterDelayMs?: number;
  /**
   * Number of crew killed across the voyage. Drives Davy Jones's Cut
   * (six_feet_under) bonus rendering and is folded into `finalScore`. Defaults
   * to 0 so the base-game callsite doesn't have to thread it.
   */
  totalKills?: number;
  /** Cop variant: when true, the row gets a small "PRIVATEER" tag pinned to
   *  the flag chip so the role identity is always visible regardless of rank. */
  isPrivateer?: boolean;
}

// One grid column per ledger field so columns line up across rows. The Undertaker
// (six_feet_under) bonus has its own column so the base-game layout is unchanged
// when it doesn't render. The shame column flips sign when super_coward is held —
// same column, same width, just "+" in success.main instead of "− " in blood.
// Held-power badges aren't in the grid: they're absolutely positioned over the
// flag chip so they never push the other columns around.
const GRID_COLUMNS = "44px 60px 1fr 52px 80px 110px 110px 110px 130px";

export function EndGameRow({ rank, player, eliminatedRound, enterDelayMs = 0, totalKills = 0, isPrivateer = false }: EndGameRowProps) {
  const { t } = useTranslation();
  const dead = player.status === "dead";
  const cash = cashTotal(player);
  const isCoward = hasEffect(player, "super_coward");
  const hasUndertaker = hasEffect(player, "six_feet_under");
  const shameAbs = player.shame.length * 5000;
  const undertakerBonus = totalKills * 10000;
  const score = dead ? null : finalScore(player, totalKills);
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
      {/* Flag chip — held-power badges sit absolute-positioned over the
          top-left corner so they read as "I had this all along" without
          stealing space from the ledger columns. */}
      <Box
        sx={{
          position: "relative",
          width: 60,
          height: 40,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
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
        {player.effects.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -10,
              left: -10,
              display: "flex",
              gap: "0.2rem",
              pointerEvents: "none",
            }}
          >
            {player.effects.map((e) => (
              <PowerBadge key={e.kind} kind={e.kind} size={24} />
            ))}
          </Box>
        )}
        {isPrivateer && (
          <Box
            sx={{
              position: "absolute",
              top: -10,
              left: -10,
              pointerEvents: "none",
            }}
          >
            <Crown size={24} />
          </Box>
        )}
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
      {/* Shame — pass the marker array so flashing-light markers (cop
          variant, post-reinforcements) read distinctly from quiet yellow
          shame. Base-game shame is all `flashing: false`. */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <ShamePips markers={player.shame} />
      </Box>
      {/* Cash */}
      <MoneyCell value={dead ? null : `$${cash.toLocaleString()}`} color={palette.paper} />
      {/* Shame line — sign flips for super_coward (Yellow-Belly's Purse): the
          shame becomes a bonus rather than a penalty. Hidden when shame is 0
          or the player is dead, regardless of variant. */}
      <MoneyCell
        value={dead || player.shame.length === 0 ? null : isCoward ? `+$${shameAbs.toLocaleString()}` : `− $${shameAbs.toLocaleString()}`}
        color={isCoward ? palette.gold : palette.blood}
      />
      {/* Undertaker (six_feet_under) bonus — only renders when the player
          holds Davy Jones's Cut. Column is reserved even when empty so other
          rows line up. */}
      <MoneyCell
        value={hasUndertaker && !dead ? `+$${undertakerBonus.toLocaleString()}` : null}
        color={palette.gold}
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
