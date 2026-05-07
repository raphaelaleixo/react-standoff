import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { Button } from "../shell/Button";
import { FlagFor, jollyRogerForColor } from "../flags";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { EndGameRow } from "./EndGameRow";
import { netScore } from "../../lib/score";
import { toRoman } from "../../lib/navyHours";
import type { Game, Player } from "../../game/types";

interface ReckoningScreenProps {
  game: Game;
  /** Big-screen room id, shown in the Masthead's right slot. */
  roomId: string;
  /** Map of playerId → round number when they were eliminated. Empty if not tracked. */
  eliminatedByRound: Record<string, number>;
  onPlayAgain: () => void;
  onReturn: () => void;
}

// Dead players sort to the bottom regardless of cash, then by score, then by
// fewer-shame (cleaner mutiny wins ties), then by more-wounds (the bloodied
// underdog over the unscarred).
function compareForRanking(a: Player, b: Player): number {
  const aDead = a.status !== "alive";
  const bDead = b.status !== "alive";
  if (aDead !== bDead) return aDead ? 1 : -1;
  const ds = netScore(b) - netScore(a);
  if (ds !== 0) return ds;
  const dShame = a.shame - b.shame;
  if (dShame !== 0) return dShame;
  return b.wounds - a.wounds;
}

export function ReckoningScreen({ game, roomId, eliminatedByRound, onPlayAgain, onReturn }: ReckoningScreenProps) {
  const { t } = useTranslation();
  const ranked = [...game.players].sort(compareForRanking);
  const winner = ranked[0];
  const rest = ranked.slice(1);

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>{t("shell.round")} <em>{t("shell.ofTotal", { n: toRoman(game.round.number) })}</em></>}
          right={<>{t("shell.room")} <em>{roomId}</em></>}
        />

        <Box
          sx={{
            flex: 1,
            padding: "0.6rem 2rem",
            display: "flex",
            flexDirection: "column",
            borderTop: `4px double ${palette.ruleStrong}`,
            borderBottom: `4px double ${palette.ruleStrong}`,
            minHeight: 0,
          }}
        >
          <WinnerEnthronement winner={winner} t={t} />

          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto", marginTop: "0.4rem" }}>
            {rest.map((p, i) => (
              <EndGameRow
                key={p.id}
                rank={i + 2}
                player={p}
                eliminatedRound={eliminatedByRound[p.id] ?? null}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ padding: "0.7rem 1.5rem 0.8rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <Button variant="primary" onClick={onPlayAgain}>
            {t("reckoning.playAgain").toUpperCase()}
          </Button>
          <Button variant="ghost" onClick={onReturn}>
            {t("reckoning.returnToPort").toUpperCase()}
          </Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}

function WinnerEnthronement({ winner, t }: { winner: Player; t: (k: string, p?: Record<string, unknown>) => string }) {
  const winnerDead = winner.status !== "alive";
  const score = netScore(winner);
  const titleColor = winnerDead ? palette.paperDim : palette.paper;
  return (
    <Box
      sx={{
        textAlign: "center",
        padding: "0.8rem 0 0.6rem",
        borderBottom: `1px solid ${palette.rule}`,
        marginBottom: "0.6rem",
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.6em",
          color: palette.paperDim,
        }}
      >
        {t("reckoning.winnerEyebrow")}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", marginTop: "0.5rem" }}>
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontSize: "5.5rem",
            lineHeight: 0.85,
            color: palette.blood,
            letterSpacing: "0.02em",
          }}
        >
          I
        </Box>
        {/* Flag-aspect medallion — same proportions as the row chips and
            the in-game crew flag, scaled up for the reckoning's prominence. */}
        <Box
          sx={{
            width: 156,
            height: 108,
            border: `4px solid ${palette.paper}`,
            background: flagColor(winner.colorOrAvatar),
            color: palette.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `6px 6px 0 ${palette.inkDeep}`,
          }}
        >
          <FlagFor id={jollyRogerForColor(winner.colorOrAvatar)} size={84} />
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontSize: "3.5rem",
              lineHeight: 0.9,
              color: titleColor,
            }}
          >
            {winner.displayName}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.45rem" }}>
            <WoundPips count={winner.wounds} />
            {winner.shame > 0 && <ShamePips count={winner.shame} />}
          </Box>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "2rem",
              lineHeight: 1,
              marginTop: "0.4rem",
              color: titleColor,
            }}
          >
            ${score.toLocaleString()}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: palette.blood,
          marginTop: "0.5rem",
        }}
      >
        {t("reckoning.winnerCry")}
      </Box>
    </Box>
  );
}
