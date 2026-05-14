import { useLayoutEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import type { BulletCard, Game, Player } from "../../game/types";
import type { GameStore } from "../../hooks/gameStore";
import { advanceTelephoneHolder, writeTelephoneAction } from "../../hooks/useGameState";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { fadeIn, slideUpIn } from "../../theme/animations";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { Button } from "../shell/Button";
import { XMarksCheckbox } from "../XMarksCheckbox";
import { RoleRevealScreen } from "./RoleRevealScreen";
import { RoleWidget } from "./RoleWidget";
import { TelephoneHolderScreen } from "./TelephoneHolderScreen";

// Translated cop-only hint for the persistent corner widget. Returns
// undefined for mafia and for moments when no hint applies (e.g. before
// reinforcements are on the way and we're past round 6).
function copHint(game: Game, me: Player, t: TFunction): string | undefined {
  if (me.role !== "cop") return undefined;
  const reinforced = game.cop?.reinforcementsRoundOnTheWay;
  if (reinforced !== undefined) {
    const flashing = me.shame.filter(s => s.flashing).length;
    if (flashing >= 1) return t("cop.widget.hintOneDuckLeft");
    return undefined;
  }
  if (game.round.number <= 6) return t("cop.widget.hintCallByRound6");
  return undefined;
}
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
import type { HandSlot } from "../../hooks/useHandSlots";
import { STANDOFF_DURATION_MS } from "../../lib/phaseDurations";
import { SHAME_PENALTY } from "../../lib/score";
import { AimBarrel } from "./AimBarrel";
import { Hand } from "./Hand";
import { PhoneReckoning } from "./PhoneReckoning";
import { Spectator } from "./Spectator";
import { TargetList } from "./TargetList";
import { YieldRibbon } from "./YieldRibbon";

export interface SubmitCommitOpts {
  specialistDiscard?: BulletCard;
  armTough?: boolean;
  armInsane?: boolean;
}

export interface SubmitCommitPartial {
  bullet?: BulletCard;
  target?: string;
}

interface PhaseViewProps {
  game: Game;
  me: Player;
  submitCommit: (id: string, partial: SubmitCommitPartial, opts?: SubmitCommitOpts) => Promise<void>;
  submitDuck: (id: string, w: boolean) => Promise<void>;
  // Stable hand layout — slot positions persist across phases/rounds so a
  // card spent earlier stays in its original slot. Hoisted into the parent
  // page so the cache survives branch switches.
  handSlots: HandSlot[];
  // The game store, used by the cop-variant telephone-holder writers. Null
  // when the surface has no live store (e.g. mock idle states pre-scenario)
  // — the holder screen simply won't render in that case.
  store?: GameStore | null;
}

// The phase-by-phase body of the player surface — extracted from PlayerPage
// so the mock player page can render the exact same UI against fixture state.
export function PhaseView({ game, me, submitCommit, submitDuck, handSlots, store }: PhaseViewProps) {
  const { t } = useTranslation();
  // One-time role reveal at round-1 commit entry. Local-only state so it
  // shows once per browser session — engine state has no "acknowledged"
  // flag, by design.
  const [roleAcknowledged, setRoleAcknowledged] = useState(false);
  // Standoff countdown — `active` only during the count itself; the silent
  // standoff_hold beat that follows shouldn't restart the timer. Computed
  // unconditionally to satisfy hook rules; only consumed in the standoff
  // branch below.
  const standoffCount = useStandoffCount({
    active: game.round.phase === "standoff",
    startedAt: game.round.phaseStartedAt,
    durationMs: STANDOFF_DURATION_MS,
  });
  const phase = game.round.phase;
  const myCommit = game.round.commits[me.id];
  // Kid (Dead Eye) defers target; Cunning (Bloodhound) defers bullet.
  // myCommitPhaseDone = the player has filled in every half they were
  // supposed to fill at the regular commit phase. Once that flips true,
  // they're effectively waiting — we render the AimBarrel view instead of
  // CommitPicker, so we don't briefly flash the "POWDER LOADED" /
  // "AIMING AT" ready view before the standoff countdown begins.
  const myHasKid = me.effects.some(e => e.kind === "the_kid");
  const myHasCunning = me.effects.some(e => e.kind === "the_cunning");
  const lateHalfPending =
    (myHasKid && myCommit?.bullet !== undefined && myCommit.target === undefined) ||
    (myHasCunning && myCommit?.target !== undefined && myCommit.bullet === undefined);
  const myCommitPhaseDone =
    !!myCommit &&
    (myCommit.bullet !== undefined || myHasCunning) &&
    (myCommit.target !== undefined || myHasKid);

  // Group views that should NOT cross-fade between each other. The
  // AimBarrel render branch covers committed-during-commit / standoff /
  // standoff_hold / late_commit (non-holder + holder-after-pick), so all
  // four share phaseKey="standoff" — the count just appears/disappears
  // without a full fade.
  const phaseKey =
    game.phase === "ended" ? "ended"
    : me.status === "dead" ? "spectator"
    : phase === "commit" && !myCommitPhaseDone ? "commit"
    : phase === "late_commit" && lateHalfPending ? "late_commit"
    : phase === "withdraw" ? "withdraw"
    : phase === "reveal_withdraw" || phase === "reveal_bbb" || phase === "reveal_others" || phase === "split" || phase === "grenade" ? "reveal"
    : "standoff";

  // ─── Cop variant: one-time role reveal at round-1 commit entry ───
  // Shown before any normal phase view. The acknowledge tap flips local
  // state so subsequent renders skip it. Mafia + cop both see this.
  if (
    game.variants.cop &&
    me.role &&
    !roleAcknowledged &&
    game.round.number === 1 &&
    game.round.phase === "commit"
  ) {
    return (
      <RoleRevealScreen
        role={me.role}
        onAcknowledge={() => setRoleAcknowledged(true)}
      />
    );
  }

  // ─── Cop variant: telephone-holder full-screen takeover ───
  // When this player is the currently-active bottle holder, replace the
  // normal phase view with the holder screen. Cop's CALL finalises the
  // pass via writeTelephoneAction; PASS (and mafia's CALL → no-op then
  // pass) advances or finalises via advanceTelephoneHolder.
  if (
    game.variants.cop &&
    phase === "telephone" &&
    game.round.telephone?.currentHolderId === me.id &&
    me.role &&
    store
  ) {
    const order = game.round.telephone?.holderOrder ?? [];
    const isLast = order[order.length - 1] === me.id;
    return (
      <TelephoneHolderScreen
        isCop={me.role === "cop"}
        isLastHolder={isLast}
        onCall={() => void writeTelephoneAction(store, game, true, order)}
        onPass={() => void advanceTelephoneHolder(store, game, me.id, order)}
      />
    );
  }

  // Persistent corner widget — sits alongside whichever phase body
  // renders below. Mutually exclusive with super-powers at game level
  // (wave 1), so the PhoneShell's power card and this widget never both
  // render in the same game.
  const widget = game.variants.cop && me.role ? (
    <Box
      sx={{
        position: "fixed",
        top: "0.6rem",
        right: "0.6rem",
        zIndex: 5,
        pointerEvents: "auto",
      }}
    >
      <RoleWidget
        role={me.role}
        callsMade={game.cop?.callsMade}
        hint={copHint(game, me, t)}
      />
    </Box>
  ) : null;

  if (game.phase === "ended") {
    return (
      <>
        <PhaseFader phaseKey={phaseKey}>
          <PhoneReckoning game={game} me={me} />
        </PhaseFader>
        {widget}
      </>
    );
  }
  if (me.status === "dead") {
    return (
      <>
        <PhaseFader phaseKey={phaseKey}><Spectator game={game} eliminated /></PhaseFader>
        {widget}
      </>
    );
  }
  const opponents = game.players.filter(p => p.id !== me.id && p.status === "alive");

  // Picker only renders while there's still something for this player to
  // pick — once their pick lands, PhaseView falls through to the
  // AimBarrel view directly (same phaseKey, so no extra fade).
  if (
    (phase === "commit" && !myCommitPhaseDone) ||
    (phase === "late_commit" && lateHalfPending)
  ) {
    return (
      <>
        <PhaseFader phaseKey={phaseKey}>
          <CommitPicker
            me={me}
            opponents={opponents}
            myCommit={myCommit}
            onSubmit={submitCommit}
            handSlots={handSlots}
            variantOn={!!game.variants.superPowers}
            phase={phase}
          />
        </PhaseFader>
        {widget}
      </>
    );
  }

  if (
    phase === "standoff" ||
    phase === "standoff_hold" ||
    phase === "late_commit" ||
    (phase === "commit" && myCommitPhaseDone)
  ) {
    const target = game.players.find(p => p.id === myCommit?.target);
    // Show the count only during the standoff countdown itself. During the
    // standoff_hold silent beat that follows, the count is hidden (mirrors
    // the big-screen StandoffStamp behaviour) and the barrel just shows the
    // locked target's jolly roger.
    return (
      <>
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
        {widget}
      </>
    );
  }

  if (phase === "withdraw") {
    const attackers = Object.entries(game.round.commits)
      .filter(([sid, c]) => sid !== me.id && c.target === me.id)
      .map(([sid]) => game.players.find(p => p.id === sid))
      .filter((p): p is Player => !!p);
    return (
      <>
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
        {widget}
      </>
    );
  }

  if (
    phase === "reveal_withdraw" ||
    phase === "reveal_bbb" ||
    phase === "reveal_others" ||
    phase === "split" ||
    phase === "grenade"
  ) {
    return (
      <>
        <PhaseFader phaseKey={phaseKey}><Spectator game={game} /></PhaseFader>
        {widget}
      </>
    );
  }

  // Telephone phase, non-holder: render the standard spectator-ish view
  // (we already early-returned for the active holder). Wrapped so the
  // role widget stays visible while the pass animation plays.
  if (phase === "telephone") {
    return (
      <>
        <PhaseFader phaseKey={phaseKey}><Spectator game={game} /></PhaseFader>
        {widget}
      </>
    );
  }

  return null;
}

function CommitPicker({ me, opponents, myCommit, onSubmit, handSlots, variantOn, phase }: {
  me: Player;
  opponents: Player[];
  myCommit?: { bullet?: BulletCard; target?: string };
  onSubmit: (id: string, partial: SubmitCommitPartial, opts?: SubmitCommitOpts) => Promise<void>;
  handSlots: HandSlot[];
  variantOn: boolean;
  phase: Game["round"]["phase"];
}) {
  const { t } = useTranslation();
  const [pick, setPick] = useState<{ load: BulletCard; slotIndex: number } | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [armSpecialist, setArmSpecialist] = useState(false);
  const [armTough, setArmTough] = useState(false);
  const [armInsane, setArmInsane] = useState(false);
  // Dead Eye (Kid) defers target until late_commit; Bloodhound
  // (Cunning) defers bullet. The picker renders only the half the
  // current phase wants from this holder. Both powers are revealed
  // on deal (public knowledge), so we don't gate on `!revealed` —
  // just check the card hasn't been used yet this game.
  const hasKid = variantOn && me.effects.some(
    e => e.kind === "the_kid" && !e.used,
  );
  const hasCunning = variantOn && me.effects.some(
    e => e.kind === "the_cunning" && !e.used,
  );
  const showBullet =
    (phase === "commit" && !hasCunning) ||
    (phase === "late_commit" && hasCunning);
  const showTarget =
    (phase === "commit" && !hasKid) ||
    (phase === "late_commit" && hasKid);
  const ready =
    (!showBullet || myCommit?.bullet !== undefined) &&
    (!showTarget || myCommit?.target !== undefined);
  const hasSpecialist = variantOn && me.effects.some(
    e => e.kind === "specialist" && !e.revealed && !e.used,
  );
  const hasTough = variantOn && me.effects.some(
    e => e.kind === "tough" && !e.revealed && !e.used,
  );
  const hasInsane = variantOn && me.effects.some(
    e => e.kind === "insane" && !e.revealed && !e.used,
  );
  // Spare Powder only fires when the holder plays B!B!B!. Auto-
  // resolve the discard at submit time: a CLICK if any remain after the
  // played B!B!B! is removed, otherwise a SHOT. The toggle clears when the
  // pick changes off B!B!B!.
  const offerSpecialist = hasSpecialist && pick?.load === "bang_bang_bang";
  if (!offerSpecialist && armSpecialist) {
    setArmSpecialist(false);
  }
  const specialistDiscard: BulletCard | null = (() => {
    if (!offerSpecialist || !armSpecialist || !pick) return null;
    const remaining = me.bullets.filter((_, i) => i !== pick.slotIndex);
    if (remaining.includes("clic")) return "clic";
    if (remaining.includes("bang")) return "bang";
    return null;
  })();

  if (ready) {
    const targetPlayer = opponents.find(o => o.id === myCommit?.target);
    const targetName = targetPlayer?.displayName;
    // Dead Eye in commit phase has only the bullet locked — the target
    // gets picked during late_commit. Show a "powder loaded" waiting state
    // instead of pretending we're aiming at something.
    const heading = targetName ? "AIMING AT" : "POWDER LOADED";
    const subline = targetName
      ? targetName
      : "Mark to be chosen at the standoff";
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
        <AimBarrel colorOrAvatar={targetPlayer?.colorOrAvatar ?? null} size={200} />
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
            {heading}
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
            {subline}
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
        {showBullet && showTarget
          ? t("phase.commit.pickTarget")
          : showTarget
          ? "Pick your mark"
          : "Load your powder"}
      </Box>

      {showTarget && (
        <TargetList
          opponents={opponents}
          selectedId={target}
          onPick={(id) => setTarget(id)}
        />
      )}

      {showBullet && (
        <Box sx={{ animation: `${slideUpIn} 450ms ease-out 80ms both` }}>
          <Hand
            slots={handSlots}
            selectedSlotIndex={pick?.slotIndex}
            onPick={(load, slotIndex) => setPick({ load, slotIndex })}
          />
        </Box>
      )}

      {showBullet && offerSpecialist && (
        <SpecialistCommitChoice armed={armSpecialist} onChange={setArmSpecialist} />
      )}

      {phase === "commit" && hasTough && (
        <ToughCommitChoice armed={armTough} onChange={setArmTough} />
      )}
      {phase === "commit" && hasInsane && (
        <InsaneCommitChoice armed={armInsane} onChange={setArmInsane} />
      )}

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
          disabled={(showBullet && !pick) || (showTarget && !target)}
          onClick={() => {
            if (showBullet && !pick) return;
            if (showTarget && !target) return;
            const partial: SubmitCommitPartial = {};
            if (showBullet && pick) partial.bullet = pick.load;
            if (showTarget && target) partial.target = target;
            onSubmit(me.id, partial, {
              specialistDiscard: specialistDiscard ?? undefined,
              armTough: armTough || undefined,
              armInsane: armInsane || undefined,
            });
          }}
          caption={(() => {
            // Bloodhound at commit only picks a mark — the disc already
            // shows it. Hint that the bullet is deferred so the player
            // knows the lock-in isn't the full call yet.
            if (phase === "commit" && !showBullet) return "powder loads at the standoff";
            // Dead Eye at commit only picks a bullet; the mark is called
            // during the standoff. Mirror Bloodhound's hint.
            if (phase === "commit" && !showTarget) return "mark called at the standoff";
            // In late_commit, the half locked at commit phase comes from
            // myCommit (Dead Eye → bullet, Bloodhound → target); the
            // in-flight half comes from local state. Resolve both so the
            // button reads "{bullet} → {mark}" for the full picture.
            const needsBullet = showBullet && !pick;
            const needsTarget = showTarget && !target;
            if (needsBullet || needsTarget) return t("phase.commit.selectCard");
            const bullet = pick?.load ?? myCommit?.bullet;
            const targetId = target ?? myCommit?.target;
            const bulletPart = bullet ? t(`load.${bullet}`) : null;
            const targetPart = targetId
              ? opponents.find(o => o.id === targetId)?.displayName ?? "?"
              : null;
            if (bulletPart && targetPart) return `${bulletPart} → ${targetPart}`;
            return bulletPart ?? targetPart ?? t("phase.commit.selectCard");
          })()}
        >
          {(showBullet ? pick : true) && (showTarget ? target : true)
            ? t("phase.commit.lockIn").toUpperCase()
            : t("phase.commit.ready").toUpperCase()}
        </Button>
      </Box>
    </Box>
  );
}

// Inline Specialist choice — only rendered when the player holds an unrevealed
// Specialist effect and has selected B!B!B! as their commit. Tapping a powder
// arms the save (it'll be discarded so the B!B!B! stays in the holder's hand
// after the round); tapping again clears it. The choice rides on the same
// Lock In button as the commit — no separate phase, no prompt, no wait.
// Spare Powder (Specialist) arm — only offered when the holder
// has picked B!B!B!. Auto-resolves the discarded kind at submit time
// (CLICK if any remain in hand, else SHOT), so the player only has to
// decide whether to save the Quickdraw at all.
function SpecialistCommitChoice({
  armed,
  onChange,
}: {
  armed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      sx={{
        marginBlock: "1.4rem",
        marginInline: "auto",
        maxWidth: "calc(4 * 75px + 3 * 0.45rem)",
        animation: `${fadeIn} 320ms ease-out both`,
      }}
    >
      <XMarksCheckbox
        checked={armed}
        onChange={onChange}
        label="Arm Spare Powder"
        hint="Save your Quickdraw — discard a click instead (or a shot if none remain)."
      />
    </Box>
  );
}

// Phantom Pain (Tough) arm: optional commit-time toggle. Lets the holder
// pre-claim their share if they end up struck or ducked this round.
// Resolver only consumes the power if the save actually fires — armed-
// but-not-needed stays in hand.
function ToughCommitChoice({
  armed,
  onChange,
}: {
  armed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      sx={{
        marginBlock: "1.4rem",
        marginInline: "auto",
        maxWidth: "calc(4 * 75px + 3 * 0.45rem)",
        animation: `${fadeIn} 320ms ease-out both`,
      }}
    >
      <XMarksCheckbox
        checked={armed}
        onChange={onChange}
        label="Arm Phantom Pain"
        hint="Claim a share this round even if ye take a wound or duck."
      />
    </Box>
  );
}

// Pocket Inferno (Insane) arm: commit-time toggle. Same place + visual as
// Phantom Pain so the player's power-card selections all sit together. If
// the holder takes a wound this round, the grenade detonates and the
// round terminates.
function InsaneCommitChoice({
  armed,
  onChange,
}: {
  armed: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      sx={{
        marginBlock: "1.4rem",
        marginInline: "auto",
        maxWidth: "calc(4 * 75px + 3 * 0.45rem)",
        animation: `${fadeIn} 320ms ease-out both`,
      }}
    >
      <XMarksCheckbox
        checked={armed}
        onChange={onChange}
        label="Arm Pocket Inferno"
        hint="Pull the pin. If ye take a wound this round, it goes off."
      />
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
//
// The refs in this component are intentionally mutated during render: that
// is the cross-fade's whole mechanism (freeze `displayed` during the fade
// window, keep `latestChildren` flowing). Both the latest-value mirror and
// the gated freeze are canonical render-cache patterns, so we suppress the
// new react-hooks/refs error at the call sites below.
const FADE_OUT_MS = 200;
function PhaseFader({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) {
  const [renderedKey, setRenderedKey] = useState(phaseKey);
  const [opacity, setOpacity] = useState(1);
  const latestChildren = useRef(children);
  // eslint-disable-next-line react-hooks/refs
  latestChildren.current = children;
  const displayed = useRef(children);
  if (phaseKey === renderedKey) {
    // eslint-disable-next-line react-hooks/refs
    displayed.current = children;
  }

  useLayoutEffect(() => {
    if (phaseKey === renderedKey) return;
    // Drive the fade choreography: snap to opacity 0, hold for FADE_OUT_MS
    // while the leaving phase is still mounted, then swap the displayed
    // tree and snap back to opacity 1. The synchronous setState here is
    // the fade's trigger — deferring it would race the CSS transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // Fill the body's visible area when content is short, but allow
        // growth past 100% when a phase's content is tall (commit picker
        // with multiple power chips) so the PhoneShell body's overflow-y:
        // auto can actually scroll. `flex: 1` would crush the content
        // back to the body's height and never trigger overflow.
        minHeight: "100%",
      }}
    >
      {/* eslint-disable-next-line react-hooks/refs */}
      {displayed.current}
    </Box>
  );
}
