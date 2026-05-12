import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { PowerCard } from "../powers/PowerCard";
import { finalScore, rankPlayers } from "../../game/scoring";
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
  const winner = ranked[0];
  const rest = ranked.slice(1);

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
        isMe={winner.id === me.id}
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
      </Box>

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
  );
}

function PhoneWinnerEnthronement({
  winner,
  isMe,
  enterDelayMs,
  durationMs,
  totalKills,
}: {
  winner: Player;
  isMe: boolean;
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
    <Box sx={{ textAlign: "center", padding: "0.4rem 0 0.2rem" }}>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.6rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          animation: `${fadeIn} 400ms ease-out ${eyebrowDelayMs}ms both`,
        }}
      >
        {t("reckoning.winnerEyebrow")}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginTop: "0.5rem",
          animation: `${popIn} ${durationMs}ms cubic-bezier(.2,.7,.2,1.4) ${medallionDelayMs}ms both`,
        }}
      >
        {/* Flag-aspect medallion — same proportions as the big-screen's
            reckoning medallion, scaled for the phone canvas. */}
        <Box
          sx={{
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
        </Box>
      </Box>
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "2.2rem",
          lineHeight: 0.95,
          color: titleColor,
          marginTop: "0.55rem",
          animation: `${popIn} ${durationMs}ms cubic-bezier(.2,.7,.2,1.4) ${medallionDelayMs}ms both`,
        }}
      >
        {winner.displayName}
        {isMe && (
          <Box
            component="span"
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.55rem",
              letterSpacing: "0.4em",
              color: palette.blood,
              verticalAlign: "middle",
              marginLeft: "0.6em",
            }}
          >
            {/* Tiny "that's ye" badge so the local seat sees that they won
                without having to scan back through the ledger. */}
            — YE —
          </Box>
        )}
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
        {winner.shame > 0 && <ShamePips count={winner.shame} size={9} />}
      </Box>
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
      {winner.effects.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: "0.4rem",
            marginTop: "0.4rem",
            animation: `${fadeIn} 400ms ease-out ${medallionDelayMs + 200}ms both`,
          }}
        >
          {winner.effects.map((e) => (
            <PowerCard key={e.kind} kind={e.kind} variant="faceUp" size="sm" />
          ))}
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
        {t("reckoning.winnerCry")}
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
        // Outer wrapper carries the row's chrome (border, animation, dead
        // dim) so the inner grid stays a clean 4-column ledger. Held powers
        // tack on as a second row in this column flow.
        display: "flex",
        flexDirection: "column",
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
        display: "grid",
        gridTemplateColumns: PHONE_GRID_COLUMNS,
        gap: "0.6rem",
        alignItems: "center",
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
          width: 44,
          height: 30,
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
        {dead && (
          <Box
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "0.72rem",
              letterSpacing: "0.04em",
              color: palette.paperDim,
              marginTop: "0.05rem",
            }}
          >
            {t("reckoning.dead").toLowerCase()}
          </Box>
        )}
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
      {player.effects.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: "0.35rem",
            marginTop: "0.35rem",
            paddingLeft: "calc(26px + 0.6rem)", // align under the flag chip
          }}
        >
          {player.effects.map((e) => (
            <PowerCard key={e.kind} kind={e.kind} variant="faceUp" size="sm" />
          ))}
        </Box>
      )}
    </Box>
  );
}
