import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import type { BulletCard, Game, Player } from "../../game/types";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { fadeIn, slideUpIn } from "../../theme/animations";
import { FlagFor, jollyRogerForColor } from "../flags";
import { Button } from "../shell/Button";
// Spelled-out small counts for headline copy (e.g. "TWO BARRELS ON YE").
// Falls back to the numeral string for anything we don't have a word for.
const COUNT_WORDS: Record<number, string> = {
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
  6: "SIX",
};
function spellCount(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}
import { useStandoffCount } from "../../hooks/useStandoffCount";
import { useHandSlots, type HandSlot } from "../../hooks/useHandSlots";
import { STANDOFF_DURATION_MS } from "../../lib/phaseDurations";
import { SHAME_PENALTY } from "../../lib/score";
import { AimBarrel } from "./AimBarrel";
import { Hand } from "./Hand";
import { Spectator } from "./Spectator";
import { TargetList } from "./TargetList";
import { YieldRibbon } from "./YieldRibbon";

interface PhaseViewProps {
  game: Game;
  me: Player;
  submitCommit: (id: string, b: BulletCard, t: string) => Promise<void>;
  submitDuck: (id: string, w: boolean) => Promise<void>;
  /**
   * Mock-only override: bullets to seed `useHandSlots` as already-spent on
   * mount, so MockPlayerPage can demonstrate the post-spend visual treatment
   * on every seat (production never passes this — bullets shrink naturally
   * across rounds).
   */
  handPrespent?: BulletCard[];
}

// The phase-by-phase body of the player surface — extracted from PlayerPage
// so the mock player page can render the exact same UI against fixture state.
export function PhaseView({ game, me, submitCommit, submitDuck, handPrespent }: PhaseViewProps) {
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
  // Stable hand layout — slot positions persist across phases/rounds so a
  // card spent earlier stays in its original slot (dimmed face + red X)
  // instead of remaining cards re-sorting to fill the gap.
  const handSlots = useHandSlots(me.bullets, me.id, handPrespent);
  // Group phases that should NOT cross-fade between each other (standoff and
  // standoff_hold share the same render branch — the AimBarrel handles its
  // own count → no-count fade — so flipping between them shouldn't trigger
  // the PhaseFader's exit/enter cycle).
  const phaseKey =
    game.phase === "ended" ? "ended"
    : me.status === "dead" ? "spectator"
    : game.round.phase === "commit" ? "commit"
    : game.round.phase === "standoff" || game.round.phase === "standoff_hold" ? "standoff"
    : game.round.phase === "withdraw" ? "withdraw"
    : "reveal";

  let content: React.ReactNode = null;

  if (game.phase === "ended") {
    content = (
      <Box sx={{ padding: "1.4rem", textAlign: "center" }}>
        <Typography variant="h5">{t("phase.ended")}</Typography>
      </Box>
    );
    return <PhaseFader phaseKey={phaseKey}>{content}</PhaseFader>;
  }
  if (me.status === "dead") {
    return <PhaseFader phaseKey={phaseKey}><Spectator game={game} eliminated /></PhaseFader>;
  }
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  if (phase === "commit") {
    return (
      <PhaseFader phaseKey={phaseKey}>
        <CommitPicker
          me={me}
          opponents={opponents}
          myCommit={myCommit}
          onSubmit={submitCommit}
          handSlots={handSlots}
        />
      </PhaseFader>
    );
  }

  if (phase === "standoff" || phase === "standoff_hold") {
    const target = game.players.find(p => p.id === myCommit?.target);
    // Show the count only during the standoff countdown itself. During the
    // standoff_hold silent beat that follows, the count is hidden (mirrors
    // the big-screen StandoffStamp behaviour) and the barrel just shows the
    // locked target's jolly roger.
    return (
      <PhaseFader phaseKey={phaseKey}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.1rem",
            // Top padding chosen so the disc lands at the same vertical
            // position as the commit picker's disc (which sits below the
            // "Aimin' at" heading + selected-target stat row). Keeps the
            // crosshair pinned on screen across commit / committed /
            // standoff / standoff_hold so the transition reads as a lock-
            // in, not a jump.
            padding: "5rem 1rem 1rem",
          }}
        >
          <AimBarrel
            colorOrAvatar={target?.colorOrAvatar ?? null}
            size={200}
            count={phase === "standoff" ? standoffCount : null}
          />
          <Box
            sx={{
              textAlign: "center",
              animation: `${slideUpIn} 400ms ease-out 120ms both`,
            }}
          >
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
      </PhaseFader>
    );
  }

  if (phase === "withdraw") {
    const attackers = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid))
      .filter((p): p is Player => !!p);
    return (
      <PhaseFader phaseKey={phaseKey}>
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
      </PhaseFader>
    );
  }

  if (phase === "reveal_withdraw" || phase === "reveal_bbb" || phase === "reveal_others" || phase === "split") {
    return <PhaseFader phaseKey={phaseKey}><Spectator game={game} /></PhaseFader>;
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit, handSlots }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, b: BulletCard, t: string) => Promise<void>;
  handSlots: HandSlot[];
}) {
  const { t } = useTranslation();
  const [pick, setPick] = useState<{ load: BulletCard; slotIndex: number } | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const ready = myCommit?.bullet && myCommit.target;

  if (ready) {
    const target = opponents.find(o => o.id === myCommit?.target);
    const targetName = target?.displayName ?? myCommit?.target;
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.1rem",
          padding: "5rem 1rem 1rem",
        }}
      >
        <AimBarrel colorOrAvatar={target?.colorOrAvatar ?? null} size={200} />
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
            {targetName}
          </Box>
          <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "0.85rem", color: palette.paperDim, marginTop: "0.5rem" }}>
            {t("phase.commit.waiting")}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          padding: "0.85rem 0 0.1rem",
          textAlign: "center",
          fontFamily: fonts.blackletter,
          fontWeight: 700,
          fontSize: "1.6rem",
          lineHeight: 1,
          letterSpacing: "0.02em",
          color: palette.paper,
        }}
      >
        {t("phase.commit.pickTarget")}
      </Box>

      <TargetList
        opponents={opponents}
        selectedId={target}
        onPick={(id) => setTarget(id)}
      />

      <Box sx={{ animation: `${slideUpIn} 450ms ease-out 80ms both` }}>
        <Hand
          slots={handSlots}
          selectedSlotIndex={pick?.slotIndex}
          onPick={(load, slotIndex) => setPick({ load, slotIndex })}
        />
      </Box>

      {/* Push the commit button to the bottom of the available space so
          it stays under the thumb regardless of how much room the picker +
          hand take above. */}
      <Box
        sx={{
          padding: "1.1rem 0 0.85rem",
          width: "calc(4 * 75px + 3 * 0.45rem)",
          maxWidth: "100%",
          marginInline: "auto",
          animation: `${fadeIn} 400ms ease-out 200ms both`,
        }}
      >
        <Button
          fullWidth
          disabled={!pick || !target}
          onClick={() => pick && target && onSubmit(me.id, pick.load, target)}
          caption={
            pick && target
              ? `${t(`load.${pick.load}`)} → ${opponents.find(o => o.id === target)?.displayName ?? "?"}`
              : t("phase.commit.selectCard")
          }
        >
          {pick && target
            ? t("phase.commit.lockIn").toUpperCase()
            : t("phase.commit.ready").toUpperCase()}
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
        {t("phase.withdraw.marks", { count: attackers.length, n: spellCount(attackers.length) })}
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

