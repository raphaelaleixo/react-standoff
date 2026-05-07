import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import type { BulletCard, Game, Player } from "../../game/types";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { Button } from "../shell/Button";
import { toRoman } from "../../lib/navyHours";
import { useStandoffCount } from "../../hooks/useStandoffCount";
import { STANDOFF_DURATION_MS } from "../../lib/phaseDurations";
import { SHAME_PENALTY } from "../../lib/score";
import { AimBarrel } from "./AimBarrel";
import { Hand } from "./Hand";
import { TargetList } from "./TargetList";
import { YieldRibbon } from "./YieldRibbon";

// Sorted in the same order as the Hand grid, so we can map the selected
// BulletCard back to a displayed-index for highlight.
const HAND_ORDER: Record<BulletCard, number> = { clic: 0, bang: 1, bang_bang_bang: 2 };

interface PhaseViewProps {
  game: Game;
  me: Player;
  submitCommit: (id: string, b: BulletCard, t: string) => Promise<void>;
  submitDuck: (id: string, w: boolean) => Promise<void>;
}

// The phase-by-phase body of the player surface — extracted from PlayerPage
// so the mock player page can render the exact same UI against fixture state.
export function PhaseView({ game, me, submitCommit, submitDuck }: PhaseViewProps) {
  const { t } = useTranslation();
  // Standoff countdown — `active` only during the count itself; the silent
  // standoff_hold beat that follows shouldn't restart the timer. Computed
  // unconditionally to satisfy hook rules; only consumed in the standoff
  // branch below.
  const standoffCount = useStandoffCount({
    active: game.round.phase === "standoff",
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });
  if (game.phase === "ended") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography variant="h5">{t("phase.ended")}</Typography>
      </Box>
    );
  }
  if (me.status === "dead") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography color="text.secondary">{t("player.spectator")}</Typography>
      </Box>
    );
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return <CommitPicker me={me} opponents={opponents} myCommit={myCommit} onSubmit={submitCommit} />;
  }

  if (phase === "standoff" || phase === "standoff_hold") {
    const target = game.players.find(p => p.id === myCommit?.target);
    // Show the count only during the standoff countdown itself. During the
    // standoff_hold silent beat that follows, the count is hidden (mirrors
    // the big-screen StandoffStamp behaviour) and the barrel just shows the
    // locked target's jolly roger.
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.1rem",
          padding: "1rem",
        }}
      >
        <AimBarrel
          colorOrAvatar={target?.colorOrAvatar ?? null}
          size={240}
          count={phase === "standoff" ? standoffCount : null}
        />
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.75rem",
              letterSpacing: "0.4em",
              color: palette.paperDim,
            }}
          >
            AIMING AT
          </Box>
          <Box
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "1.2rem",
              letterSpacing: "0.22em",
              color: palette.paper,
              marginTop: "0.25rem",
            }}
          >
            {target?.displayName ?? "?"}
          </Box>
        </Box>
      </Box>
    );
  }

  if (phase === "withdraw") {
    const attackers = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid))
      .filter((p): p is Player => !!p);
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "1.2rem",
          padding: "0.8rem 1rem 1rem",
        }}
      >
        <ThreatPanel attackers={attackers} />
        <YieldRibbon
          yielded={!!myCommit?.withdrew}
          onToggle={() => submitDuck(me.id, !myCommit?.withdrew)}
        />
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "0.65rem",
              letterSpacing: "0.32em",
              color: palette.paperDim,
            }}
          >
            {t("phase.withdraw.cost")}
          </Box>
          <Box
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "0.78rem",
              letterSpacing: "0.04em",
              color: palette.paper,
              marginTop: "0.2rem",
            }}
          >
            {t("phase.withdraw.costSub", { amount: SHAME_PENALTY.toLocaleString() })}
          </Box>
        </Box>
      </Box>
    );
  }

  if (phase === "reveal_withdraw" || phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography color="text.secondary">{t("player.watchScreen")}</Typography>
      </Box>
    );
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [load, setLoad] = useState<BulletCard | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const targetName = opponents.find(o => o.id === myCommit?.target)?.displayName ?? myCommit?.target;
    return (
      <Box sx={{ padding: "1.4rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        <Box sx={{ fontFamily: fonts.displayCaps, fontFeatureSettings: '"smcp"', fontSize: "1rem", letterSpacing: "0.22em", color: palette.paper }}>
          {t(`load.${myCommit.bullet!}`).toUpperCase()} → {targetName}
        </Box>
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", color: palette.paperDim }}>
          {t("phase.commit.waiting")}
        </Box>
      </Box>
    );
  }

  // Map the chosen BulletCard back to a displayed-index for the Hand's
  // highlight by sorting bullets the same way Hand does. Duplicate-load
  // cases highlight the first matching slot — visually interchangeable.
  const sorted = [...me.bullets].sort((a, b) => HAND_ORDER[a] - HAND_ORDER[b]);
  const selectedIndex = load ? sorted.indexOf(load) : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Hand
        bullets={me.bullets}
        selectedIndex={selectedIndex !== -1 ? selectedIndex : undefined}
        onPick={(b) => setLoad(b)}
      />

      <Box
        sx={{
          padding: "0.55rem 0 0.25rem",
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.7rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
        }}
      >
        {t("phase.commit.pickTarget")}
      </Box>

      <TargetList
        opponents={opponents}
        selectedId={target}
        onPick={(id) => setTarget(id)}
      />

      <Box sx={{ padding: "0.7rem 0.85rem 0.85rem" }}>
        <Button
          fullWidth
          disabled={!load || !target}
          onClick={() => load && target && onSubmit(me.id, load, target)}
          caption={
            load && target
              ? `— ${t(`load.${load}`).toLowerCase()} · ${opponents.find(o => o.id === target)?.displayName ?? "?"} —`
              : undefined
          }
        >
          {t("phase.commit.ready").toUpperCase()}
        </Button>
      </Box>
    </Box>
  );
}

