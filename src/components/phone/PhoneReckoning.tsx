import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { PowerBadge } from "../powers/PowerBadge";
import { Lantern } from "../screens/icons/Lantern";
import { finalScore, gameOutcome, rankPlayers } from "../../game/scoring";
import { toRoman } from "../../lib/navyHours";
import { breath, fadeIn, popIn, slideUpIn } from "../../theme/animations";
import type { Game, Player } from "../../game/types";

// Stagger budget for the phone-side reckoning — mirrors the big-screen
// choreography (last place leads, winner pops in last) but compressed for the
// phone's smaller ledger. The "waiting on captain" tag fades in after
// everything else has landed.
const ROW_STAGGER_MS = 90;
const WINNER_BUFFER_MS = 240;
const WINNER_DURATION_MS = 560;
const TAG_AFTER_WINNER_MS = 320;

interface PhoneReckoningProps {
  game: Game;
  me: Player;
}

// Phone-shaped end-game view. Vocabulary matches the big-screen Reckoning —
// eyebrow → flag medallion → name → net score → italic cry, then a compact
// ledger of remaining seats — but the layout is vertical (no side-by-side
// medallion + name) and the per-row grid drops to four columns to fit the
// 440-px-max canvas. The viewer's own row is paper-outlined so they can
// spot themselves at a glance.
export function PhoneReckoning({ game, me }: PhoneReckoningProps) {
  const { t } = useTranslation();
  // Same kills-count signal as the big-screen ReckoningScreen — drives Davy
  // Jones's Cut bonus inside finalScore so both surfaces rank seats the same.
  const totalKills = game.players.filter((p) => p.status === "dead").length;
  const ranked = rankPlayers(game.players, totalKills);
  // Crown the engine's named winner (cop variant: the Privateer when their
  // mission lands, not just the richest seat). Defaults to ranked[0] for
  // base-game and any case the outcome can't resolve.
  const outcome = gameOutcome(game, totalKills);
  const winner =
    game.players.find((p) => p.id === outcome.winnerId) ?? ranked[0];
  const rest = ranked.filter((p) => p.id !== winner.id);

  const rowsTotalMs = rest.length * ROW_STAGGER_MS;
  const winnerDelayMs = rowsTotalMs + WINNER_BUFFER_MS;
  const tagDelayMs = winnerDelayMs + WINNER_DURATION_MS + TAG_AFTER_WINNER_MS;

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        padding: "0.6rem 0.9rem 0.4rem",
      }}
    >
      <PhoneWinnerEnthronement
        winner={winner}
        copWon={outcome.kind === "cop_wins"}
        enterDelayMs={winnerDelayMs}
        durationMs={WINNER_DURATION_MS}
        totalKills={totalKills}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          marginTop: "0.5rem",
          paddingTop: "0.2rem",
          borderTop: `1px solid ${palette.rule}`,
        }}
      >
        {rest.map((p, i) => (
          <PhoneEndRow
            key={p.id}
            rank={i + 2}
            player={p}
            isMe={p.id === me.id}
            enterDelayMs={(rest.length - 1 - i) * ROW_STAGGER_MS}
            totalKills={totalKills}
          />
        ))}
        <Box
          sx={{
            textAlign: "center",
            padding: "0.7rem 0 0.3rem",
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: palette.paperDim,
            animation: `${fadeIn} 500ms ease-out ${tagDelayMs}ms both, ${breath} 2.8s ease-in-out ${tagDelayMs + 500}ms infinite`,
          }}
        >
          {t("phase.endedPhoneWaiting")}
        </Box>
      </Box>
    </Box>
  );
}

