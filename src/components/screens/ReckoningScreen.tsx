import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useEffect, useState } from "react";
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
import { Lantern } from "./icons/Lantern";
import { PowerBadge } from "../powers/PowerBadge";
import { PowerRevealOverlay } from "../powers/PowerRevealOverlay";
import { finalScore, rankPlayers, gameOutcome, type GameOutcome } from "../../game/scoring";
import { popIn, fadeIn } from "../../theme/animations";
import type { Game, Player, PowerActivation } from "../../game/types";

// Cop-variant reckoning prefix: roles flip → narrated investigation →
// verdict, then the existing ledger choreography kicks in unchanged. Base
// game skips the prefix entirely (prefixStage starts at 'done').
type PrefixStage = 'roles' | 'investigation' | 'verdict' | 'done';
const PREFIX_ROLES_MS = 2200;
const PREFIX_INVESTIGATION_MS = 4800;
const PREFIX_VERDICT_MS = 2800;

// Stagger budget for the entrance choreography. Rows announce in reverse —
// last place first — at ROW_STAGGER_MS apart, then a beat of silence, then
// the winner section pops in with maximum flourish, then the foot buttons
// fade in last.
const ROW_STAGGER_MS = 110;
const WINNER_BUFFER_MS = 280;
const WINNER_DURATION_MS = 600;
const BUTTONS_AFTER_WINNER_MS = 350;
// Card-reveal pacing mirrors PowerRevealOverlay's internal stepMs +
// exit-fade timing. Each unrevealed effect lingers stepMs before the
// next one steps in; the final card sits a beat longer to let the exit
// fade play out so the ledger choreography lands on a clean canvas.
const RECKONING_REVEAL_STEP_MS = 3800;
const RECKONING_REVEAL_TAIL_MS = 620;

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
  // The displayed winner is whoever the engine's outcome resolver names —
  // for the cop variant that's the Privateer (when their mission lands),
  // not just the richest player. Defaults to ranked[0] for base game / if
  // the outcome can't find a matching player.
  const outcome = gameOutcome(game, totalKills);
  const winner =
    game.players.find((p) => p.id === outcome.winnerId) ?? ranked[0];
  const rest = ranked.filter((p) => p.id !== winner.id);
  const cop = game.variants.cop
    ? game.players.find((p) => p.role === "cop")
    : undefined;
  const copWon = outcome.kind === "cop_wins";

  // Cop variant: a three-beat prefix runs before the ledger choreography.
  // Base game starts at 'done' so behavior is byte-identical to before.
  const [prefixStage, setPrefixStage] = useState<PrefixStage>(
    game.variants.cop ? 'roles' : 'done',
  );
  useEffect(() => {
    if (prefixStage === 'roles') {
      const id = window.setTimeout(() => setPrefixStage('investigation'), PREFIX_ROLES_MS);
      return () => clearTimeout(id);
    }
    if (prefixStage === 'investigation') {
      const id = window.setTimeout(() => setPrefixStage('verdict'), PREFIX_INVESTIGATION_MS);
      return () => clearTimeout(id);
    }
    if (prefixStage === 'verdict') {
      const id = window.setTimeout(() => setPrefixStage('done'), PREFIX_VERDICT_MS);
      return () => clearTimeout(id);
    }
  }, [prefixStage]);

  if (game.variants.cop && prefixStage !== 'done') {
    const outcome = gameOutcome(game, totalKills);
    const cop = game.players.find((p) => p.role === 'cop');
    const copDeadRound = cop && cop.status === 'dead' ? eliminatedByRound[cop.id] : undefined;
    const flashingCount = cop?.shame.filter((s) => s.flashing).length ?? 0;
    const reinforcementsRound = game.cop?.reinforcementsRoundOnTheWay;
    return (
      <Box sx={{ width: "100vw", height: "100vh" }}>
        <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
          <Masthead
            left={<>{t("shell.room")} <em>{roomId}</em></>}
            right={<FullscreenButton />}
          />
          {prefixStage === 'roles' && <RolesFlipBeat players={game.players} t={t} />}
          {prefixStage === 'investigation' && (
            <InvestigationBeat
              reinforcementsRound={reinforcementsRound}
              copDeadRound={copDeadRound}
              flashingCount={flashingCount}
              t={t}
            />
          )}
          {prefixStage === 'verdict' && <VerdictBeat outcome={outcome} t={t} />}
        </PageCanvas>
      </Box>
    );
  }

  // Unrevealed effects get the full PowerRevealOverlay treatment first —
  // the "I had this all along" card flip. Revealed effects (Dead Eye,
  // Bloodhound, anything that fired during play) are already known to
  // the audience, so they stay as quiet badges on the ledger rows.
  const reckoningReveals: PowerActivation[] = [];
  for (const p of game.players) {
    for (const e of p.effects) {
      if (!e.revealed) reckoningReveals.push({ playerId: p.id, kind: e.kind });
    }
  }
  const revealsTotalMs =
    reckoningReveals.length > 0
      ? reckoningReveals.length * RECKONING_REVEAL_STEP_MS + RECKONING_REVEAL_TAIL_MS
      : 0;

  // Reverse-order stagger: the last-place row enters first (delay 0) so the
  // ledger fills bottom-up; second-place lands just before the winner
  // enthronement pops in. Everything's offset by revealsTotalMs so the
  // ledger doesn't animate underneath the card-reveal overlay.
  const rowsTotalMs = rest.length * ROW_STAGGER_MS;
  const winnerDelayMs = revealsTotalMs + rowsTotalMs + WINNER_BUFFER_MS;
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
          {copWon && cop ? (
            <PrivateerVictoryEnthronement
              cop={cop}
              t={t}
              enterDelayMs={winnerDelayMs}
              durationMs={WINNER_DURATION_MS}
            />
          ) : (
            <WinnerEnthronement
              winner={winner}
              t={t}
              enterDelayMs={winnerDelayMs}
              durationMs={WINNER_DURATION_MS}
              totalKills={totalKills}
            />
          )}

          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto", marginTop: "0.4rem" }}>
            {rest.map((p, i) => (
              <EndGameRow
                key={p.id}
                rank={i + 2}
                player={p}
                eliminatedRound={eliminatedByRound[p.id] ?? null}
                enterDelayMs={revealsTotalMs + (rest.length - 1 - i) * ROW_STAGGER_MS}
                totalKills={totalKills}
                isPrivateer={p.id === cop?.id}
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
      {/* "I had this all along" card flip — every unrevealed effect rolls
          through the overlay before the ledger lands. */}
      <PowerRevealOverlay activations={reckoningReveals} players={game.players} />
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
            the in-game crew flag, scaled up for the reckoning's prominence.
            Power badges (if any) tack onto the top-left corner, mirroring
            the in-game crew rail placement. */}
        <Box
          sx={{
            position: "relative",
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
          {winner.effects.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -18,
                left: -18,
                display: "flex",
                gap: "0.3rem",
                animation: `${fadeIn} 500ms ease-out ${medallionDelayMs + 160}ms both`,
              }}
            >
              {winner.effects.map((e) => (
                <PowerBadge key={e.kind} kind={e.kind} size={48} />
              ))}
            </Box>
          )}
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
            {winner.shame.length > 0 && <ShamePips markers={winner.shame} />}
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
          animation: `${fadeIn} 500ms ease-out ${cryDelayMs}ms both`,
        }}
      >
        {t("reckoning.winnerCry")}
      </Box>
    </Box>
  );
}