// Withdraw-phase threat readout. Two states:
//
// - Nobody aiming → an "AT EASE" stamp + a calm italic subline. Same paper-
//   dim treatment used by other reflective beats in the broadside language.
// - One or more aiming → blood-coloured "MARK ON YE" / "II MARKS ON YE"
//   headline (roman numeral count for >1) and a row of attacker chips below
//   showing each shooter's per-colour jolly roger + display name. Concrete
//   info beats a "Aimed at by: X, Y, Z" sentence — the player can see
//   exactly who they're up against at a glance.
function ThreatPanel({ attackers }: { attackers: Player[] }) {
  const { t } = useTranslation();
  if (attackers.length === 0) {
    return (
      <Box sx={{ textAlign: "center", padding: "0.5rem 0" }}>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "1.4rem",
            letterSpacing: "0.4em",
            color: palette.paperDim,
            lineHeight: 1.05,
          }}
        >
          {t("phase.withdraw.atEase")}
        </Box>
        <Box
          sx={{
            fontFamily: fonts.body,
            fontStyle: "italic",
            color: palette.paperDim,
            marginTop: "0.4rem",
            fontSize: "0.9rem",
          }}
        >
          {t("phase.withdraw.atEaseSub")}
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={{ textAlign: "center", padding: "0.5rem 0" }}>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.3rem",
          letterSpacing: "0.32em",
          color: palette.blood,
          lineHeight: 1.05,
          textShadow: `0 0 12px rgba(201,58,48,0.35)`,
        }}
      >
        {t("phase.withdraw.marks", { count: attackers.length, n: toRoman(attackers.length) })}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "0.45rem",
          marginTop: "0.7rem",
          flexWrap: "wrap",
        }}
      >
        {attackers.map(p => (
          <AttackerChip key={p.id} player={p} />
        ))}
      </Box>
    </Box>
  );
}

function AttackerChip({ player }: { player: Player }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.32rem 0.5rem 0.32rem 0.4rem",
        background: palette.inkUp,
        border: `1.5px solid ${palette.blood}`,
        boxShadow: `2px 2px 0 ${palette.inkDeep}`,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 22,
          border: `1px solid ${palette.paper}`,
          background: flagColor(player.colorOrAvatar),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={jollyRogerForColor(player.colorOrAvatar)} size={16} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.12em",
          color: palette.paper,
          whiteSpace: "nowrap",
        }}
      >
        {player.displayName}
      </Box>
    </Box>
  );
}
