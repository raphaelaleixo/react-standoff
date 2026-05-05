import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
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
  status?: CrewStatus;
  freshWoundIndex?: number; // index of the just-applied wound (0..2) for pulse
  "data-testid"?: string;
}

export function CrewRow({ player, status, freshWoundIndex, "data-testid": testid }: CrewRowProps) {
  const cash = player.cash.reduce((s, n) => s + n.value, 0);
  const dead = player.status === "dead" || status === "dead";
  const struck = status === "struck";
  return (
    <Box
      data-testid={testid}
      sx={{
        display: "grid",
        gridTemplateColumns: "52px 1fr auto",
        gap: "0.85rem",
        padding: "0.45rem 0.2rem",
        alignItems: "center",
        background: struck ? "rgba(201, 58, 48, 0.14)" : "transparent",
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
        <FlagFor id="jolly_roger" size={24} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontFamily: fonts.body, fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.1, letterSpacing: "0.02em", color: `color-mix(in srgb, ${flagColor(player.colorOrAvatar)} 60%, ${palette.paperDim})`, textDecoration: dead ? "line-through" : "none" }}>
          {player.displayName}
        </Box>
        <Box sx={{ display: "flex", gap: "0.22rem", alignItems: "center", marginTop: "0.15rem", flexWrap: "wrap" }}>
          {cash === 0 ? (
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.9rem", color: palette.paperFaint }}>
              — empty pockets —
            </Box>
          ) : (
            <Box sx={{ fontFamily: fonts.blackletter, fontWeight: 700, fontSize: "1.15rem", color: palette.paper, lineHeight: 1 }}>
              ${(cash / 1000).toFixed(0)}k
            </Box>
          )}
          {player.shame > 0 && (
            <Box sx={{ display: "flex", gap: "2px", alignItems: "center", marginLeft: "0.5rem", marginTop: "3px" }}>
              {Array.from({ length: player.shame }).map((_, i) => (
                <Box
                  key={i}
                  data-pip="shame"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: palette.yellow,
                    boxShadow: "0 0 4px rgba(230, 196, 64, 0.55)",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.18rem", alignItems: "flex-end" }}>
        {status && <StatusPill status={status} label={STATUS_LABEL[status]} />}
        <Box sx={{ display: "flex", gap: "3px" }}>
          {[0, 1, 2].map(i => {
            const filled = i < player.wounds;
            const fresh = filled && freshWoundIndex === i;
            return (
              <Box
                key={i}
                data-pip={filled ? "filled" : "empty"}
                sx={{
                  width: 12,
                  height: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: fresh ? "freshWound 0.7s ease-in-out 1" : undefined,
                  "@keyframes freshWound": {
                    "0%, 100%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.3)" },
                  },
                }}
              >
                {filled ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 10 10"
                    style={{
                      filter: fresh
                        ? "drop-shadow(0 0 2px rgba(201,58,48,0.85))"
                        : "drop-shadow(0 0 1.5px rgba(201,58,48,0.55))",
                    }}
                  >
                    <line x1="2" y1="2" x2="8" y2="8" stroke={palette.blood} strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="2" y2="8" stroke={palette.blood} strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid ${palette.paper}`, opacity: 0.55 }} />
                )}
              </Box>
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
  const isOut = status === "out";
  return (
    <Box
      data-status={status}
      sx={{
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.85rem",
        letterSpacing: "0.2em",
        padding: "0.18rem 0.45rem",
        whiteSpace: "nowrap",
        border: `1.5px ${isYielded || isOut ? "dashed" : "solid"} ${isYielded || isOut ? palette.paperDim : palette.paper}`,
        background: isAim ? palette.paper : isReady ? palette.gold : isStruck ? palette.blood : "transparent",
        color: isAim || isReady ? palette.ink : isStruck ? palette.paper : isYielded || isOut ? palette.paperDim : palette.paper,
        opacity: isOut ? 0.55 : 1,
      }}
    >
      {label}
    </Box>
  );
}
