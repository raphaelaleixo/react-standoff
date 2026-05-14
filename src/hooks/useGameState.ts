import { useEffect, useState, useCallback } from "react";
import type { BulletCard, Commit, Game, Player } from "../game/types";
import { resolveRound, type ResolveRoundResult } from "../game/resolver";
import { startNextRound, endGameStatus } from "../game/transitions";
import { PUBLIC_POWER_KINDS } from "../game/powerKinds";
import type { GameStore } from "./gameStore";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS, WITHDRAW_DURATION_MS } from "../lib/phaseDurations";

const STANDOFF_MS = STANDOFF_DURATION_MS;
const STANDOFF_HOLD = STANDOFF_HOLD_MS;
const WITHDRAW_MS = WITHDRAW_DURATION_MS;
const REVEAL_WITHDRAW_MS = 2500;
// PowerRevealOverlay timing: stepMs (3800) + Fade exit (620) per card,
// matched to the constants in components/powers/PowerRevealOverlay.tsx.
// reveal_withdraw needs to outlast any cards it triggers (Dragon Skin,
// Ironhide) so they get to play fully before the next phase starts.
const POWER_CARD_MS = 4420;
const REVEAL_WITHDRAW_TAIL_MS = 320;
const REVEAL_BBB_MS = 5000;
const REVEAL_OTHERS_MS = 5000;
const GRENADE_EXPLOSION_MS = 2800;
// Split-phase budget: notes-leave-table fade (~300ms) → small beat → cash
// tickers (~700ms) → small beat → next round draws in. GameBoard runs the
// orchestration off `phaseStartedAt`; this is the timer that finally writes
// the resolved players + opens the next round.
const SPLIT_MS = 1800;

function alivePlayers(game: Game): Player[] {
  return game.players.filter(p => p.status === "alive");
}

// Dead Eye / Bloodhound split the commit lock — the holder is
// considered "committed" at the commit phase with only their early half
// (Kid → bullet, Cunning → target). They fill the deferred half during
// the late_commit phase.
function hasKid(p: Player): boolean {
  return p.effects.some(e => e.kind === "the_kid");
}
function hasCunning(p: Player): boolean {
  return p.effects.some(e => e.kind === "the_cunning");
}

// "Has enough to leave commit phase." Kid needs bullet only, Cunning
// needs target only, everyone else needs both.
function commitReadyForStandoff(p: Player, c: Commit | undefined): boolean {
  if (!c) return false;
  if (hasKid(p)) return c.bullet !== undefined;
  if (hasCunning(p)) return c.target !== undefined;
  return c.bullet !== undefined && c.target !== undefined;
}

// "Has both halves locked in." Used as the gate to leave late_commit.
function commitFullyLocked(c: Commit | undefined): boolean {
  return !!c && c.bullet !== undefined && c.target !== undefined;
}

function allAliveCommitted(game: Game): boolean {
  return alivePlayers(game).every(p =>
    commitReadyForStandoff(p, game.round.commits[p.id]),
  );
}

function anyLateHalfPending(game: Game): boolean {
  return alivePlayers(game).some(p => {
    const c = game.round.commits[p.id];
    if (!c) return false;
    if (hasKid(p)) return c.target === undefined;
    if (hasCunning(p)) return c.bullet === undefined;
    return false;
  });
}

// Ends a round early when the resolver flags roundTerminated. Mirrors the
// split→next-round transition but is kicked off from any of the three
// re-resolve beats, after a 2.8s linger so the explosion overlay can play.
function endRoundFromGrenade(
  store: GameStore,
  game: Game,
  result: ResolveRoundResult,
  serverNowMs: number,
): void {
  const resolved = { ...game, players: result.players };
  const status = endGameStatus(resolved);
  if (status.ended) {
    store.update("", { phase: "ended", players: result.players });
    return;
  }
  const nextGame = startNextRound(resolved, serverNowMs);
  store.set(nextGame);
}

