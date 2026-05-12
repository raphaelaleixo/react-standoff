import { describe, expect, test } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Game, Player } from "../../game/types";
import { useMockGameState } from "./useMockGameState";

const player = (id: string, overrides: Partial<Player> = {}): Player => ({
  id,
  displayName: id.toUpperCase(),
  colorOrAvatar: "blackbeard",
  bullets: [],
  cash: [],
  wounds: 0,
  shame: 0,
  status: "alive",
  effects: [],
  ...overrides,
});

const baseGame = (): Game => ({
  phase: "in_progress",
  players: [player("a"), player("b"), player("c")],
  round: {
    number: 2,
    phase: "commit",
    phaseStartedAt: 0,
    loot: [],
    commits: { a: { bullet: "bang", target: "b" } },
    activations: {},
  },
  bankDeck: [],
  discardedBullets: [],
  seed: "test",
  variants: { superPowers: false },
});

describe("useMockGameState", () => {
  test("exposes the initial game", () => {
    const initial = baseGame();
    const { result } = renderHook(() => useMockGameState(initial));
    expect(result.current.game).toEqual(initial);
  });

  test("setPhase updates round.phase", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setPhase("split"));
    expect(result.current.game.round.phase).toBe("split");
  });

  test("setRoundNumber clamps to [1, 8]", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setRoundNumber(5));
    expect(result.current.game.round.number).toBe(5);

    act(() => result.current.actions.setRoundNumber(0));
    expect(result.current.game.round.number).toBe(1);

    act(() => result.current.actions.setRoundNumber(99));
    expect(result.current.game.round.number).toBe(8);
  });

  test("setCommit merges partial commits and clears fields with undefined", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setCommit("a", { target: "c" }));
    expect(result.current.game.round.commits.a).toEqual({ bullet: "bang", target: "c" });

    act(() => result.current.actions.setCommit("a", { bullet: undefined }));
    expect(result.current.game.round.commits.a).toEqual({ target: "c" });

    act(() => result.current.actions.setCommit("b", { withdrew: true }));
    expect(result.current.game.round.commits.b).toEqual({ withdrew: true });
  });

  test("setWounds clamps to [0, 3]", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));

    act(() => result.current.actions.setWounds("a", 2));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(2);

    act(() => result.current.actions.setWounds("a", -1));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(0);

    act(() => result.current.actions.setWounds("a", 7));
    expect(result.current.game.players.find(p => p.id === "a")?.wounds).toBe(3);
  });

  test("setStatus toggles between alive and dead", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setStatus("a", "dead"));
    expect(result.current.game.players.find(p => p.id === "a")?.status).toBe("dead");
    act(() => result.current.actions.setStatus("a", "alive"));
    expect(result.current.game.players.find(p => p.id === "a")?.status).toBe("alive");
  });

  test("setShame clamps to >= 0", () => {
    const { result } = renderHook(() => useMockGameState(baseGame()));
    act(() => result.current.actions.setShame("a", 4));
    expect(result.current.game.players.find(p => p.id === "a")?.shame).toBe(4);
    act(() => result.current.actions.setShame("a", -3));
    expect(result.current.game.players.find(p => p.id === "a")?.shame).toBe(0);
  });

  test("reset returns the original game (deep equal)", () => {
    const initial = baseGame();
    const { result } = renderHook(() => useMockGameState(initial));

    act(() => {
      result.current.actions.setPhase("split");
      result.current.actions.setWounds("a", 3);
      result.current.actions.setStatus("b", "dead");
    });
    expect(result.current.game).not.toEqual(initial);

    act(() => result.current.actions.reset());
    expect(result.current.game).toEqual(initial);
  });
});
