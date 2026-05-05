import { renderHook } from "@testing-library/react";
import { useRevealBanner } from "./useRevealBanner";
import type { Game, Player, RoundResolution } from "../game/types";

function makePlayer(over: Partial<Player> & { id: string; displayName: string }): Player {
  return {
    id: over.id,
    displayName: over.displayName,
    colorOrAvatar: over.colorOrAvatar ?? "generic",
    bullets: over.bullets ?? [],
    cash: over.cash ?? [],
    wounds: over.wounds ?? 0,
    shame: over.shame ?? 0,
    status: over.status ?? "alive",
    effects: over.effects ?? [],
  };
}

function makeResolution(over: Partial<RoundResolution>): RoundResolution {
  return {
    shots: over.shots ?? [],
    ducks: over.ducks ?? [],
    standing: over.standing ?? [],
    woundedThisRound: over.woundedThisRound ?? {},
    eliminated: over.eliminated ?? [],
    awards: over.awards ?? {},
    carryover: over.carryover ?? [],
  };
}

const baseGame: Game = {
  seed: "x",
  phase: "in_progress",
  players: [
    makePlayer({ id: "a", displayName: "A" }),
    makePlayer({ id: "b", displayName: "B" }),
  ],
  round: {
    number: 1,
    phase: "reveal_bbb",
    phaseStartedAt: 0,
    loot: [],
    commits: {},
    resolution: makeResolution({
      shots: [{ shooter: "a", target: "b", card: "bang_bang_bang", outcome: "hit" }],
    }),
  },
  bankDeck: [],
  discardedBullets: [],
};

describe("useRevealBanner", () => {
  it("returns null when game is missing", () => {
    const { result } = renderHook(() => useRevealBanner(null));
    expect(result.current).toBeNull();
  });

  it("returns broadside banner during reveal_bbb when bbb hits exist", () => {
    const { result } = renderHook(() => useRevealBanner(baseGame));
    expect(result.current).toEqual({ kind: "broadside", struckCount: 1 });
  });

  it("returns null when phase is not a reveal", () => {
    const g: Game = { ...baseGame, round: { ...baseGame.round, phase: "commit" } };
    const { result } = renderHook(() => useRevealBanner(g));
    expect(result.current).toBeNull();
  });

  it("returns kill banner when someone was eliminated this round", () => {
    const g: Game = {
      ...baseGame,
      players: [
        ...baseGame.players,
        makePlayer({ id: "c", displayName: "Stede Bonnet", colorOrAvatar: "stede_bonnet", wounds: 3, status: "dead" }),
      ],
      round: {
        ...baseGame.round,
        phase: "reveal_others",
        resolution: makeResolution({ eliminated: ["c"] }),
      },
    };
    const { result } = renderHook(() => useRevealBanner(g));
    expect(result.current).toEqual({ kind: "kill", name: "Stede Bonnet" });
  });
});