function PhoneWinnerEnthronement({
  winner,
  copWon,
  enterDelayMs,
  durationMs,
  totalKills,
}: {
  winner: Player;
  // Cop-variant verdict: swap the eyebrow for "BY THE CROWN'S JUSTICE",
  // drop the cash line (mission verdict isn't about loot), and slip a
  // lit lantern beside the name.
  copWon: boolean;
  enterDelayMs: number;
  durationMs: number;
  totalKills: number;
}) {
  const { t } = useTranslation();
  const winnerDead = winner.status !== "alive";
  const score = finalScore(winner, totalKills);
  const titleColor = winnerDead ? palette.paperDim : palette.paper;
  // Same sub-stagger shape as the big-screen: eyebrow leads, medallion pops
  // in with the most flourish, cry tags out last.
  const eyebrowDelayMs = enterDelayMs;
  const medallionDelayMs = enterDelayMs + 160;
  const cryDelayMs = enterDelayMs + durationMs - 100;
  return (
    <Box sx={{ textAlign: "center", padding: "1.4rem 0 0.4rem" }}>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: copWon ? "0.72rem" : "0.6rem",
          letterSpacing: copWon ? "0.6em" : "0.4em",
          color: copWon ? palette.blood : palette.paperDim,
          animation: `${fadeIn} 400ms ease-out ${eyebrowDelayMs}ms both`,
        }}
      >
        {copWon ? t("cop.reckoning.verdictCopWins") : t("reckoning.winnerEyebrow")}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginTop: "1rem",
          animation: `${popIn} ${durationMs}ms cubic-bezier(.2,.7,.2,1.4) ${medallionDelayMs}ms both`,
        }}
      >
        {/* Flag-aspect medallion — same proportions as the big-screen's
            reckoning medallion, scaled for the phone canvas. Power badges
            (if any) tack onto the top-left corner, matching the in-game
            crew rail anchor. */}
        <Box
          sx={{
            position: "relative",
            width: 108,
            height: 75,
            border: `3px solid ${palette.paper}`,
            background: flagColor(winner.colorOrAvatar),
            color: palette.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `4px 4px 0 ${palette.inkDeep}`,
          }}
        >
          <FlagFor id={jollyRogerForColor(winner.colorOrAvatar)} size={58} />
          {winner.effects.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -14,
                left: -14,
                display: "flex",
                gap: "0.25rem",
                animation: `${fadeIn} 400ms ease-out ${medallionDelayMs + 200}ms both`,
              }}
            >
              {winner.effects.map((e) => (
                <PowerBadge key={e.kind} kind={e.kind} size={36} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: copWon ? "0.55rem" : 0,
          fontFamily: fonts.blackletter,
          fontSize: "2.2rem",
          lineHeight: 0.95,
          color: titleColor,
          marginTop: "0.55rem",
          animation: `${popIn} ${durationMs}ms cubic-bezier(.2,.7,.2,1.4) ${medallionDelayMs}ms both`,
        }}
      >
        {copWon && <Lantern lit size={28} />}
        {winner.displayName}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.35rem",
          animation: `${fadeIn} 400ms ease-out ${medallionDelayMs + 120}ms both`,
        }}
      >
        <WoundPips count={winner.wounds} size={11} />
        {winner.shame.length > 0 && <ShamePips markers={winner.shame} size={9} />}
      </Box>
      {!copWon && (
        <Box
          sx={{
            fontFamily: fonts.blackletter,
            fontWeight: 700,
            fontSize: "1.7rem",
            lineHeight: 1,
            marginTop: "0.4rem",
            color: titleColor,
            animation: `${fadeIn} 400ms ease-out ${medallionDelayMs + 160}ms both`,
          }}
        >
          ${score.toLocaleString()}
        </Box>
      )}
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.9rem",
          color: palette.blood,
          marginTop: "0.4rem",
          animation: `${fadeIn} 500ms ease-out ${cryDelayMs}ms both`,
        }}
      >
        {copWon ? t("cop.reckoning.copWinsCry") : t("reckoning.winnerCry")}
      </Box>
    </Box>
  );
}

// Phone-width row: rank · flag chip · name (+ planked-round if dead) · net
// score. Drops the big-screen's separate wounds/shame/cash/penalty columns
// — the names + net score are what readers scan for on a phone, and the
// medallion above already establishes the winner's wounds/shame texture.
const PHONE_GRID_COLUMNS = "26px 44px 1fr auto";

function PhoneEndRow({
  rank,
  player,
  isMe,
  enterDelayMs,
  totalKills,
}: {
  rank: number;
  player: Player;
  isMe: boolean;
  enterDelayMs: number;
  totalKills: number;
}) {
  const { t } = useTranslation();
  const dead = player.status === "dead";
  const score = dead ? null : finalScore(player, totalKills);
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: PHONE_GRID_COLUMNS,
        gap: "0.6rem",
        alignItems: "center",
        padding: "0.4rem 0.45rem",
        borderBottom: `1px solid ${palette.rule}`,
        // Highlight the local seat's row with a paper outline + slight tonal
        // shift so the viewer can spot themselves without scanning names.
        border: isMe ? `1px solid ${palette.paper}` : `1px solid transparent`,
        borderBottomColor: isMe ? palette.paper : palette.rule,
        background: isMe ? palette.inkUp : "transparent",
        animation: `${slideUpIn} 360ms ease-out ${enterDelayMs}ms both`,
        filter: dead ? "opacity(0.6)" : undefined,
      }}
    >
      <Box
        sx={{
          textAlign: "right",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.05rem",
          letterSpacing: "0.04em",
          color: palette.paperDim,
        }}
      >
        {toRoman(rank)}
      </Box>
      <Box
        sx={{
          position: "relative",
          width: 44,
          height: 30,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            border: `1.5px solid ${palette.paper}`,
            background: flagColor(player.colorOrAvatar),
            color: palette.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FlagFor id={jollyRogerForColor(player.colorOrAvatar)} size={20} />
        </Box>
        {player.effects.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -10,
              left: -10,
              display: "flex",
              gap: "0.18rem",
              pointerEvents: "none",
            }}
          >
            {player.effects.map((e) => (
              <PowerBadge key={e.kind} kind={e.kind} size={22} />
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.95rem",
            letterSpacing: "0.14em",
            color: palette.paper,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {player.displayName}
        </Box>
      </Box>
      <Box
        sx={{
          fontFamily: dead ? fonts.displayCaps : fonts.blackletter,
          fontFeatureSettings: dead ? '"smcp"' : undefined,
          fontWeight: dead ? undefined : 700,
          fontSize: "1.15rem",
          letterSpacing: dead ? "0.06em" : undefined,
          color: dead ? palette.blood : palette.paper,
          fontStyle: dead ? "italic" : "normal",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {dead ? t("reckoning.dead") : `$${score!.toLocaleString()}`}
      </Box>
    </Box>
  );
}
