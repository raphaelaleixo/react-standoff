import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { FullscreenButton } from "../shell/FullscreenButton";
import { Button } from "../shell/Button";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { EndGameRow } from "./EndGameRow";
import { PowerCard } from "../powers/PowerCard";
import { finalScore, rankPlayers } from "../../game/scoring";
import { popIn, fadeIn } from "../../theme/animations";
import type { Game, Player } from "../../game/types";

// Stagger budget for the entrance choreography. Rows announce in reverse —
// last place first — at ROW_STAGGER_MS apart, then a beat of silence, then
// the winner section pops in with maximum flourish, then the foot buttons
// fade in last.
const ROW_STAGGER_MS = 110;
const WINNER_BUFFER_MS = 280;
const WINNER_DURATION_MS = 600;
const BUTTONS_AFTER_WINNER_MS = 350;

interface ReckoningScreenProps {
  game: Game;
  /** Big-screen room id, shown in the Masthead's right slot. */
  roomId: string;
  /** Map of playerId → round number when they were eliminated. Empty if not tracked. */
  eliminatedByRound: Record<string, number>;
  onPlayAgain: () => void;
  onReturn: () => void;
}

export function ReckoningScreen({ game, roomId, eliminatedByRound, onPlayAgain, onReturn }: ReckoningScreenProps) {
  const { t } = useTranslation();
  // Total kills across the voyage drives Davy Jones's Cut (six_feet_under)
  // bonuses inside finalScore + each EndGameRow. `dead` is the terminal status
  // so we can count it directly off the live roster.
  const totalKills = game.players.filter((p) => p.status === "dead").length;
  const ranked = rankPlayers(game.players, totalKills);
  const winner = ranked[0];
  const rest = ranked.slice(1);

  // Reverse-order stagger: the last-place row enters first (delay 0) so the
  // ledger fills bottom-up; second-place lands just before the winner
  // enthronement pops in.
  const rowsTotalMs = rest.length * ROW_STAGGER_MS;
  const winnerDelayMs = rowsTotalMs + WINNER_BUFFER_MS;
  const buttonsDelayMs = winnerDelayMs + WINNER_DURATION_MS + BUTTONS_AFTER_WINNER_MS - 200;

  return (
    <Box sx={{ width: "100vw", height: "100vh" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>{t("shell.room")} <em>{roomId}</em></>}
          right={<FullscreenButton />}
        />

        <Box
          sx={{
            flex: 1,
            padding: "0.6rem 2rem",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <WinnerEnthronement
            winner={winner}
            t={t}
            enterDelayMs={winnerDelayMs}
            durationMs={WINNER_DURATION_MS}
            totalKills={totalKills}
          />

          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto", marginTop: "0.4rem" }}>
            {rest.map((p, i) => (
              <EndGameRow
                key={p.id}
                rank={i + 2}
                player={p}
                eliminatedRound={eliminatedByRound[p.id] ?? null}
                enterDelayMs={(rest.length - 1 - i) * ROW_STAGGER_MS}
                totalKills={totalKills}
              />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            padding: "0.7rem 1.5rem 1.6rem",
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            animation: `${fadeIn} 500ms ease-out ${buttonsDelayMs}ms both`,
          }}
        >
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

function WinnerEnthronement({
  winner,
  t,
  enterDelayMs,
  durationMs,
  totalKills,
}: {
  winner: Player;
  t: (k: string, p?: Record<string, unknown>) => string;
  enterDelayMs: number;
  durationMs: number;
  totalKills: number;
}) {
  const winnerDead = winner.status !== "alive";
  const score = finalScore(winner, totalKills);
  const titleColor = winnerDead ? palette.paperDim : palette.paper;
  // Sub-stagger inside the winner block: the eyebrow leads, the medallion
  // pops in with the most flourish, and the cry tags out at the end.
  const eyebrowDelayMs = enterDelayMs;
  const medallionDelayMs = enterDelayMs + 180;
  const cryDelayMs = enterDelayMs + durationMs - 100;
  return (
    <Box
      sx={{
        textAlign: "center",
        padding: "0.8rem 0 0.6rem",
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
          animation: `${fadeIn} 400ms ease-out ${eyebrowDelayMs}ms both`,
        }}
      >
        {t("reckoning.winnerEyebrow")}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          marginTop: "0.5rem",
          animation: `${popIn} ${durationMs}ms cubic-bezier(.2,.7,.2,1.4) ${medallionDelayMs}ms both`,
        }}
      >
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
          {winner.effects.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "0.6rem",
                animation: `${fadeIn} 500ms ease-out ${medallionDelayMs + 160}ms both`,
              }}
            >
              {winner.effects.map((e) => (
                <PowerCard key={e.kind} kind={e.kind} variant="faceUp" size="sm" />
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: palette.blood,
          marginTop: "0.5rem",
          animation: `${fadeIn} 500ms ease-out ${cryDelayMs}ms both`,
        }}
      >
        {t("reckoning.winnerCry")}
      </Box>
    </Box>
  );
}