// Runs the state machine + write helpers against a pluggable storage
// adapter. Production wires this to a Firebase store (rooms/{id}/game);
// the dev mock wires it to an in-memory store so scenarios play out
// without touching Firebase.
export function useGameState(
  store: GameStore | null,
  serverNow: () => number,
) {
  const [game, setGame] = useState<Game | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!store) return;
    setLoaded(false);
    const unsub = store.subscribe(g => {
      setGame(g);
      setLoaded(true);
    });
    return unsub;
  }, [store]);

  // ─────────── Auto-transitions (every-client idempotent) ───────────

  // commit → standoff
  //
  // Holds the transition long enough for any synthetic reveal cards to
  // play out on a clean stage before the standoff countdown begins:
  // - Round 1 public-on-deal cards (Dead Eye, Bloodhound).
  // - Pocket Inferno when the holder armed it at commit.
  // In real games this is usually a no-op (humans take longer to commit
  // than the cards take to play). In the mock — and any future
  // bot/seed-fast scenario — every commit lands at once, so without
  // this hold the standoff would start while the card is still mid-air.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "commit") return;
    if (!allAliveCommitted(game)) return;
    let cardCount = 0;
    if (game.round.number === 1) {
      for (const p of game.players) {
        for (const e of p.effects) {
          if (PUBLIC_POWER_KINDS.has(e.kind) && e.revealed) cardCount += 1;
        }
      }
    }
    if (game.round.activations.insane) cardCount += 1;
    const holdMs = cardCount > 0 ? cardCount * POWER_CARD_MS + REVEAL_WITHDRAW_TAIL_MS : 0;
    const elapsed = serverNow() - game.round.phaseStartedAt;
    const remaining = Math.max(0, holdMs - elapsed);
    const fire = () => {
      store.update("round", {
        phase: "standoff",
        phaseStartedAt: store.serverTimestamp(),
      });
    };
    if (remaining === 0) {
      fire();
      return;
    }
    const t = setTimeout(fire, remaining);
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // standoff → standoff_hold (timed; the count animation plays out, then we
  // hand off to a silent hold phase where the targeting lines draw in).
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "standoff") return;
    const remaining = STANDOFF_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      store.update("round", {
        phase: "standoff_hold",
        phaseStartedAt: store.serverTimestamp(),
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // standoff_hold → late_commit | withdraw (timed; lines have drawn in
  // by now). If any Dead Eye / Bloodhound is still missing their
  // deferred half, route through the late_commit phase so they can fill
  // it in. Otherwise advance straight to withdraw.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "standoff_hold") return;
    const remaining = STANDOFF_HOLD - (serverNow() - game.round.phaseStartedAt);
    const next = anyLateHalfPending(game) ? "late_commit" : "withdraw";
    const fire = () => {
      store.update("round", {
        phase: next,
        phaseStartedAt: store.serverTimestamp(),
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // late_commit → withdraw. Auto-advances the moment every alive seat's
  // commit has both halves locked in. No timer — we wait on the late
  // pickers (Kid's target, Cunning's bullet) the same way we wait on the
  // commit phase to seat everyone in the first place.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "late_commit") return;
    const allFull = alivePlayers(game).every(p =>
      commitFullyLocked(game.round.commits[p.id]),
    );
    if (!allFull) return;
    store.update("round", {
      phase: "withdraw",
      phaseStartedAt: store.serverTimestamp(),
    });
  }, [store, game]);

  // withdraw → reveal_withdraw (timed; locks yields and persists the resolution
  // for the reveal-phase visualizations to read).
  //
  // We deliberately do NOT write `players: result.players` here. The reveal
  // phases (reveal_withdraw → reveal_bbb → reveal_others → split) compute
  // visual deltas (shame +1 for duckers, wound +1 for struck) on top of the
  // pre-resolution `players`. Persisting the post-resolution state at this
  // beat would double-count those deltas in the UI. The resolved players
  // are applied at the split → next-round transition instead.
  //
  // Insane is suppressed for this resolve — the grenade can only fire as a
  // consequence of the holder being shot, and the audience needs to see
  // that shot animate (reveal_bbb / reveal_others) before BOOM lands. The
  // real grenade resolve runs at the reveal_others → next handoff.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "withdraw") return;
    const remaining = WITHDRAW_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const result = resolveRound(
        game.round.commits,
        game.players,
        game.round.loot,
        { ...game.round.activations, insane: undefined },
      );
      store.update("", {
        "round/phase": "reveal_withdraw",
        "round/phaseStartedAt": store.serverTimestamp(),
        "round/resolution": result.resolution,
        discardedBullets: [...game.discardedBullets, ...result.discardedBullets],
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // reveal_withdraw → reveal_bbb (timed; pure visual handoff)
  //
  // If the withdraw resolve pushed any Dragon Skin / Ironhide activations,
  // hold here long enough for the big-screen reveal overlay to play those
  // cards (otherwise reveal_bbb takes over while the card is still on
  // screen and the bang animations bleed under it).
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "reveal_withdraw") return;
    const cards = (game.round.resolution?.powerActivations ?? []).filter(
      a =>
        a.kind === "dragon_skin" ||
        a.kind === "unbreakable" ||
        a.kind === "specialist",
    ).length;
    const totalMs = cards > 0
      ? cards * POWER_CARD_MS + REVEAL_WITHDRAW_TAIL_MS
      : REVEAL_WITHDRAW_MS;
    const remaining = totalMs - (serverNow() - game.round.phaseStartedAt);
    const fire = () => store.update("round", {
      phase: "reveal_bbb",
      phaseStartedAt: store.serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // reveal_bbb → reveal_others (or grenade, if the holder was BBB-shot)
  //
  // The grenade detonates the moment the holder takes a wound. To see if a
  // quickdraw wound is enough, we resolve with bang shots set aside — only
  // BBB lands. If that's enough to wound the holder, the grenade fires now
  // (right after the quickdraw animation). Otherwise we run the normal
  // bang-inclusive resolve (still with insane suppressed) and advance to
  // reveal_others.
  //
  // Specialist (Spare Powder) is bundled into the commit, so the
  // bang-inclusive resolve at this handoff is what picks it up.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "reveal_bbb") return;
    const remaining = REVEAL_BBB_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      // BBB-only view of commits: bang shots are set aside (bullet → undefined)
      // so they're skipped by both the shots loop and the bullet-consumption
      // pass. Their cards stay in hand if the grenade ends the round here.
      const bbbOnlyCommits: Record<string, Commit> = {};
      for (const [pid, c] of Object.entries(game.round.commits)) {
        bbbOnlyCommits[pid] = c.bullet === "bang" ? { ...c, bullet: undefined } : c;
      }
      const bbbResult = resolveRound(
        bbbOnlyCommits, game.players, game.round.loot, game.round.activations,
      );
      if (bbbResult.resolution.roundTerminated) {
        store.update("", {
          "round/phase": "grenade",
          "round/phaseStartedAt": store.serverTimestamp(),
          "round/resolution": bbbResult.resolution,
          discardedBullets: [...game.discardedBullets, ...bbbResult.discardedBullets],
        });
        setTimeout(
          () => endRoundFromGrenade(store, game, bbbResult, serverNow()),
          GRENADE_EXPLOSION_MS,
        );
        return;
      }
      const result = resolveRound(
        game.round.commits,
        game.players,
        game.round.loot,
        { ...game.round.activations, insane: undefined },
      );
      store.update("", {
        "round/phase": "reveal_others",
        "round/phaseStartedAt": store.serverTimestamp(),
        "round/resolution": result.resolution,
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // reveal_others → tough_reveal (if Tough fired) | split (if not)
  //
  // Tough is now armed at commit time (commits[pid].armTough). We hold the
  // copy-into-activations until this handoff so the resolver doesn't fire
  // the card during earlier resolves (which would land the Phantom Pain
  // reveal before the strike animation). Read armed seats, write
  // activations.tough, then re-resolve.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "reveal_others") return;
    const remaining = REVEAL_OTHERS_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const armed = Object.entries(game.round.commits)
        .filter(([, c]) => c.armTough)
        .map(([pid]) => pid);
      const activations = armed.length > 0
        ? { ...game.round.activations, tough: armed }
        : game.round.activations;
      const result = resolveRound(
        game.round.commits, game.players, game.round.loot, activations,
      );
      if (result.resolution.roundTerminated) {
        store.update("", {
          "round/phase": "grenade",
          "round/phaseStartedAt": store.serverTimestamp(),
          "round/resolution": result.resolution,
        });
        setTimeout(
          () => endRoundFromGrenade(store, game, result, serverNow()),
          GRENADE_EXPLOSION_MS,
        );
        return;
      }
      const before = game.round.resolution?.powerActivations.length ?? 0;
      const after = result.resolution.powerActivations.length;
      const newCards = after - before;
      const updates: Record<string, unknown> = {
        "round/phase": newCards > 0 ? "tough_reveal" : "split",
        "round/phaseStartedAt": store.serverTimestamp(),
        "round/resolution": result.resolution,
      };
      if (armed.length > 0) {
        updates["round/activations/tough"] = armed;
      }
      store.update("", updates);
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // tough_reveal → split (timed hold so the Phantom Pain card finishes
  // playing before the split loot animation begins).
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "tough_reveal") return;
    const cards = (game.round.resolution?.powerActivations ?? []).filter(
      a => a.kind === "tough",
    ).length;
    const totalMs = Math.max(1, cards) * POWER_CARD_MS + REVEAL_WITHDRAW_TAIL_MS;
    const remaining = totalMs - (serverNow() - game.round.phaseStartedAt);
    const fire = () => store.update("round", {
      phase: "split",
      phaseStartedAt: store.serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // split → next round (commit) OR ended (no recap pause; commit phase is itself
  // untimed and serves as the disconnect-pause boundary).
  //
  // This is also where the round's resolution actually lands on player state:
  // wounds, shame, status (eliminations), and cash awards. Holding the apply
  // until now lets the reveal phases animate visual deltas on top of the
  // pre-resolution baseline without double-counting.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "split") return;
    const remaining = SPLIT_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const result = resolveRound(
        game.round.commits, game.players, game.round.loot, game.round.activations,
      );
      const resolved = { ...game, players: result.players };
      const status = endGameStatus(resolved);
      if (status.ended) {
        store.update("", {
          phase: "ended",
          players: result.players,
        });
        return;
      }
      const nextGame = startNextRound(resolved, serverNow());
      store.set(nextGame);
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // ─────────── Player-side write helpers ───────────

  // Accepts partial commits: regular players pass both bullet+target;
  // Dead Eye passes bullet-only at commit time and target-only during
  // late_commit; Bloodhound does the inverse. Each call writes whichever
  // fields are present, leaving the others untouched.
  const submitCommit = useCallback(
    async (
      playerId: string,
      partial: { bullet?: BulletCard; target?: string },
      opts?: {
        specialistDiscard?: BulletCard;
        armTough?: boolean;
        armInsane?: boolean;
      },
    ) => {
      if (!store) return;
      const updates: Record<string, unknown> = {};
      if (partial.bullet !== undefined) {
        updates[`commits/${playerId}/bullet`] = partial.bullet;
      }
      if (partial.target !== undefined) {
        updates[`commits/${playerId}/target`] = partial.target;
      }
      if (opts?.armTough) {
        updates[`commits/${playerId}/armTough`] = true;
      }
      // Specialist + Insane write into activations atomically with the
      // commit so the big-screen reveal overlay can fire as soon as the
      // player taps commit.
      if (opts?.specialistDiscard) {
        updates["activations/specialist"] = {
          playerId,
          discardedBulletKind: opts.specialistDiscard,
        };
      }
      if (opts?.armInsane) {
        updates["activations/insane"] = { playerId };
      }
      if (Object.keys(updates).length === 0) return;
      await store.update("round", updates);
    },
    [store],
  );

  const submitDuck = useCallback(
    async (playerId: string, withdrew: boolean) => {
      if (!store) return;
      if (withdrew) {
        await store.update(`round/commits/${playerId}`, { withdrew: true });
      } else {
        // Stay: ensure the field is cleared (default behavior). Use remove
        // to avoid persisting `false`.
        await store.remove(`round/commits/${playerId}/withdrew`);
      }
    },
    [store],
  );

  const submitSpecialist = useCallback(
    async (playerId: string, discardedBulletKind: BulletCard) => {
      if (!store) return;
      await store.update("round/activations", {
        specialist: { playerId, discardedBulletKind },
      });
    },
    [store],
  );

  const loading = store !== null && !loaded;

  return { game, loading, submitCommit, submitDuck, submitSpecialist };
}
