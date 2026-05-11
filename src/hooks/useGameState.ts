import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, update, remove, serverTimestamp } from "firebase/database";
import { database } from "../firebase";
import type { BulletCard, Commit, Game, Player } from "../game/types";
import { normalizeGame } from "../game/deserialize";
import { resolveRound } from "../game/resolver";
import { startNextRound, endGameStatus } from "../game/transitions";
import { useServerTime } from "./useServerTime";
import { STANDOFF_DURATION_MS, STANDOFF_HOLD_MS, WITHDRAW_DURATION_MS } from "../lib/phaseDurations";

const STANDOFF_MS = STANDOFF_DURATION_MS;
const STANDOFF_HOLD = STANDOFF_HOLD_MS;
const WITHDRAW_MS = WITHDRAW_DURATION_MS;
const REVEAL_WITHDRAW_MS = 2500;
const REVEAL_BBB_MS = 5000;
const REVEAL_OTHERS_MS = 5000;
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

export function useGameState(roomId: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const { serverNow } = useServerTime();

  useEffect(() => {
    if (!roomId) return;
    const gameRef = ref(database, `rooms/${roomId}/game`);
    const unsub = onValue(gameRef, snap => {
      setGame(normalizeGame(snap.val()));
      setLoadedFor(roomId);
    });
    return unsub;
  }, [roomId]);

  // ─────────── Auto-transitions (every-client idempotent) ───────────

  // commit → standoff
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "commit") return;
    if (!allAliveCommitted(game)) return;
    update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "standoff",
      phaseStartedAt: serverTimestamp(),
    });
  }, [roomId, game]);

  // standoff → standoff_hold (timed; the count animation plays out, then we
  // hand off to a silent hold phase where the targeting lines draw in).
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "standoff") return;
    const remaining = STANDOFF_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      update(ref(database, `rooms/${roomId}/game/round`), {
        phase: "standoff_hold",
        phaseStartedAt: serverTimestamp(),
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // standoff_hold → withdraw (timed; lines have drawn in by now, this is the
  // breath before the yield countdown starts).
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "standoff_hold") return;
    const remaining = STANDOFF_HOLD - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      update(ref(database, `rooms/${roomId}/game/round`), {
        phase: "withdraw",
        phaseStartedAt: serverTimestamp(),
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

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
    if (!roomId || !game) return;
    if (game.round.phase !== "withdraw") return;
    const remaining = WITHDRAW_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const result = resolveRound(game.round.commits, game.players, game.round.loot);
      update(ref(database, `rooms/${roomId}/game`), {
        "round/phase": "reveal_withdraw",
        "round/phaseStartedAt": serverTimestamp(),
        "round/resolution": result.resolution,
        discardedBullets: [...game.discardedBullets, ...result.discardedBullets],
      });
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // reveal_withdraw → reveal_bbb (timed; pure visual handoff)
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "reveal_withdraw") return;
    const remaining = REVEAL_WITHDRAW_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "reveal_bbb",
      phaseStartedAt: serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // reveal_bbb → reveal_others (animation pace)
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "reveal_bbb") return;
    const remaining = REVEAL_BBB_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "reveal_others",
      phaseStartedAt: serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // reveal_others → split
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "reveal_others") return;
    const remaining = REVEAL_OTHERS_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => update(ref(database, `rooms/${roomId}/game/round`), {
      phase: "split",
      phaseStartedAt: serverTimestamp(),
    });
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // split → next round (commit) OR ended (no recap pause; commit phase is itself
  // untimed and serves as the disconnect-pause boundary).
  //
  // This is also where the round's resolution actually lands on player state:
  // wounds, shame, status (eliminations), and cash awards. Holding the apply
  // until now lets the reveal phases animate visual deltas on top of the
  // pre-resolution baseline without double-counting.
  useEffect(() => {
    if (!roomId || !game) return;
    if (game.round.phase !== "split") return;
    const remaining = SPLIT_MS - (serverNow() - game.round.phaseStartedAt);
    const fire = () => {
      const result = resolveRound(game.round.commits, game.players, game.round.loot);
      const resolved = { ...game, players: result.players };
      const status = endGameStatus(resolved);
      if (status.ended) {
        update(ref(database, `rooms/${roomId}/game`), {
          phase: "ended",
          players: result.players,
        });
        return;
      }
      const nextGame = startNextRound(resolved, serverNow());
      set(ref(database, `rooms/${roomId}/game`), nextGame);
    };
    const t = setTimeout(fire, Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [roomId, game, serverNow]);

  // ─────────── Player-side write helpers ───────────

  const submitCommit = useCallback(
    async (playerId: string, bullet: BulletCard, target: string) => {
      if (!roomId) return;
      const c: Commit = { bullet, target };
      await update(ref(database, `rooms/${roomId}/game/round/commits/${playerId}`), c);
    },
    [roomId],
  );

  const submitDuck = useCallback(
    async (playerId: string, withdrew: boolean) => {
      if (!roomId) return;
      if (withdrew) {
        await update(ref(database, `rooms/${roomId}/game/round/commits/${playerId}`), { withdrew: true });
      } else {
        // Stay: ensure the field is cleared (default behavior). Use remove to avoid persisting `false`.
        await remove(ref(database, `rooms/${roomId}/game/round/commits/${playerId}/withdrew`));
      }
    },
    [roomId],
  );

  const loading = roomId !== undefined && loadedFor !== roomId;

  return { game, loading, submitCommit, submitDuck };
}
