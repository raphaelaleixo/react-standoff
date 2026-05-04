import { useMemo, useState } from "react";
import type { BulletCard, Commit, Game, Player, RoundPhase } from "../../game/types";

export interface MockGameActions {
  setPhase(phase: RoundPhase): void;
  setRoundNumber(n: number): void;
  setCommit(playerId: string, partial: Partial<Commit>): void;
  setWounds(playerId: string, n: number): void;
  setStatus(playerId: string, status: Player["status"]): void;
  setShame(playerId: string, n: number): void;
  reset(): void;
}

export interface UseMockGameStateResult {
  game: Game;
  actions: MockGameActions;
}

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

const updatePlayer = (game: Game, playerId: string, patch: Partial<Player>): Game => ({
  ...game,
  players: game.players.map(p => (p.id === playerId ? { ...p, ...patch } : p)),
});

export function useMockGameState(initial: Game): UseMockGameStateResult {
  const [game, setGame] = useState<Game>(initial);

  const actions = useMemo<MockGameActions>(() => ({
    setPhase: (phase) =>
      setGame(g => ({ ...g, round: { ...g.round, phase } })),

    setRoundNumber: (n) =>
      setGame(g => ({ ...g, round: { ...g.round, number: clamp(Math.trunc(n), 1, 8) } })),

    setCommit: (playerId, partial) =>
      setGame(g => {
        const prev = g.round.commits[playerId] ?? {};
        const merged: Commit = { ...prev, ...partial };
        // Strip keys explicitly set to undefined so they don't linger as "present" in serialization.
        const next: Commit = {};
        if (merged.bullet !== undefined) next.bullet = merged.bullet as BulletCard;
        if (merged.target !== undefined) next.target = merged.target;
        if (merged.withdrew !== undefined) next.withdrew = merged.withdrew;
        return {
          ...g,
          round: { ...g.round, commits: { ...g.round.commits, [playerId]: next } },
        };
      }),

    setWounds: (playerId, n) => {
      const wounds = clamp(Math.trunc(n), 0, 3) as Player["wounds"];
      setGame(g => updatePlayer(g, playerId, { wounds }));
    },

    setStatus: (playerId, status) =>
      setGame(g => updatePlayer(g, playerId, { status })),

    setShame: (playerId, n) => {
      const shame = Math.max(Math.trunc(n), 0);
      setGame(g => updatePlayer(g, playerId, { shame }));
    },

    reset: () => setGame(initial),
  }), [initial]);

  return { game, actions };
}
