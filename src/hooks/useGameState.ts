import { useEffect, useState, useCallback } from "react";
import type { BulletCard, Commit, Game, Player } from "../game/types";
import { resolveRound, type ResolveRoundResult } from "../game/resolver";
import { startNextRound, endGameStatus } from "../game/transitions";
import { eligibleForSpecialist, eligibleForTough } from "../game/powers";
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
const SPECIALIST_PROMPT_MS = 10000;
const TOUGH_PROMPT_MS = 10000;
const GRENADE_EXPLOSION_MS = 2800;
// Split-phase budget: notes-leave-table fade (~300ms) → small beat → cash
// tickers (~700ms) → small beat → next round draws in. GameBoard runs the
// orchestration off `phaseStartedAt`; this is the timer that finally writes
// the resolved players + opens the next round.
const SPLIT_MS = 1800;

function alivePlayers(game: Game): Player[] {
  return game.players.filter(p => p.status === "alive");
}

function allAliveCommitted(game: Game): boolean {
  return alivePlayers(game).every(p => {
    const c = game.round.commits[p.id];
    return !!c && c.bullet !== undefined && c.target !== undefined;
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
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "commit") return;
    if (!allAliveCommitted(game)) return;
    store.update("round", {
      phase: "standoff",
      phaseStartedAt: store.serverTimestamp(),
    });
  }, [store, game]);

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

  // standoff_hold → withdraw (timed; lines have drawn in by now, this is the
  // breath before the yield countdown starts).
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "standoff_hold") return;
    const remaining = STANDOFF_HOLD - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      store.update("round", {
        phase: "withdraw",
        phaseStartedAt: store.serverTimestamp(),
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // withdraw → reveal_withdraw (timed; locks yields and persists the resolution
  // for the reveal-phase visualizations to read).
  //
  // We deliberately do NOT write `players: result.players` here. The reveal
  // phases (reveal_withdraw → reveal_bbb → reveal_others → split) compute
  // visual deltas (shame +1 for duckers, wound +1 for struck) on top of the
  // pre-resolution `players`. Persisting the post-resolution state at this
  // beat would double-count those deltas in the UI. The resolved players
  // are applied at the split → next-round transition instead.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "withdraw") return;
    const remaining = WITHDRAW_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const result = resolveRound(
        game.round.commits,
        game.players,
        game.round.loot,
        game.round.activations,
      );
      if (result.resolution.roundTerminated) {
        // Insane grenade fired. Jump to the dedicated `grenade` phase so the
        // big screen renders the explosion choreography (and so the normal
        // reveal_withdraw → reveal_bbb chain can't bleed in during the
        // linger window).
        store.update("", {
          "round/phase": "grenade",
          "round/phaseStartedAt": store.serverTimestamp(),
          "round/resolution": result.resolution,
          discardedBullets: [...game.discardedBullets, ...result.discardedBullets],
        });
        setTimeout(
          () => endRoundFromGrenade(store, game, result, serverNow()),
          GRENADE_EXPLOSION_MS,
        );
        return;
      }
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
      a => a.kind === "dragon_skin" || a.kind === "unbreakable",
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

  // reveal_bbb → specialist_prompt (animation pace; pure phase handoff)
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "reveal_bbb") return;
    const remaining = REVEAL_BBB_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => store.update("round", {
      phase: "specialist_prompt",
      phaseStartedAt: store.serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // specialist_prompt → reveal_others
  // Auto-skips when the variant is off or no eligible player; otherwise waits
  // up to SPECIALIST_PROMPT_MS for an activation, then re-resolves so any
  // submitted activation lands in `round/resolution` before reveal_others.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "specialist_prompt") return;
    if (!game.variants.superPowers) {
      store.update("round", {
        phase: "reveal_others",
        phaseStartedAt: store.serverTimestamp(),
      });
      return;
    }
    const eligible = game.players.find(p => eligibleForSpecialist(game, p.id));
    const fire = () => {
      const result = resolveRound(
        game.round.commits, game.players, game.round.loot, game.round.activations,
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
      store.update("", {
        "round/phase": "reveal_others",
        "round/phaseStartedAt": store.serverTimestamp(),
        "round/resolution": result.resolution,
      });
    };
    if (!eligible) {
      fire();
      return;
    }
    const remaining = SPECIALIST_PROMPT_MS - (serverNow() - game.round.phaseStartedAt);
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // reveal_others → tough_prompt (animation pace; pure phase handoff)
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "reveal_others") return;
    const remaining = REVEAL_OTHERS_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => store.update("round", {
      phase: "tough_prompt",
      phaseStartedAt: store.serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [store, game, serverNow]);

  // tough_prompt → split
  // Auto-skips when the variant is off or no eligible player; otherwise waits
  // up to TOUGH_PROMPT_MS for an activation, then re-resolves so any submitted
  // activation lands in `round/resolution` before split.
  useEffect(() => {
    if (!store || !game) return;
    if (game.round.phase !== "tough_prompt") return;
    if (!game.variants.superPowers) {
      store.update("round", {
        phase: "split",
        phaseStartedAt: store.serverTimestamp(),
      });
      return;
    }
    const eligible = game.players.find(p => eligibleForTough(game, p.id));
    const fire = () => {
      const result = resolveRound(
        game.round.commits, game.players, game.round.loot, game.round.activations,
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
      store.update("", {
        "round/phase": "split",
        "round/phaseStartedAt": store.serverTimestamp(),
        "round/resolution": result.resolution,
      });
    };
    if (!eligible) {
      fire();
      return;
    }
    const remaining = TOUGH_PROMPT_MS - (serverNow() - game.round.phaseStartedAt);
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

  const submitCommit = useCallback(
    async (playerId: string, bullet: BulletCard, target: string) => {
      if (!store) return;
      const c: Commit = { bullet, target };
      await store.update(`round/commits/${playerId}`, c as unknown as Record<string, unknown>);
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

  const submitTough = useCallback(
    async (playerId: string) => {
      if (!store) return;
      await store.update("round/activations", { tough: [playerId] });
    },
    [store],
  );

  const submitInsane = useCallback(
    async (playerId: string) => {
      if (!store) return;
      await store.update("round/activations", { insane: { playerId } });
    },
    [store],
  );

  const loading = store !== null && !loaded;

  return { game, loading, submitCommit, submitDuck, submitSpecialist, submitTough, submitInsane };
}
