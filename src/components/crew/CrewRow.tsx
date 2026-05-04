import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { DenominationIcon } from "../icons/DenominationIcon";
import type { Player } from "../../game/types";

export type CrewStatus =
  | "choosing" | "ready" | "aiming" | "yielded"
  | "struck" | "dead" | "out";

const STATUS_LABEL: Record<CrewStatus, string> = {
  choosing: "CHOOSING",
  ready: "READY",
  aiming: "AIMING",
  yielded: "YIELDED",
  struck: "STRUCK",
  dead: "DEAD",
  out: "OUT",
};

interface CrewRowProps {
  player: Player;
  flagName: string;
  status: CrewStatus;
  freshWoundIndex?: number; // index of the just-applied wound (0..2) for pulse
  "data-testid"?: string;
}

export function CrewRow({ player, flagName, status, freshWoundIndex, "data-testid": testid }: CrewRowProps) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const dead = player.status === "dead" || status === "dead";
  const struck = status === "struck";
  return (
    <Box
      data-testid={testid}
      sx={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        gap: "0.4rem",
        padding: "0.32rem 0.15rem",
        borderBottom: `1px solid ${palette.rule}`,
        alignItems: "center",
        background: struck ? "rgba(201, 58, 48, 0.14)" : "transparent",
        opacity: dead ? 0.4 : 1,
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          border: `1.5px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={player.colorOrAvatar} size={20} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.6rem", letterSpacing: "0.14em", textDecoration: dead ? "line-through" : "none" }}>
          {flagName}
          <Box component="span" sx={{ fontFamily: fonts.body, fontStyle: "italic", letterSpacing: "0.02em", color: palette.paperDim, paddingLeft: "0.4em", fontSize: "0.58rem" }}>
            {player.displayName}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: "0.18rem", alignItems: "center", marginTop: "0.18rem", flexWrap: "wrap" }}>
          {cash === 0 ? (
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.55rem", color: palette.paperFaint }}>
              — empty pockets —
            </Box>
          ) : (
            <>
              {player.cash.map((n, i) => (
                <DenominationIcon key={i} value={n.value} size={13} />
              ))}
              <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.62rem", color: palette.paper, marginLeft: "0.3rem" }}>
                ${(cash / 1000).toFixed(0)}k
              </Box>
            </>
          )}
          {player.shame > 0 && (
            <Box sx={{ fontFamily: fonts.displayCaps, fontSize: "0.5rem", letterSpacing: "0.1em", background: palette.yellow, color: palette.ink, padding: "0 0.3rem", marginLeft: "0.3rem" }}>
              YELLOW ×{player.shame}
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.18rem", alignItems: "flex-end" }}>
        <StatusPill status={status} label={STATUS_LABEL[status]} />
        <Box sx={{ display: "flex", gap: "2px" }}>
          {[0, 1, 2].map(i => {
            const filled = i < player.wounds;
            const fresh = filled && freshWoundIndex === i;
            return (
              <Box
                key={i}
                data-pip={filled ? "filled" : "empty"}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: filled ? palette.blood : "transparent",
                  border: filled ? "none" : `1px solid ${palette.paper}`,
                  boxShadow: fresh ? `0 0 0 2px rgba(201,58,48,0.4)` : (filled ? "0 0 4px rgba(201,58,48,0.6)" : "none"),
                  animation: fresh ? "freshWound 0.7s ease-in-out 1" : undefined,
                  "@keyframes freshWound": {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.3)" },
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

function StatusPill({ status, label }: { status: CrewStatus; label: string }) {
  const isAim = status === "aiming";
  const isReady = status === "ready";
  const isYielded = status === "yielded";
  const isStruck = status === "struck";
  const isDead = status === "dead";
  return (
    <Box
      sx={{
        fontFamily: fonts.displayCaps,
        fontSize: "0.5rem",
        letterSpacing: "0.2em",
        padding: "0.12rem 0.35rem",
        whiteSpace: "nowrap",
        border: `1.5px ${isYielded ? "dashed" : "solid"} ${isYielded ? palette.paperDim : palette.paper}`,
        background: isAim ? palette.paper : isReady ? palette.gold : isStruck ? palette.blood : "transparent",
        color: isAim || isReady ? palette.ink : isStruck ? palette.paper : isYielded ? palette.paperDim : palette.paper,
        opacity: isDead ? 0.6 : 1,
      }}
    >
      {label}
    </Box>
  );
}