// Cop-wins enthronement — replaces the cash-focused WinnerEnthronement when
// the Privateer's mission lands. No cash total: the Crown's verdict isn't
// about who hoarded the most loot. The cop's flag is overlaid with a small
// "PRIVATEER" tag so the role identity reads at a glance.
function PrivateerVictoryEnthronement({
  cop,
  t,
  enterDelayMs,
  durationMs,
}: {
  cop: Player;
  t: (k: string, p?: Record<string, unknown>) => string;
  enterDelayMs: number;
  durationMs: number;
}) {
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
          color: palette.blood,
          animation: `${fadeIn} 400ms ease-out ${eyebrowDelayMs}ms both`,
        }}
      >
        {t("cop.reckoning.verdictCopWins")}
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
            position: "relative",
            width: 156,
            height: 108,
            border: `4px solid ${palette.paper}`,
            background: flagColor(cop.colorOrAvatar),
            color: palette.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `6px 6px 0 ${palette.inkDeep}`,
          }}
        >
          <FlagFor id={jollyRogerForColor(cop.colorOrAvatar)} size={84} />
        </Box>
        <Box sx={{ textAlign: "left" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              fontFamily: fonts.blackletter,
              fontSize: "3.5rem",
              lineHeight: 0.9,
              color: palette.paper,
            }}
          >
            <Lantern lit size={40} />
            {cop.displayName}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.45rem" }}>
            <WoundPips count={cop.wounds} />
            {cop.shame.length > 0 && <ShamePips markers={cop.shame} />}
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
          animation: `${fadeIn} 500ms ease-out ${cryDelayMs}ms both`,
        }}
      >
        the Navy claps the crew in irons — the loot stays with the Crown
      </Box>
    </Box>
  );
}