// Cross-fades phase content. Holds onto the previous phase's children while
// fading them to opacity 0, then swaps in the new phase and fades to opacity
// 1. Without this the phase change pops instantly — CSS keyframes alone
// can't animate an element that's already unmounted, so we delay the unmount
// here.
//
// Two refs:
//  - `latestChildren` tracks whatever the parent rendered most recently, so
//    when the swap happens we pick up any updates that landed during the
//    fade-out window (e.g. the standoff countdown ticked down).
//  - `displayed` is what we actually render — frozen during the fade-out so
//    the leaving phase stays on screen until the swap, then synced to
//    `latestChildren` again once the new phase mounts.
//
// `children` is intentionally NOT in the effect deps — `useStandoffCount`
// re-renders every 100ms during the count, so a children-keyed effect would
// reset the timeout on every tick and the fade would never complete.
const FADE_OUT_MS = 200;
function PhaseFader({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) {
  const [renderedKey, setRenderedKey] = useState(phaseKey);
  const [opacity, setOpacity] = useState(1);
  const latestChildren = useRef(children);
  latestChildren.current = children;
  const displayed = useRef(children);
  if (phaseKey === renderedKey) {
    displayed.current = children;
  }

  useLayoutEffect(() => {
    if (phaseKey === renderedKey) return;
    setOpacity(0);
    const t = setTimeout(() => {
      displayed.current = latestChildren.current;
      setRenderedKey(phaseKey);
      setOpacity(1);
    }, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [phaseKey, renderedKey]);

  return (
    <Box
      sx={{
        opacity,
        transition: `opacity ${opacity === 0 ? FADE_OUT_MS : 280}ms ease-out`,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      {displayed.current}
    </Box>
  );
}
