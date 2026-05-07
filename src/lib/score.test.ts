import { describe, it, expect } from "vitest";
import type { Player } from "../game/types";
import { cashTotal, shamePenalty, netScore, SHAME_PENALTY } from "./score";

function p(overrides: Partial<Player> = {}): Player {
  return {
    id: "x",
    displayName: "x",
    colorOrAvatar: "generic",
    bullets: [],
    cash: [],
    wounds: 0,
    shame: 0,
    status: "alive",
    effects: [],
    ...overrides,
  };
}

describe("score helpers", () => {
  it("cashTotal sums banknote values", () => {
    expect(cashTotal(p({ cash: [{ id: "a", value: 5000 }, { id: "b", value: 20000 }] }))).toBe(25000);
  });

  it("shamePenalty applies SHAME_PENALTY per shame point", () => {
    expect(shamePenalty(p({ shame: 3 }))).toBe(3 * SHAME_PENALTY);
  });

  it("netScore subtracts shame penalty from cash", () => {
    const player = p({ cash: [{ id: "a", value: 20000 }, { id: "b", value: 20000 }, { id: "c", value: 10000 }], shame: 1 });
    expect(netScore(player)).toBe(50000 - SHAME_PENALTY);
  });

  it("netScore can go negative (shame outweighs hoard)", () => {
    expect(netScore(p({ shame: 2 }))).toBe(-2 * SHAME_PENALTY);
  });
});