// Beat 1: all role cards flip simultaneously. The cop's card carries the
// dark-blood ground; pirate cards take the inky ground. Same flip keyframe
// across the board so the table reveals as one motion.
const roleFlip = keyframes`
  from { transform: rotateY(180deg); opacity: 0; }
  to   { transform: rotateY(0deg);   opacity: 1; }
`;

function RolesFlipBeat({
  players,
  t,
}: {
  players: Player[];
  t: (k: string, p?: Record<string, unknown>) => string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.6rem",
        padding: "0 2rem",
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
        }}
      >
        {t("cop.reckoning.rolesIntro")}
      </Box>
      <Box sx={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        {players.map((p) => {
          const isCop = p.role === "cop";
          return (
            <Box
              key={p.id}
              sx={{
                width: "6.5rem",
                height: "9rem",
                border: `2px solid ${palette.paper}`,
                background: isCop ? palette.bloodDeep : palette.ink,
                color: palette.paper,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.5rem",
                textAlign: "center",
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.85rem",
                letterSpacing: "0.18em",
                boxShadow: `4px 4px 0 ${palette.inkDeep}`,
                animation: `${roleFlip} 700ms ease-out both`,
              }}
            >
              {isCop ? t("cop.widget.cop") : t("cop.widget.mafia")}
              <Box
                sx={{
                  marginTop: "0.5rem",
                  fontFamily: fonts.body,
                  fontStyle: "italic",
                  fontSize: "0.75rem",
                  letterSpacing: "0.04em",
                  color: palette.paperDim,
                }}
              >
                {p.displayName}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function InvestigationBeat({
  reinforcementsRound,
  copDeadRound,
  flashingCount,
  t,
}: {
  reinforcementsRound: number | undefined;
  copDeadRound: number | undefined;
  flashingCount: number;
  t: (k: string, p?: Record<string, unknown>) => string;
}) {
  // 2–3 narrated lines, sequenced. The flashing-shame line only renders
  // if the Navy actually came — otherwise there's nothing to be shamed by.
  const lines: string[] = [];
  lines.push(
    reinforcementsRound !== undefined
      ? t("cop.reckoning.calledRoundN", { n: reinforcementsRound })
      : t("cop.reckoning.neverCame"),
  );
  lines.push(
    copDeadRound !== undefined
      ? t("cop.reckoning.copKilledRoundN", { n: copDeadRound })
      : t("cop.reckoning.copSurvived"),
  );
  if (reinforcementsRound !== undefined) {
    lines.push(t("cop.reckoning.copFlashingShame", { n: flashingCount }));
  }
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4rem",
        textAlign: "center",
        color: palette.paper,
        fontFamily: fonts.body,
        fontStyle: "italic",
        fontSize: "1.6rem",
        lineHeight: 1.3,
      }}
    >
      {lines.map((line, i) => (
        <Box
          key={i}
          sx={{
            animation: `${fadeIn} 600ms ease-out ${i * 800}ms both`,
          }}
        >
          {line}
        </Box>
      ))}
    </Box>
  );
}

// Cop victory: a siren-wash backdrop (radial blood → ink) under a blackletter
// "BY THE CROWN'S JUSTICE". Mafia victory: muted italic line in paperDim.
function VerdictBeat({
  outcome,
  t,
}: {
  outcome: GameOutcome;
  t: (k: string, p?: Record<string, unknown>) => string;
}) {
  if (outcome.kind === "cop_wins") {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: `radial-gradient(ellipse at center, ${palette.blood} 0%, ${palette.ink} 75%)`,
          fontFamily: fonts.blackletter,
          fontSize: "4.5rem",
          lineHeight: 1.05,
          color: palette.paper,
          letterSpacing: "0.02em",
          textShadow: `4px 4px 0 ${palette.inkDeep}`,
          animation: `${fadeIn} 500ms ease-out both`,
        }}
      >
        {t("cop.reckoning.verdictCopWins")}
      </Box>
    );
  }
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 4rem",
        fontFamily: fonts.body,
        fontStyle: "italic",
        fontSize: "2.2rem",
        color: palette.paperDim,
        animation: `${fadeIn} 500ms ease-out both`,
      }}
    >
      {t("cop.reckoning.verdictMafiaWins")}
    </Box>
  );
}
