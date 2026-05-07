import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import type { Player } from "../../game/types";
import { durations, popIn } from "../../theme/animations";
import { useTickingNumber } from "../../hooks/useTickingNumber";

const POP_TIMING = `${durations.base}ms cubic-bezier(.2,.7,.2,1.4) both`;
const CASH_TICK_DURATION_MS = 700;

export type CrewStatus =
  | "choosing" | "ready" | "yielded"
  | "struck" | "dead";

const STATUS_LABEL: Record<CrewStatus, string> = {
  choosing: "CHOOSING",
  ready: "READY",
  yielded: "YIELDED",
  struck: "STRUCK",
  dead: "DEAD",
};

interface CrewRowProps {
  player: Player;
  status?: CrewStatus;
  freshWoundIndex?: number; // index of the just-applied wound (0..2) for pulse
  "data-testid"?: string;
}

export function CrewRow({ player, status, freshWoundIndex, "data-testid": testid }: CrewRowProps) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const tickingCash = useTickingNumber(cash, CASH_TICK_DURATION_MS);
  const dead = player.status === "dead" || status === "dead";
  const struck = status === "struck";
  const yielded = status === "yielded";
  return (
    <Box
      data-testid={testid}
      sx={{
        display: "grid",
        gridTemplateColumns: "52px 1fr auto",
        gap: "0.85rem",
        padding: "0.45rem 0.2rem",
        alignItems: "center",
        background: struck
          ? "rgba(201, 58, 48, 0.14)"
          : yielded
            ? "rgba(230, 196, 64, 0.10)"
            : "transparent",
        opacity: dead ? 0.4 : 1,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 36,
          border: `1.5px solid ${palette.paper}`,
          background: palette.inkUp,
          color: flagColor(player.colorOrAvatar),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={jollyRogerForColor(player.colorOrAvatar)} size={24} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontFamily: fonts.body, fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.1, letterSpacing: "0.02em", color: `color-mix(in srgb, ${flagColor(player.colorOrAvatar)} 60%, ${palette.paperDim})`, textDecoration: dead ? "line-through" : "none" }}>
          {player.displayName}
        </Box>
        <Box sx={{ display: "flex", gap: "0.22rem", alignItems: "center", marginTop: "0.15rem", flexWrap: "wrap" }}>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "1.15rem",
              // Gold while the value is climbing, then settle back to paper.
              color: cash === 0
                ? palette.paperDim
                : tickingCash !== cash
                  ? palette.gold
                  : palette.paper,
              lineHeight: 1,
              // Scale up while the value is interpolating, then ease back
              // to 1 when it settles. Origin keeps the chip anchored to
              // its row's left edge instead of drifting.
              transformOrigin: "left center",
              transform: tickingCash !== cash ? "scale(1.35)" : "scale(1)",
              transition: `transform ${durations.base}ms cubic-bezier(.2,.7,.2,1.4), color ${durations.base}ms ease`,
            }}
          >
            ${(tickingCash / 1000).toFixed(0)}k
          </Box>
          {player.shame > 0 && (
            <Box sx={{ marginLeft: "0.5rem", marginTop: "3px" }}>
              <ShamePips count={player.shame} animateNew />
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.18rem", alignItems: "flex-end" }}>
        <StatusPill status={status} label={status ? STATUS_LABEL[status] : ""} />
        <WoundPips count={player.wounds} freshIndex={freshWoundIndex} />
      </Box>
    </Box>
  );
}

const STATUS_COLOR: Record<CrewStatus, string> = {
  choosing: palette.paper,    // active — waiting on this player
  ready: palette.gold,
  yielded: palette.paperDim,  // passive — out of this round
  struck: palette.blood,
  dead: palette.paperDim,
};

function StatusPill({ status, label }: { status?: CrewStatus; label: string }) {
  return (
    <Box
      data-status={status ?? "none"}
      // Remount on every status change so popIn re-triggers and the new
      // label arrives with a beat instead of a cross-fade.
      key={status ?? "none"}
      sx={{
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.85rem",
        letterSpacing: "0.2em",
        whiteSpace: "nowrap",
        color: status ? STATUS_COLOR[status] : "transparent",
        animation: status ? `${popIn} ${POP_TIMING}` : undefined,
      }}
    >
      {label || " "}
    </Box>
  );
}
