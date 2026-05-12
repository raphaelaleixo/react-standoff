import { countAlive, countDead, countYielded } from "./playerCounts";
import type { Game, Player } from "../game/types";

function p(id: string, status: Player["status"]): Player {
  return {
    id,
    displayName: id.toUpperCase(),
    colorOrAvatar: "generic",
    bullets: [],
    cash: [],
    wounds: 0,
    shame: 0,
    status,
    effects: [],
  };
}

const game = (players: Player[], commits: Game["round"]["commits"]): Game => ({
  seed: "x",
  phase: "in_progress",
  players,
  round: { number: 1, phase: "commit", phaseStartedAt: 0, loot: [], commits, activations: {} },
  bankDeck: [],
  discardedBullets: [],
  variants: { superPowers: false },
});

describe("playerCounts", () => {
  it("counts alive vs dead", () => {
    const g = game([p("a", "alive"), p("b", "alive"), p("c", "dead")], {});
    expect(countAlive(g)).toBe(2);
    expect(countDead(g)).toBe(1);
  });

  it("counts only commits with withdrew=true", () => {
    const g = game(
      [p("a", "alive"), p("b", "alive"), p("c", "alive")],
      {
        a: { withdrew: true },
        b: { bullet: "bang", target: "c" },
        c: { withdrew: false },
      },
    );
    expect(countYielded(g)).toBe(1);
  });
});
